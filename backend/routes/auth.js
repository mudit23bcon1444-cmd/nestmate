const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  completeProfileSchema
} = require('../validators/schemas');

const router = express.Router();

// Forgot-password rate limiter: compound key of IP + email (max 5 per 15 min)
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    return `${req.ip}_${email}`;
  },
  message: {
    message: 'If an account exists with that email, a password reset link has been sent.'
  }
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/verify-email
router.post('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification (authenticated, max 3/hour)
router.post('/resend-verification', isLoggedIn, authController.resendVerification);

// POST /api/auth/forgot-password (rate limited per IP + email, uniform 200 response)
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// POST /api/auth/change-password (authenticated)
router.post('/change-password', isLoggedIn, validate(changePasswordSchema), authController.changePassword);

// GET /api/auth/sessions (authenticated)
router.get('/sessions', isLoggedIn, authController.getSessions);

// DELETE /api/auth/sessions/:id (authenticated)
router.delete('/sessions/:id', isLoggedIn, authController.revokeSession);

// POST /api/auth/logout-all (authenticated)
router.post('/logout-all', isLoggedIn, authController.logoutAll);

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
