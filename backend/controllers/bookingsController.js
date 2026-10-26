// controllers/bookingsController.js — booking request management logic using Mongoose

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

async function findModelById(Model, id) {
  if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
    return Model.findById(id);
  }
  return null;
}

// POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { listing_id, move_in_date, message } = req.body;

  if (!listing_id || !move_in_date) {
    return res.status(400).json({ error: 'Listing ID and move-in date are required.' });
  }

  const listing = await findModelById(Listing, listing_id);
  if (!listing || Number(listing.is_approved) !== 1 || Number(listing.is_available) !== 1) {
    return res.status(404).json({ error: 'Listing not found or not available.' });
  }

  const studentUser = await findModelById(User, req.user.id);
  const studentId = studentUser ? studentUser._id : req.user.id;

  if (String(listing.owner_id) === String(studentId)) {
    return res.status(400).json({ error: 'You cannot book your own listing.' });
  }

  const existing = await Booking.findOne({
    listing_id: listing._id,
    student_id: studentId,
    status: { $in: ['pending', 'accepted'] }
  });

  if (existing) {
    return res.status(409).json({ error: 'You already have an active booking request for this listing.' });
  }

  const newBooking = await Booking.create({
    listing_id: listing._id,
    student_id: studentId,
    move_in_date,
    message: message || null,
    status: 'pending'
  });

  return res.status(201).json({
    message: 'Booking request sent successfully. The owner will get back to you.',
    bookingId: newBooking._id
  });
});

// GET /api/bookings/my
exports.getMyBookings = asyncHandler(async (req, res) => {
  const studentUser = await findModelById(User, req.user.id);
  const studentId = studentUser ? studentUser._id : req.user.id;

  const rawBookings = await Booking.find({ student_id: studentId })
    .populate({
      path: 'listing_id',
      populate: { path: 'owner_id', select: 'name email' }
    })
    .sort({ created_at: -1 })
    .lean();

  const bookings = rawBookings.map(b => {
    const l = b.listing_id || {};
    const owner = l.owner_id || {};
    return {
      ...b,
      id: b._id,
      listing_id: l._id ? String(l._id) : (b.listing_id ? String(b.listing_id) : null),
      listing_title: l.title,
      listing_location: l.location,
      listing_price: l.price,
      listing_image: l.image_path,
      owner_name: owner.name,
      owner_email: owner.email
    };
  });

  return res.status(200).json({ bookings });
});

// GET /api/bookings/owner
exports.getOwnerBookings = asyncHandler(async (req, res) => {
  const ownerUser = await findModelById(User, req.user.id);
  const ownerId = ownerUser ? ownerUser._id : req.user.id;

  const ownerListings = await Listing.find({ owner_id: ownerId }).select('_id');
  const listingIds = ownerListings.map(l => l._id);

  const rawBookings = await Booking.find({ listing_id: { $in: listingIds } })
    .populate('listing_id')
    .populate('student_id', 'name email')
    .sort({ created_at: -1 })
    .lean();

  const bookings = rawBookings.map(b => {
    const l = b.listing_id || {};
    const student = b.student_id || {};
    return {
      ...b,
      id: b._id,
      listing_title: l.title,
      listing_location: l.location,
      listing_price: l.price,
      student_name: student.name,
      student_email: student.email
    };
  });

  return res.status(200).json({ bookings });
});

// PATCH /api/bookings/:id
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "accepted" or "rejected".' });
  }

  const booking = await findModelById(Booking, req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (booking.status !== 'pending') {
    return res.status(400).json({ error: `Cannot update booking. Current status is already "${booking.status}".` });
  }

  const listing = await findModelById(Listing, booking.listing_id);
  const ownerId = listing ? String(listing.owner_id) : null;
  
  const userDoc = await findModelById(User, req.user.id);
  const currentUserId = userDoc ? String(userDoc._id) : String(req.user.id);

  if (ownerId !== currentUserId && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to update this booking.' });
  }

  if (status === 'rejected') {
    booking.status = 'rejected';
    await booking.save();
    return res.status(200).json({ message: 'Booking rejected successfully.', status: 'rejected' });
  }

  // Handle 'accepted' atomically with a MongoDB session transaction
  const session = await mongoose.startSession();
  try {
    let conflict = false;
    await session.withTransaction(async () => {
      // Atomic condition: listing must still have is_available: 1
      const updatedListing = await Listing.findOneAndUpdate(
        { _id: booking.listing_id, is_available: 1 },
        { is_available: 0 },
        { session, new: true }
      );

      if (!updatedListing) {
        conflict = true;
        throw new Error('CONFLICT_UNAVAILABLE');
      }

      booking.status = 'accepted';
      await booking.save({ session });

      // Auto-reject other pending bookings for this listing
      await Booking.updateMany(
        {
          listing_id: booking.listing_id,
          _id: { $ne: booking._id },
          status: 'pending'
        },
        { status: 'rejected' },
        { session }
      );
    });

    return res.status(200).json({ message: 'Booking accepted successfully. Other pending requests rejected.', status: 'accepted' });
  } catch (err) {
    if (err.message === 'CONFLICT_UNAVAILABLE') {
      return res.status(409).json({ error: 'Property is no longer available. Another booking was already accepted.' });
    }
    throw err;
  } finally {
    await session.endSession();
  }
});
