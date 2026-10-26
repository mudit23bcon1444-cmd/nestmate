// middleware/auth.js — JWT access token verification & role/verification guard helpers

const { verifyAccessToken } = require('../utils/tokens');
const User = require('../models/User');

async function isLoggedIn(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('is_active role email_verified');
    if (!user || user.is_active === false) {
      return res.status(403).json({ error: 'Account is suspended or deactivated.' });
    }
    req.user = {
      userId: decoded.userId,
      id: decoded.userId,
      role: user.role || decoded.role,
      email_verified: user.email_verified === true
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired.', expired: true });
    }
    return res.status(403).json({ error: 'Invalid or tampered access token.' });
  }
}

function isOwner(req, res, next) {
  if (req.user && (req.user.role === 'owner' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Owner account required.' });
}

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin account required.' });
}

function requireVerifiedEmail(req, res, next) {
  if (req.user && req.user.email_verified) {
    return next();
  }
  return res.status(403).json({
    code: 'EMAIL_NOT_VERIFIED',
    error: 'Please verify your email address before creating listings or booking accommodations.'
  });
}

module.exports = { isLoggedIn, isOwner, isAdmin, requireVerifiedEmail };
