// middleware/auth.js — session guard helpers

function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated. Please log in.' });
}

function isOwner(req, res, next) {
  if (req.session && req.session.user && (req.session.user.role === 'owner' || req.session.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Owner account required.' });
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied. Admin account required.' });
}

module.exports = { isLoggedIn, isOwner, isAdmin };
