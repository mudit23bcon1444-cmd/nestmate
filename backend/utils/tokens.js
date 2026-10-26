const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function getSecret(name) {
  const secret = process.env[name];
  if (!secret || secret.length < 32) {
    throw new Error(`Fatal Configuration Error: ${name} must be set in environment and be at least 32 characters long.`);
  }
  return secret;
}

const ACCESS_SECRET = getSecret('ACCESS_TOKEN_SECRET');
const REFRESH_SECRET = getSecret('REFRESH_TOKEN_SECRET');

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
