// routes/admin.js — admin endpoints pointing to adminController

const express = require('express');
const { isLoggedIn, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// GET /api/admin/listings — all listings
router.get('/listings', isLoggedIn, isAdmin, adminController.getAllListings);

// PATCH /api/admin/listings/:id — approve or reject listing
router.patch('/listings/:id', isLoggedIn, isAdmin, adminController.updateListingApproval);

// GET /api/admin/users — all users
router.get('/users', isLoggedIn, isAdmin, adminController.getAllUsers);

// PATCH /api/admin/users/:id/status — toggle user active/suspended status
router.patch('/users/:id/status', isLoggedIn, isAdmin, adminController.updateUserStatus);

// GET /api/admin/logs — admin action logs
router.get('/logs', isLoggedIn, isAdmin, adminController.getAdminLogs);

module.exports = router;
