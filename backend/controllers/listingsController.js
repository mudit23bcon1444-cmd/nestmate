// controllers/listingsController.js — property listings business logic using Mongoose

const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');
const Booking = require('../models/Booking');
const { sendEnquiryEmail } = require('../utils/email');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Safely converts a string to a mongoose ObjectId.
 * Returns null if the string is not a valid 24-hex ObjectId.
 */
function toObjectId(id) {
  if (id && mongoose.Types.ObjectId.isValid(String(id)) && String(id).match(/^[0-9a-fA-F]{24}$/)) {
    return new mongoose.Types.ObjectId(String(id));
  }
  return null;
}

async function findModelById(Model, id) {
  if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
    return Model.findById(id);
  }
  return null;
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/listings
exports.getAllListings = asyncHandler(async (req, res) => {
  const { location, search, room_type, amenities, minPrice, maxPrice, page, limit, sort } = req.query;

  // 1. Build initial $match stage
  const matchStage = { is_approved: 1, is_available: 1 };

  // ReDoS safe: capped at 50 chars and metacharacters escaped
  if (location && String(location).trim()) {
    const safeLoc = escapeRegex(String(location).trim().slice(0, 50));
    matchStage.location = { $regex: safeLoc, $options: 'i' };
  }

  if (search && String(search).trim()) {
    const safeSearch = escapeRegex(String(search).trim().slice(0, 50));
    matchStage.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { location: { $regex: safeSearch, $options: 'i' } }
    ];
  }

  if (room_type && ['single', 'shared', 'studio', 'apartment'].includes(String(room_type).trim())) {
    matchStage.room_type = String(room_type).trim();
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

  // 4. Sorting & Pagination
  let sortOption = { created_at: -1 };
  if (sort === 'price_asc') {
    sortOption = { price: 1, created_at: -1 };
  } else if (sort === 'price_desc') {
    sortOption = { price: -1, created_at: -1 };
  } else if (sort === 'newest') {
    sortOption = { created_at: -1 };
  } else if (requestedAmenities.length > 0) {
    sortOption = { matching_amenities_count: -1, created_at: -1 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 6));
  const skip = (pageNum - 1) * limitNum;

  pipeline.push({
    $facet: {
      listings: [
        { $sort: sortOption },
        { $skip: skip },
        { $limit: limitNum },
        {
          $project: {
            owner_doc: 0
          }
        }
      ],
      totalCount: [
        { $count: 'count' }
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
  const total = (result && result.totalCount && result.totalCount[0] && result.totalCount[0].count) || 0;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const amenitiesBreakdown = (result && result.amenitiesBreakdown) || [];

  return res.status(200).json({
    listings,
    pagination: {
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages
    },
    amenitiesBreakdown
  });
});

// GET /api/listings/owner/mine
exports.getOwnerListings = asyncHandler(async (req, res) => {
  const ownerId = toObjectId(req.user.id);
  if (!ownerId) {
    return res.status(400).json({ error: 'Invalid user ID in token.' });
  }

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
  const { title, location, price, description, amenities, room_type, latitude, longitude } = req.body;

  if (!title || !location || !price) {
    return res.status(400).json({ error: 'Title, location, and price are required.' });
  }

  const parsedPrice = parseInt(price, 10);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }

  let parsedLat = (latitude !== undefined && latitude !== null && latitude !== '') ? parseFloat(latitude) : null;
  let parsedLng = (longitude !== undefined && longitude !== null && longitude !== '') ? parseFloat(longitude) : null;

  if (parsedLat !== null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
    return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
  }
  if (parsedLng !== null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
    return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
  }

  const ownerId = toObjectId(req.user.id);
  if (!ownerId) {
    return res.status(400).json({ error: 'Invalid user ID in token.' });
  }

  const imagePath = req.file ? 'uploads/' + req.file.filename : null;

  let parsedAmenities = [];
  if (Array.isArray(amenities)) {
    parsedAmenities = amenities.map(a => String(a).trim()).filter(Boolean);
  } else if (typeof amenities === 'string' && amenities.trim()) {
    parsedAmenities = amenities.split(',').map(a => a.trim()).filter(Boolean);
  }

  let locationGeo = undefined;
  if (parsedLat !== null && parsedLng !== null) {
    locationGeo = {
      type: 'Point',
      coordinates: [parsedLng, parsedLat]
    };
  }

  const listing = await Listing.create({
    owner_id: ownerId,
    title: title.trim(),
    location: location.trim(),
    price: parsedPrice,
    description: description ? description.trim() : null,
    amenities: parsedAmenities,
    room_type: (room_type && ['single', 'shared', 'studio', 'apartment'].includes(room_type)) ? room_type : 'single',
    image_path: imagePath,
    images: imagePath ? [imagePath] : [],
    latitude: parsedLat,
    longitude: parsedLng,
    location_geo: locationGeo,
    is_approved: 0,
    is_available: 1
  });

  return res.status(201).json({
    message: 'Listing submitted for physical verification by admin. GPS coordinates and photos recorded.',
    listingId: listing._id
  });
});

// GET /api/listings/map
exports.getMapListings = asyncHandler(async (req, res) => {
  const { bbox } = req.query; // ?bbox=minLng,minLat,maxLng,maxLat
  const matchStage = { is_approved: 1, is_available: 1, location_geo: { $exists: true, $ne: null } };

  if (bbox && typeof bbox === 'string') {
    const parts = bbox.split(',').map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      const [minLng, minLat, maxLng, maxLat] = parts;
      matchStage.location_geo = {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat]
          ]
        }
      };
    }
  }

  const listings = await Listing.find(matchStage)
    .select('_id title price location_geo')
    .limit(500)
    .lean();

  const mapped = listings.map(l => ({
    id: l._id,
    title: l.title,
    price: l.price,
    coordinates: l.location_geo && l.location_geo.coordinates ? l.location_geo.coordinates : null
  }));

  return res.status(200).json({ listings: mapped });
});

// PUT /api/listings/:id
exports.updateListing = asyncHandler(async (req, res) => {
  const listing = await findModelById(Listing, req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const currentUserId = String(req.user.id);
  if (String(listing.owner_id) !== currentUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to update this listing.' });
  }

  const { title, location, price, description, amenities, room_type, latitude, longitude } = req.body;

  if (title !== undefined) listing.title = String(title).trim();
  if (location !== undefined) listing.location = String(location).trim();
  if (price !== undefined) {
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }
    listing.price = parsedPrice;
  }
  if (description !== undefined) listing.description = description ? String(description).trim() : null;
  if (room_type !== undefined && ['single', 'shared', 'studio', 'apartment'].includes(room_type)) {
    listing.room_type = room_type;
  }
  if (amenities !== undefined) {
    listing.amenities = Array.isArray(amenities)
      ? amenities.map(a => String(a).trim()).filter(Boolean)
      : String(amenities).split(',').map(a => a.trim()).filter(Boolean);
  }
  if (latitude !== undefined && longitude !== undefined) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      listing.latitude = lat;
      listing.longitude = lng;
      listing.location_geo = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }
  }

  await listing.save();
  return res.status(200).json({ message: 'Listing updated successfully.', listing });
});

// PATCH /api/listings/:id/availability
exports.toggleAvailability = asyncHandler(async (req, res) => {
  const listing = await findModelById(Listing, req.params.id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found.' });
  }

  const currentUserId = String(req.user.id);

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

  const currentUserId = String(req.user.id);

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
