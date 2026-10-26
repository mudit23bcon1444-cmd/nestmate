// controllers/authController.js — authentication & profile management logic with JWT & Refresh Token Rotation using Mongoose

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const OtpStore = require('../models/OtpStore');
const OtpLog = require('../models/OtpLog');
const RefreshToken = require('../models/RefreshToken');
const EmailToken = require('../models/EmailToken');
const SecurityEvent = require('../models/SecurityEvent');
const { sendOTP } = require('../utils/sms');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendNewSignInEmail
} = require('../utils/mailer');
const {
  validatePassword,
  hashPassword,
  needsRehash
} = require('../utils/passwordPolicy');
const { parseDevice, maskIp } = require('../utils/sessionHelper');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const asyncHandler = require('../utils/asyncHandler');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

async function findUserById(id) {
  if (id && String(id).match(/^[0-9a-fA-F]{24}$/)) {
    return User.findById(id);
  }
  return null;
}

/**
 * Helper to generate access & refresh token pair, persist refresh jti to MongoDB, and set HTTP-only cookie.
 */
async function issueTokensAndSetCookie(user, res, req = null, inheritedLastUsedAt = null) {
  const userId = user.id || user._id || user.userId;
  const userPayload = { id: String(userId), role: user.role };
  const accessToken = generateAccessToken(userPayload);
  const { token: refreshToken, jti, expiresAt } = generateRefreshToken(userPayload);

  await RefreshToken.create({
    user_id: userId,
    jti,
    expires_at: new Date(expiresAt),
    ip: req ? (req.ip || req.connection?.remoteAddress) : null,
    user_agent: req ? req.headers['user-agent'] : null,
    last_used_at: inheritedLastUsedAt || new Date()
  });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
  return accessToken;
}

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const allowedRoles = ['student', 'owner'];
  const userRole = allowedRoles.includes(role) ? role : 'student';

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  // Enforce shared password policy (min 10 chars, max 72 bytes, zxcvbn >= 3, HIBP range check)
  const policyCheck = await validatePassword(password, [normalizedEmail, name]);
  if (!policyCheck.valid) {
    return res.status(400).json({ error: policyCheck.error });
  }

  // Hash with bcrypt cost 12
  const hashedPassword = await hashPassword(password);

  const userDoc = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: userRole,
    email_verified: false
  });

  // Generate single-use verification token (valid 24h)
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await EmailToken.create({
    user_id: userDoc._id,
    type: 'verify',
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  sendVerificationEmail(userDoc, rawToken).catch(err => {
    console.error('[auth] Failed to send verification email on register:', err.message);
  });

  const newUser = {
    id: userDoc._id,
    _id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    email_verified: false
  };

  const accessToken = await issueTokensAndSetCookie(newUser, res, req);

  return res.status(201).json({
    message: 'Account created successfully. Please check your email to verify your account.',
    user: newUser,
    accessToken
  });
});

// POST /api/auth/verify-email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const tokenDoc = await EmailToken.findOne({
    token_hash: tokenHash,
    type: 'verify',
    used_at: null,
    expires_at: { $gt: new Date() }
  });

  if (!tokenDoc) {
    return res.status(400).json({ error: 'Invalid or expired verification token.' });
  }

  tokenDoc.used_at = new Date();
  await tokenDoc.save();

  const user = await User.findById(tokenDoc.user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  user.email_verified = true;
  await user.save();

  await SecurityEvent.create({
    user_id: user._id,
    type: 'email_verified',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null
  });

  return res.status(200).json({ message: 'Email verified successfully.' });
});

// POST /api/auth/resend-verification (authenticated, max 3/hour)
exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.email_verified) {
    return res.status(400).json({ error: 'Email is already verified.' });
  }

  // Rate limit: max 3 per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await EmailToken.countDocuments({
    user_id: user._id,
    type: 'verify',
    created_at: { $gt: oneHourAgo }
  });

  if (recentCount >= 3) {
    return res.status(429).json({ error: 'Too many verification emails requested. Please try again in an hour.' });
  }

  // Invalidate older verify tokens for this user
  await EmailToken.updateMany(
    { user_id: user._id, type: 'verify', used_at: null },
    { $set: { used_at: new Date() } }
  );

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await EmailToken.create({
    user_id: user._id,
    type: 'verify',
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  await sendVerificationEmail(user, rawToken);

  return res.status(200).json({ message: 'Verification email sent.' });
});

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const standardResponse = {
    message: 'If an account exists with that email, a password reset link has been sent.'
  };

  // ALWAYS return the exact same 200 body whether or not account exists
  res.status(200).json(standardResponse);

  // Send the email asynchronously after responding
  if (!email || typeof email !== 'string') return;
  const normalizedEmail = email.toLowerCase().trim();

  setImmediate(async () => {
    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return;

      // Invalidate older reset tokens for this user
      await EmailToken.updateMany(
        { user_id: user._id, type: 'reset', used_at: null },
        { $set: { used_at: new Date() } }
      );

      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await EmailToken.create({
        user_id: user._id,
        type: 'reset',
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      });

      await SecurityEvent.create({
        user_id: user._id,
        type: 'password_reset_requested',
        ip: req.ip || null,
        user_agent: req.headers['user-agent'] || null
      });

      await sendPasswordResetEmail(user, rawToken);
    } catch (err) {
      console.error('[auth] Background forgot-password error:', err.message);
    }
  });
});

// POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const tokenDoc = await EmailToken.findOne({
    token_hash: tokenHash,
    type: 'reset',
    used_at: null,
    expires_at: { $gt: new Date() }
  });

  if (!tokenDoc) {
    return res.status(400).json({ error: 'Invalid or expired password reset link.' });
  }

  const user = await User.findById(tokenDoc.user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Validate new password using shared policy
  const policyCheck = await validatePassword(password, [user.email, user.name]);
  if (!policyCheck.valid) {
    return res.status(400).json({ error: policyCheck.error });
  }

  // Single-use: mark used
  tokenDoc.used_at = new Date();
  await tokenDoc.save();

  // Set new hash using cost 12
  user.password = await hashPassword(password);
  user.password_changed_at = new Date();
  await user.save();

  // DELETE ALL of the user's refresh tokens
  await RefreshToken.deleteMany({ user_id: user._id });

  // Record SecurityEvent
  await SecurityEvent.create({
    user_id: user._id,
    type: 'password_changed',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null
  });

  // Send "your password was changed" email
  sendPasswordChangedEmail(user).catch(err => {
    console.error('[auth] Failed to send password changed notice:', err.message);
  });

  // Do not auto-login
  return res.status(200).json({
    message: 'Password has been reset successfully. Please log in with your new password.'
  });
});

// POST /api/auth/change-password (authenticated)
exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  const user = await User.findById(req.user.id);
  if (!user || !user.password) {
    return res.status(400).json({ error: 'User password not set.' });
  }

  const isCurrentMatch = await bcrypt.compare(current_password, user.password);
  if (!isCurrentMatch) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  // Shared password policy validation
  const policyCheck = await validatePassword(new_password, [user.email, user.name]);
  if (!policyCheck.valid) {
    return res.status(400).json({ error: policyCheck.error });
  }

  user.password = await hashPassword(new_password);
  user.password_changed_at = new Date();
  await user.save();

  // Revoke all OTHER sessions (keep current session)
  let currentJti = null;
  const refreshTokenCookie = req.cookies.refreshToken;
  if (refreshTokenCookie) {
    try {
      const decoded = verifyRefreshToken(refreshTokenCookie);
      currentJti = decoded.jti;
    } catch (_) {}
  }

  if (currentJti) {
    await RefreshToken.deleteMany({ user_id: user._id, jti: { $ne: currentJti } });
  } else {
    await RefreshToken.deleteMany({ user_id: user._id });
  }

  // Record SecurityEvent
  await SecurityEvent.create({
    user_id: user._id,
    type: 'password_changed',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null
  });

  sendPasswordChangedEmail(user).catch(err => {
    console.error('[auth] Failed to send password changed notice:', err.message);
  });

  return res.status(200).json({
    message: 'Password changed successfully. All other sessions have been signed out.'
  });
});

// GET /api/auth/sessions (authenticated)
exports.getSessions = asyncHandler(async (req, res) => {
  let currentJti = null;
  const refreshTokenCookie = req.cookies.refreshToken;
  if (refreshTokenCookie) {
    try {
      const decoded = verifyRefreshToken(refreshTokenCookie);
      currentJti = decoded.jti;
    } catch (_) {}
  }

  const activeTokens = await RefreshToken.find({
    user_id: req.user.id,
    revoked_at: null,
    expires_at: { $gt: new Date() }
  }).sort({ last_used_at: -1, created_at: -1 }).lean();

  const sessions = activeTokens.map(token => ({
    id: token._id,
    device: parseDevice(token.user_agent),
    user_agent: token.user_agent,
    ip: maskIp(token.ip),
    created_at: token.created_at,
    last_used_at: token.last_used_at || token.created_at,
    current: Boolean(currentJti && token.jti === currentJti)
  }));

  return res.status(200).json({ sessions });
});

// DELETE /api/auth/sessions/:id (authenticated)
exports.revokeSession = asyncHandler(async (req, res) => {
  const token = await RefreshToken.findOne({
    _id: req.params.id,
    user_id: req.user.id
  });

  if (!token) {
    return res.status(404).json({ error: 'Session not found or already revoked.' });
  }

  let isCurrent = false;
  const refreshTokenCookie = req.cookies.refreshToken;
  if (refreshTokenCookie) {
    try {
      const decoded = verifyRefreshToken(refreshTokenCookie);
      if (decoded.jti === token.jti) isCurrent = true;
    } catch (_) {}
  }

  await RefreshToken.deleteOne({ _id: token._id });

  await SecurityEvent.create({
    user_id: req.user.id,
    type: 'session_revoked',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null
  });

  if (isCurrent) {
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
  }

  return res.status(200).json({
    message: 'Session revoked successfully.',
    revokedCurrent: isCurrent
  });
});

// POST /api/auth/logout-all (authenticated)
exports.logoutAll = asyncHandler(async (req, res) => {
  await RefreshToken.deleteMany({ user_id: req.user.id });
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  await SecurityEvent.create({
    user_id: req.user.id,
    type: 'logout_all',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null
  });

  return res.status(200).json({ message: 'All active sessions have been signed out.' });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    await SecurityEvent.create({
      user_id: user._id,
      type: 'login_failed',
      ip: req.ip || null,
      user_agent: req.headers['user-agent'] || null
    });
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.is_active === false) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  // On successful login rehash if the stored cost is lower than 12
  if (needsRehash(user.password)) {
    user.password = await hashPassword(password);
    await user.save();
  }

  // Security Event: login_success
  await SecurityEvent.create({
    user_id: user._id,
    type: 'login_success',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null
  });

  // Check if IP + user-agent pair hasn't appeared in this user's events in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const knownLogin = await SecurityEvent.findOne({
    user_id: user._id,
    type: 'login_success',
    ip: req.ip || null,
    user_agent: req.headers['user-agent'] || null,
    created_at: { $gt: thirtyDaysAgo, $lt: new Date(Date.now() - 5000) } // exclude the event just created
  });

  if (!knownLogin && user.email) {
    sendNewSignInEmail(user, {
      ip: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent']
    }).catch(err => {
      console.error('[auth] Failed to send new sign-in security notice:', err.message);
    });
  }

  const sessionUser = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    email_verified: user.email_verified === true
  };

  const accessToken = await issueTokensAndSetCookie(sessionUser, res, req);

  return res.status(200).json({ message: 'Logged in successfully.', user: sessionUser, accessToken });
});

// POST /api/auth/refresh
exports.refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required.' });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }

  const tokenRecord = await RefreshToken.findOne({ jti: decoded.jti });

  if (!tokenRecord) {
    return res.status(401).json({ error: 'Refresh token not recognized. Please log in again.' });
  }

  // Check TTL expiration
  if (new Date(tokenRecord.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
  }

  // Check if token was already revoked
  if (tokenRecord.revoked_at !== null) {
    const elapsed = Date.now() - new Date(tokenRecord.revoked_at).getTime();
    if (elapsed <= 15000 && tokenRecord.replaced_by) {
      // 15-second grace window for multi-tab concurrent refreshes
      const successor = await RefreshToken.findOne({ jti: tokenRecord.replaced_by });
      if (successor && new Date(successor.expires_at) > new Date()) {
        const user = await findUserById(decoded.userId);
        if (user && user.is_active !== false) {
          const newAccessToken = generateAccessToken({ id: String(user._id), role: user.role });
          const userData = {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            email_verified: user.email_verified === true
          };
          return res.status(200).json({ accessToken: newAccessToken, user: userData });
        }
      }
    }

    // Replay outside grace window: token reuse / breach detected -> wipe entire token family
    await RefreshToken.deleteMany({ user_id: decoded.userId });
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.status(401).json({ error: 'Refresh token reuse detected. All sessions revoked.' });
  }

  const user = await findUserById(decoded.userId);
  if (!user || user.is_active === false) {
    return res.status(401).json({ error: 'User not found or account suspended.' });
  }

  // Issue new token pair
  const userId = user.id || user._id;
  const userPayload = { id: String(userId), role: user.role };
  const newAccessToken = generateAccessToken(userPayload);
  const { token: newRefreshToken, jti: newJti, expiresAt } = generateRefreshToken(userPayload);

  // Link old token to new jti via replaced_by and mark revoked
  tokenRecord.revoked_at = new Date();
  tokenRecord.replaced_by = newJti;
  await tokenRecord.save();

  await RefreshToken.create({
    user_id: userId,
    jti: newJti,
    expires_at: new Date(expiresAt),
    ip: req.ip || req.connection?.remoteAddress || tokenRecord.ip,
    user_agent: req.headers['user-agent'] || tokenRecord.user_agent,
    last_used_at: new Date()
  });

  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

  const userData = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    email_verified: user.email_verified === true
  };

  return res.status(200).json({ accessToken: newAccessToken, user: userData });
});

// POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await RefreshToken.updateOne({ jti: decoded.jti }, { revoked_at: new Date() });
    } catch (e) {
      // Token already expired or invalid, fine
    }
  }

  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(200).json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const userId = req.user ? (req.user.userId || req.user.id) : null;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const userDoc = await findUserById(userId);
  if (!userDoc) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const user = {
    id: userDoc._id,
    _id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    role: userDoc.role,
    email_verified: userDoc.email_verified === true
  };

  return res.status(200).json({ user });
});

function getOtpSecret() {
  return process.env.ACCESS_TOKEN_SECRET || 'nestmate_otp_secret_key_minimum_32_characters';
}

function hashOtp(otp) {
  return crypto.createHmac('sha256', getOtpSecret()).update(String(otp).trim()).digest('hex');
}

// POST /api/auth/send-otp
exports.sendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

  const cleanPhone = String(phone).trim();
  const existingRecord = await OtpStore.findOne({ phone: cleanPhone });

  let dailyCount = 0;
  if (existingRecord) {
    if (existingRecord.locked_until && new Date(existingRecord.locked_until) > new Date()) {
      return res.status(403).json({ error: 'Phone locked due to excessive failed attempts. Try again in 15 minutes.' });
    }

    if (existingRecord.last_sent_at) {
      const elapsed = Date.now() - new Date(existingRecord.last_sent_at).getTime();
      if (elapsed < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsed) / 1000);
        return res.status(429).json({ error: `Please wait ${remainingSeconds}s before requesting another OTP.` });
      }
    }

    // Check daily SMS cap (5 per day)
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (existingRecord.daily_reset_at && (Date.now() - new Date(existingRecord.daily_reset_at).getTime() < ONE_DAY)) {
      dailyCount = existingRecord.daily_count || 0;
      if (dailyCount >= 5) {
        return res.status(429).json({ error: 'Daily OTP request limit reached for this phone number. Try again tomorrow.' });
      }
    }
  }

  // Cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OtpStore.findOneAndUpdate(
    { phone: cleanPhone },
    {
      phone: cleanPhone,
      otp: hashedOtp,
      expires_at: expiresAt,
      last_sent_at: new Date(),
      attempt_count: 0,
      locked_until: null,
      daily_count: dailyCount + 1,
      daily_reset_at: (existingRecord && existingRecord.daily_reset_at) || new Date()
    },
    { upsert: true, returnDocument: 'after' }
  );

  await sendOTP(cleanPhone, rawOtp);

  await OtpLog.create({
    phone: cleanPhone,
    action: 'sent',
    ip_address: req.ip
  });

  return res.status(200).json({ message: 'OTP sent successfully.' });
});

// POST /api/auth/verify-otp
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required.' });

  const cleanPhone = String(phone).trim();
  const cleanOtp = String(otp).trim();
  const record = await OtpStore.findOne({ phone: cleanPhone });

  if (record && record.locked_until && new Date(record.locked_until) > new Date()) {
    return res.status(403).json({ error: 'Phone locked due to excessive failed attempts. Try again in 15 minutes.' });
  }

  const candidateHash = hashOtp(cleanOtp);
  let isMatch = false;
  if (record && record.otp && record.otp.length === candidateHash.length) {
    try {
      isMatch = crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(record.otp, 'hex'));
    } catch (e) {
      isMatch = false;
    }
  }

  const isExpired = record && new Date(record.expires_at) < new Date();

  if (!record || !isMatch || isExpired) {
    if (record) {
      const newAttempts = (record.attempt_count || 0) + 1;
      if (newAttempts >= 5) {
        record.attempt_count = newAttempts;
        record.locked_until = new Date(Date.now() + 15 * 60 * 1000);
        await record.save();
        await OtpLog.create({ phone: cleanPhone, action: 'locked', ip_address: req.ip });
        return res.status(403).json({ error: 'Phone locked due to excessive failed attempts. Try again after 15 minutes.' });
      } else {
        record.attempt_count = newAttempts;
        await record.save();
        await OtpLog.create({ phone: cleanPhone, action: 'failed', ip_address: req.ip });
      }
    }

    if (!record || !isMatch) {
      return res.status(401).json({ error: 'Invalid OTP.' });
    }
    if (isExpired) {
      return res.status(401).json({ error: 'OTP has expired.' });
    }
  }

  await OtpStore.deleteOne({ phone: cleanPhone });
  await OtpLog.create({ phone: cleanPhone, action: 'verified', ip_address: req.ip });

  let user = await User.findOne({ phone: cleanPhone });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      name: 'New User',
      role: 'student',
      phone: cleanPhone,
      is_active: true,
      email_verified: false
    });
    isNewUser = true;
  } else if (user.is_active === false) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
  }

  const sessionUser = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    email_verified: user.email_verified === true
  };

  const accessToken = await issueTokensAndSetCookie(sessionUser, res, req);

  return res.status(200).json({ 
    message: 'Logged in successfully.', 
    user: sessionUser,
    isNewUser: isNewUser || !user.email,
    accessToken
  });
});

// POST /api/auth/complete-profile
exports.completeProfile = asyncHandler(async (req, res) => {
  const userId = req.user ? (req.user.userId || req.user.id) : null;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const { name, email, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const allowedRoles = ['student', 'owner'];
  const userRole = allowedRoles.includes(role) ? role : 'student';

  const normalizedEmail = email.toLowerCase().trim();

  const currentUser = await findUserById(userId);
  if (!currentUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: currentUser._id } });
  if (existing) {
    return res.status(409).json({ error: 'This email is already in use.' });
  }

  currentUser.name = name.trim();
  currentUser.email = normalizedEmail;
  currentUser.role = userRole;
  await currentUser.save();

  const updatedUser = {
    id: currentUser._id,
    _id: currentUser._id,
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    role: currentUser.role,
    email_verified: currentUser.email_verified === true
  };

  return res.status(200).json({ message: 'Profile completed successfully.', user: updatedUser });
});
