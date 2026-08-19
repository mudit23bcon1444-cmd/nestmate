const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret_nestmate_987654321';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_nestmate_123456789';

/**
 * Generates a short-lived JWT Access Token (15 min expiry).
 * Payload contains userId and role.
 */
function generateAccessToken(user) {
  const userId = user.id || user.userId;
  return jwt.sign(
    { userId, role: user.role },
    ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generates a long-lived JWT Refresh Token (7 days expiry) with a unique jti claim.
 * Payload contains userId and jti.
 */
function generateRefreshToken(user) {
  const userId = user.id || user.userId;
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId, jti },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  return { token, jti, expiresAt };
}

/**
 * Verifies an Access Token. Throws JsonWebTokenError or TokenExpiredError on failure.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verifies a Refresh Token. Throws JsonWebTokenError or TokenExpiredError on failure.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
