// middleware/auth.js — JWT access token verification & role guard helpers

const { verifyAccessToken } = require('../utils/tokens');

function isLoggedIn(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      id: decoded.userId,
      role: decoded.role
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

module.exports = { isLoggedIn, isOwner, isAdmin };
