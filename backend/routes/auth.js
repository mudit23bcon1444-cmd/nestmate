// routes/auth.js — auth endpoints pointing to authController

const express = require('express');
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/refresh — token rotation endpoint
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me
router.get('/me', isLoggedIn, authController.getMe);

// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/complete-profile
router.post('/complete-profile', isLoggedIn, authController.completeProfile);

module.exports = router;
