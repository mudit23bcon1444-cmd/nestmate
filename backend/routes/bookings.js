// routes/bookings.js — booking endpoints pointing to bookingsController

const express = require('express');
const { isLoggedIn, isOwner } = require('../middleware/auth');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

// POST /api/bookings — create booking request
router.post('/', isLoggedIn, bookingsController.createBooking);

// GET /api/bookings/my — student bookings
router.get('/my', isLoggedIn, bookingsController.getMyBookings);

// GET /api/bookings/owner — owner booking requests
router.get('/owner', isLoggedIn, isOwner, bookingsController.getOwnerBookings);

// PATCH /api/bookings/:id — update booking status
router.patch('/:id', isLoggedIn, isOwner, bookingsController.updateBookingStatus);

module.exports = router;
