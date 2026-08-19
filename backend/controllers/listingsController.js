// controllers/listingsController.js — property listings business logic using Mongoose

const Listing = require('../models/Listing');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Booking = require('../models/Booking');
const { sendEnquiryEmail } = require('../utils/email');
const asyncHandler = require('../utils/asyncHandler');

async function findModelById(Model, id) {
  if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
    return Model.findById(id);
  }
  return null;
}

// GET /api/listings
exports.getAllListings = asyncHandler(async (req, res) => {
  const { location, amenities, minPrice, maxPrice } = req.query;

  // 1. Build initial $match stage
  const matchStage = { is_approved: 1, is_available: 1 };

  if (location && location.trim()) {
    matchStage.location = { $regex: location.trim(), $options: 'i' };
  }

  if (minPrice || maxPrice) {
    matchStage.price = {};
    if (minPrice && !isNaN(Number(minPrice))) {
      matchStage.price.$gte = Number(minPrice);
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      matchStage.price.$lte = Number(maxPrice);
    }
  }

  let requestedAmenities = [];
  if (amenities) {
    requestedAmenities = Array.isArray(amenities)
      ? amenities.map(a => String(a).trim()).filter(Boolean)
      : String(amenities).split(',').map(a => a.trim()).filter(Boolean);
  }

  if (requestedAmenities.length > 0) {
    // Exact array matching for normalized string array
    matchStage.amenities = {
      $all: requestedAmenities
    };
  }

  // 2. Build Pipeline Stages
  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'owner_id',
        foreignField: '_id',
        as: 'owner_doc'
      }
    },
    {
      $unwind: {
        path: '$owner_doc',
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  // 3. Add fields for ID mapping & matching score calculation
  const addFieldsStage = {
    id: '$_id',
    owner_id: '$owner_id',
    owner_name: '$owner_doc.name',
    owner_email: '$owner_doc.email'
  };

  if (requestedAmenities.length > 0) {
    addFieldsStage.matching_amenities_count = {
      $size: {
        $setIntersection: [
          '$amenities',
          requestedAmenities
        ]
      }
    };
  }

  pipeline.push({ $addFields: addFieldsStage });

  // 4. Facet Stage: Listings + Real-Time Amenities Breakdown
  const sortOption = requestedAmenities.length > 0
    ? { matching_amenities_count: -1, created_at: -1 }
    : { created_at: -1 };

  pipeline.push({
    $facet: {
      listings: [
        { $sort: sortOption },
        {
          $project: {
            owner_doc: 0
          }
        }
      ],
      amenitiesBreakdown: [
        { $unwind: '$amenities' },
        {
          $group: {
            _id: '$amenities',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]
    }
  });

  const [result] = await Listing.aggregate(pipeline);

  const listings = (result && result.listings) || [];
  const amenitiesBreakdown = (result && result.amenitiesBreakdown) || [];

  return res.status(200).json({
    listings,
    amenitiesBreakdown
  });
});

// GET /api/listings/owner/mine
exports.getOwnerListings = asyncHandler(async (req, res) => {
  const ownerUser = await findModelById(User, req.user.id);
  const ownerId = ownerUser ? ownerUser._id : req.user.id;

  const rawListings = await Listing.find({ owner_id: ownerId })
    .sort({ created_at: -1 })
    .lean();

  const listings = rawListings.map(l => ({
    ...l,
    id: l._id
  }));

  return res.status(200).json({ listings });
});

// GET /api/listings/:id
exports.getListingById = asyncHandler(async (req, res) => {
  const listingDoc = await findModelById(Listing, req.params.id);
  if (!listingDoc) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const populated = await Listing.findById(listingDoc._id).populate('owner_id', 'name email').lean();
  if (!populated) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const listing = {
    ...populated,
    id: populated._id,
    owner_name: populated.owner_id ? populated.owner_id.name : null,
    owner_email: populated.owner_id ? populated.owner_id.email : null
  };

  return res.status(200).json({ listing });
});

// POST /api/listings
exports.createListing = asyncHandler(async (req, res) => {
  const { title, location, price, description, amenities } = req.body;

  if (!title || !location || !price) {
    return res.status(400).json({ error: 'Title, location, and price are required.' });
  }

  const parsedPrice = parseInt(price, 10);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }

  const ownerUser = await findModelById(User, req.user.id);
  const ownerId = ownerUser ? ownerUser._id : req.user.id;

  const imagePath = req.file ? 'uploads/' + req.file.filename : null;

  let parsedAmenities = [];
  if (Array.isArray(amenities)) {
    parsedAmenities = amenities.map(a => String(a).trim()).filter(Boolean);
  } else if (typeof amenities === 'string' && amenities.trim()) {
    parsedAmenities = amenities.split(',').map(a => a.trim()).filter(Boolean);
  }

  const listing = await Listing.create({
    owner_id: ownerId,
    title: title.trim(),
    location: location.trim(),
    price: parsedPrice,
    description: description ? description.trim() : null,
    amenities: parsedAmenities,
    image_path: imagePath,
    is_approved: 0,
    is_available: 1
  });

  return res.status(201).json({
    message: 'Listing submitted for review. It will be visible once approved by admin.',
    listingId: listing._id
  });
});

// PATCH /api/listings/:id/availability
exports.toggleAvailability = asyncHandler(async (req, res) => {
  const listing = await findModelById(Listing, req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const userDoc = await findModelById(User, req.user.id);
  const currentUserId = userDoc ? String(userDoc._id) : String(req.user.id);

  if (String(listing.owner_id) !== currentUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to modify this listing.' });
  }

  const newAvailability = Number(listing.is_available) === 1 ? 0 : 1;
  listing.is_available = newAvailability;
  await listing.save();

  return res.status(200).json({
    message: `Listing marked as ${newAvailability === 1 ? 'available' : 'unavailable'}.`,
    is_available: newAvailability
  });
});

// DELETE /api/listings/:id
exports.deleteListing = asyncHandler(async (req, res) => {
  const listing = await findModelById(Listing, req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const userDoc = await findModelById(User, req.user.id);
  const currentUserId = userDoc ? String(userDoc._id) : String(req.user.id);

  if (String(listing.owner_id) !== currentUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to delete this listing.' });
  }

  await Booking.deleteMany({ listing_id: listing._id });
  await Listing.findByIdAndDelete(listing._id);

  return res.status(200).json({ message: 'Listing deleted successfully.' });
});

// POST /api/listings/enquire/:propertyId
exports.sendEnquiry = asyncHandler(async (req, res) => {
  const { studentPhone, message } = req.body;
  const propertyId = req.params.propertyId;

  if (!studentPhone) {
    return res.status(400).json({ error: 'Phone number is required to enquire.' });
  }

  const currentUser = await findModelById(User, req.user.id);
  const studentName = currentUser ? currentUser.name : 'Student';

  const listing = await findModelById(Listing, propertyId);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const ownerUser = await User.findById(listing.owner_id);
  const ownerEmail = ownerUser ? ownerUser.email : null;
  const ownerName = ownerUser ? ownerUser.name : null;

  await Enquiry.create({
    listing_id: listing._id,
    student_name: studentName,
    student_phone: studentPhone,
    message: message || ''
  });

  if (ownerEmail) {
    await sendEnquiryEmail(
      ownerEmail,
      ownerName,
      listing.title,
      studentName,
      studentPhone,
      message
    );
  }

  return res.status(200).json({ message: 'Enquiry sent successfully.' });
});
