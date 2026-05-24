// routes/listings.js — CRUD for property listings

const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDB } = require('../database');
const { isLoggedIn, isOwner } = require('../middleware/auth');
const { sendEnquiryEmail } = require('../utils/email');

const router = express.Router();

// Multer config — store images in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'listing-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files (jpg, png, webp) are allowed.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/listings — all approved + available listings (public)
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { location } = req.query;

    let query = `
      SELECT l.*, u.name AS owner_name
      FROM listings l
      JOIN users u ON l.owner_id = u.id
      WHERE l.is_approved = 1 AND l.is_available = 1
    `;
    const params = [];

    if (location && location.trim()) {
      query += ' AND LOWER(l.location) LIKE ?';
      params.push(`%${location.trim().toLowerCase()}%`);
    }

    query += ' ORDER BY l.created_at DESC';

    const listings = db.prepare(query).all(...params);
    return res.status(200).json({ listings });
  } catch (err) {
    console.error('Get listings error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /api/listings/owner/mine — owner sees their own listings (MUST be before /:id)
router.get('/owner/mine', isLoggedIn, isOwner, (req, res) => {
  try {
    const db = getDB();
    const listings = db.prepare(`
      SELECT * FROM listings WHERE owner_id = ? ORDER BY created_at DESC
    `).all(req.session.user.id);

    return res.status(200).json({ listings });
  } catch (err) {
    console.error('Get owner listings error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /api/listings/:id — single listing (public)
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const listing = db.prepare(`
      SELECT l.*, u.name AS owner_name, u.email AS owner_email
      FROM listings l
      JOIN users u ON l.owner_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    return res.status(200).json({ listing });
  } catch (err) {
    console.error('Get listing error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// POST /api/listings — owner creates a new listing (with optional image)
router.post('/', isLoggedIn, isOwner, upload.single('image'), (req, res) => {
  try {
    const { title, location, price, description, amenities } = req.body;

    if (!title || !location || !price) {
      return res.status(400).json({ error: 'Title, location, and price are required.' });
    }

    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'Price must be a positive number.' });
    }

    const imagePath = req.file ? 'uploads/' + req.file.filename : null;
    const db = getDB();

    const result = db.prepare(`
      INSERT INTO listings (owner_id, title, location, price, description, amenities, image_path, is_approved, is_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
    `).run(
      req.session.user.id,
      title.trim(),
      location.trim(),
      parsedPrice,
      description ? description.trim() : null,
      amenities ? amenities.trim() : null,
      imagePath
    );

    return res.status(201).json({
      message: 'Listing submitted for review. It will be visible once approved by admin.',
      listingId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Create listing error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// PATCH /api/listings/:id/availability — owner toggles availability
router.patch('/:id/availability', isLoggedIn, isOwner, (req, res) => {
  try {
    const db = getDB();
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Only the owner of this listing (or admin) can toggle
    if (listing.owner_id !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to modify this listing.' });
    }

    const newAvailability = listing.is_available === 1 ? 0 : 1;
    db.prepare('UPDATE listings SET is_available = ? WHERE id = ?').run(newAvailability, req.params.id);

    return res.status(200).json({
      message: `Listing marked as ${newAvailability === 1 ? 'available' : 'unavailable'}.`,
      is_available: newAvailability
    });
  } catch (err) {
    console.error('Toggle availability error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// DELETE /api/listings/:id — owner deletes their listing
router.delete('/:id', isLoggedIn, isOwner, (req, res) => {
  try {
    const db = getDB();
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.owner_id !== req.session.user.id && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this listing.' });
    }

    db.prepare('DELETE FROM bookings WHERE listing_id = ?').run(req.params.id);
    db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);

    return res.status(200).json({ message: 'Listing deleted successfully.' });
  } catch (err) {
    console.error('Delete listing error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// POST /api/listings/enquire/:propertyId — student enquires about a property
router.post('/enquire/:propertyId', isLoggedIn, async (req, res) => {
  try {
    const { studentPhone, message } = req.body;
    const studentName = req.session.user.name;
    const propertyId = req.params.propertyId;

    if (!studentPhone) {
      return res.status(400).json({ error: 'Phone number is required to enquire.' });
    }

    const db = getDB();
    
    // Check if listing exists and get owner details
    const listing = db.prepare(`
      SELECT l.*, u.email as owner_email, u.name as owner_name 
      FROM listings l
      JOIN users u ON l.owner_id = u.id
      WHERE l.id = ?
    `).get(propertyId);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Save enquiry to DB
    db.prepare(`
      INSERT INTO enquiries (listing_id, student_name, student_phone, message)
      VALUES (?, ?, ?, ?)
    `).run(propertyId, studentName, studentPhone, message || '');

    // Send email notification to owner
    if (listing.owner_email) {
      await sendEnquiryEmail(
        listing.owner_email,
        listing.owner_name,
        listing.title,
        studentName,
        studentPhone,
        message
      );
    }

    return res.status(200).json({ message: 'Enquiry sent successfully.' });
  } catch (err) {
    console.error('Enquiry error:', err);
    return res.status(500).json({ error: 'Failed to send enquiry.' });
  }
});

// (owner/mine route moved above /:id — see line 62)

module.exports = router;
