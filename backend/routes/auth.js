const express = require('express');
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  completeProfileSchema
} = require('../validators/schemas');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification (authenticated, max 3/hour)
router.post('/resend-verification', isLoggedIn, authController.resendVerification);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh — token rotation endpoint
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me
router.get('/me', isLoggedIn, authController.getMe);

// POST /api/auth/send-otp
router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);

// POST /api/auth/complete-profile
router.post('/complete-profile', isLoggedIn, validate(completeProfileSchema), authController.completeProfile);

module.exports = router;
