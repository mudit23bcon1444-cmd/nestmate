// routes/bookings.js — booking requests

const express = require('express');
const { getDB } = require('../database');
const { isLoggedIn, isOwner } = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings — student sends a booking request
router.post('/', isLoggedIn, (req, res) => {
  try {
    const { listing_id, move_in_date, message } = req.body;

    if (!listing_id || !move_in_date) {
      return res.status(400).json({ error: 'Listing ID and move-in date are required.' });
    }

    const db = getDB();

    // Verify listing exists and is approved + available
    const listing = db.prepare('SELECT * FROM listings WHERE id = ? AND is_approved = 1 AND is_available = 1').get(listing_id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found or not available.' });
    }

    // Prevent owners from booking their own listing
    if (listing.owner_id === req.session.user.id) {
      return res.status(400).json({ error: 'You cannot book your own listing.' });
    }

    // Check for existing pending/accepted booking from same student for same listing
    const existing = db.prepare(`
      SELECT id FROM bookings
      WHERE listing_id = ? AND student_id = ? AND status IN ('pending', 'accepted')
    `).get(listing_id, req.session.user.id);

    if (existing) {
      return res.status(409).json({ error: 'You already have an active booking request for this listing.' });
    }

    const result = db.prepare(`
      INSERT INTO bookings (listing_id, student_id, move_in_date, message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(listing_id, req.session.user.id, move_in_date, message || null);

    return res.status(201).json({
      message: 'Booking request sent successfully. The owner will get back to you.',
      bookingId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /api/bookings/my — student sees their own bookings
router.get('/my', isLoggedIn, (req, res) => {
  try {
    const db = getDB();
    const bookings = db.prepare(`
      SELECT b.*, l.title AS listing_title, l.location AS listing_location,
             l.price AS listing_price, l.image_path AS listing_image,
             u.name AS owner_name, u.email AS owner_email
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON l.owner_id = u.id
      WHERE b.student_id = ?
      ORDER BY b.created_at DESC
    `).all(req.session.user.id);

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Get my bookings error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /api/bookings/owner — owner sees booking requests for their listings
router.get('/owner', isLoggedIn, isOwner, (req, res) => {
  try {
    const db = getDB();
    const bookings = db.prepare(`
      SELECT b.*, l.title AS listing_title, l.location AS listing_location,
             l.price AS listing_price,
             u.name AS student_name, u.email AS student_email
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      JOIN users u ON b.student_id = u.id
      WHERE l.owner_id = ?
      ORDER BY b.created_at DESC
    `).all(req.session.user.id);

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Get owner bookings error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// PATCH /api/bookings/:id — owner accepts or rejects a booking
router.patch('/:id', isLoggedIn, isOwner, (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "accepted" or "rejected".' });
    }

    const db = getDB();
    const booking = db.prepare(`
      SELECT b.*, l.owner_id
      FROM bookings b
      JOIN listings l ON b.listing_id = l.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Ensure only the listing's owner can update the booking
    if (booking.owner_id !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this booking.' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

    return res.status(200).json({ message: `Booking ${status} successfully.`, status });
  } catch (err) {
    console.error('Update booking error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
