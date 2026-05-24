// routes/admin.js — admin approve/reject listings, view all users

const express = require('express');
const { getDB } = require('../database');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/listings — all listings including pending ones
router.get('/listings', isAdmin, (req, res) => {
  try {
    const db = getDB();
    const listings = db.prepare(`
      SELECT l.*, u.name AS owner_name, u.email AS owner_email
      FROM listings l
      JOIN users u ON l.owner_id = u.id
      ORDER BY l.created_at DESC
    `).all();

    return res.status(200).json({ listings });
  } catch (err) {
    console.error('Admin get listings error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// PATCH /api/admin/listings/:id — approve or reject a listing
router.patch('/listings/:id', isAdmin, (req, res) => {
  try {
    const { is_approved } = req.body;

    // is_approved: 1 = approved, 2 = rejected
    if (![1, 2].includes(Number(is_approved))) {
      return res.status(400).json({ error: 'is_approved must be 1 (approve) or 2 (reject).' });
    }

    const db = getDB();
    const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    db.prepare('UPDATE listings SET is_approved = ? WHERE id = ?').run(Number(is_approved), req.params.id);

    // Log the action
    const action = Number(is_approved) === 1
      ? `Approved listing #${req.params.id}`
      : `Rejected listing #${req.params.id}`;

    db.prepare('INSERT INTO admin_log (action, done_by) VALUES (?, ?)').run(action, req.session.user.id);

    const status = Number(is_approved) === 1 ? 'approved' : 'rejected';
    return res.status(200).json({ message: `Listing ${status} successfully.`, is_approved: Number(is_approved) });
  } catch (err) {
    console.error('Admin update listing error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /api/admin/users — all users
router.get('/users', isAdmin, (req, res) => {
  try {
    const db = getDB();
    // Never return password hashes
    const users = db.prepare(`
      SELECT id, name, email, role, (
        SELECT COUNT(*) FROM listings WHERE owner_id = users.id
      ) AS listing_count
      FROM users
      ORDER BY id ASC
    `).all();

    return res.status(200).json({ users });
  } catch (err) {
    console.error('Admin get users error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET /api/admin/logs — admin action log
router.get('/logs', isAdmin, (req, res) => {
  try {
    const db = getDB();
    const logs = db.prepare(`
      SELECT al.*, u.name AS admin_name
      FROM admin_log al
      LEFT JOIN users u ON al.done_by = u.id
      ORDER BY al.created_at DESC
      LIMIT 100
    `).all();

    return res.status(200).json({ logs });
  } catch (err) {
    console.error('Admin get logs error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
