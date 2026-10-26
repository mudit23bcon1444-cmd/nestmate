const express = require('express');
const { isLoggedIn, isOwner } = require('../middleware/auth');
const bookingsController = require('../controllers/bookingsController');
const validate = require('../middleware/validate');
const { createBookingSchema, updateBookingStatusSchema } = require('../validators/schemas');

const router = express.Router();

// POST /api/bookings — create booking request
router.post('/', isLoggedIn, validate(createBookingSchema), bookingsController.createBooking);

// GET /api/bookings/my — student bookings
router.get('/my', isLoggedIn, bookingsController.getMyBookings);

// GET /api/bookings/owner — owner booking requests
router.get('/owner', isLoggedIn, isOwner, bookingsController.getOwnerBookings);

// PATCH /api/bookings/:id — update booking status
router.patch('/:id', isLoggedIn, isOwner, validate(updateBookingStatusSchema), bookingsController.updateBookingStatus);

module.exports = router;
