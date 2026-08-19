// routes/admin.js — admin endpoints pointing to adminController

const express = require('express');
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// GET /api/admin/listings — all listings
router.get('/listings', isAdmin, adminController.getAllListings);

// PATCH /api/admin/listings/:id — approve or reject listing
router.patch('/listings/:id', isAdmin, adminController.updateListingApproval);

// GET /api/admin/users — all users
router.get('/users', isAdmin, adminController.getAllUsers);

// GET /api/admin/logs — admin action logs
router.get('/logs', isAdmin, adminController.getAdminLogs);

module.exports = router;
