// utils/passwordPolicy.js — Shared NIST-compliant password validator & bcrypt cost-12 hasher
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const zxcvbn = require('zxcvbn');

const BCRYPT_COST = 12;

/**
 * Validates password against NIST guidelines:
 * 1. Min 10 characters
 * 2. Max 72 BYTES (bcrypt silently truncates at 72 bytes)
 * 3. No arbitrary composition rules (no mandatory symbols/numbers)
 * 4. Reject zxcvbn score < 3 (with user inputs: email, name, etc.)
 * 5. Have I Been Pwned k-anonymity range check (1.5s timeout, fail-open)
 */
async function validatePassword(password, userInputs = []) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }

  // 1. Min length 10 characters
  if (password.length < 10) {
    return { valid: false, error: 'Password must be at least 10 characters long.' };
  }

  // 2. Max 72 BYTES (Buffer.byteLength, bcrypt truncates beyond 72 bytes)
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return { valid: false, error: 'Password cannot exceed 72 bytes in length.' };
  }

  // 3. zxcvbn score check (reject score < 3)
  const sanitizedInputs = (Array.isArray(userInputs) ? userInputs : [userInputs])
    .filter(Boolean)
    .map(v => String(v).toLowerCase().trim());

  const zxcvbnResult = zxcvbn(password, sanitizedInputs);
  if (zxcvbnResult.score < 3) {
    const feedbackMsg = zxcvbnResult.feedback?.warning || 'Password is too weak or easily guessable. Please choose a stronger phrase.';
    return { valid: false, error: feedbackMsg, score: zxcvbnResult.score };
  }

  // 4. Have I Been Pwned k-anonymity range check (1.5s timeout, fail-open)
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(1500),
      headers: { 'User-Agent': 'NestMate-Security-Validator' }
    });

    if (response.ok) {
      const text = await response.text();
      const lines = text.split('\n');
      const hasBreach = lines.some(line => line.trim().startsWith(suffix));
      if (hasBreach) {
        return {
          valid: false,
          error: 'This password has appeared in a known public data breach. Please choose a different password.'
        };
      }
    }
  } catch (err) {
    // Fail-open: network down or timeout should not block users
  }

  return { valid: true, score: zxcvbnResult.score };
}

/**
 * Hashes password using bcrypt with cost 12
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Checks if stored password hash needs rehash to cost 12
 */
function needsRehash(storedHash) {
  if (!storedHash || !storedHash.startsWith('$2')) return false;
  try {
    const rounds = bcrypt.getRounds(storedHash);
    return rounds < BCRYPT_COST;
  } catch (_) {
    return false;
  }
}

module.exports = {
  validatePassword,
  hashPassword,
  needsRehash,
  BCRYPT_COST
};
