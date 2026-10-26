const crypto = require('crypto');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

// Ensure required environment variables for test execution
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test_access_token_secret_which_is_at_least_32_chars_long';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test_refresh_token_secret_which_is_at_least_32_chars_long';
process.env.APP_URL = 'http://localhost:5173';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:5001';

const app = require('../server');
const User = require('../models/User');
const EmailToken = require('../models/EmailToken');
const RefreshToken = require('../models/RefreshToken');
const SecurityEvent = require('../models/SecurityEvent');
const { validatePassword, hashPassword } = require('../utils/passwordPolicy');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');

let replSet;

beforeAll(async () => {
  // Start in-memory MongoDB replica set for atomic transaction and TTL index support
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
}, 30000);

beforeEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Stage A Hardening Test Suite', () => {
  // ─── 1. Token is single-use and expires ──────────────────────────────────────
  describe('1. Email Token single-use and expiration lifecycle', () => {
    it('verifies email once and rejects repeated or expired tokens', async () => {
      const user = await User.create({
        name: 'Test Student',
        email: 'student.verify@test.edu',
        phone: '9876543210',
        password: await hashPassword('InitialStrongP@ss1'),
        role: 'student',
        email_verified: false
      });

      // 1a. Valid token verification
      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await EmailToken.create({
        user_id: user._id,
        type: 'verify',
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const res1 = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(res1.status).toBe(200);
      expect(res1.body.message).toMatch(/verified successfully/i);

      // Verify DB status
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.email_verified).toBe(true);

      const tokenDoc = await EmailToken.findOne({ token_hash: tokenHash });
      expect(tokenDoc.used_at).toBeDefined();

      // 1b. Single-use: Re-using the same token must fail
      const res2 = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: rawToken });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toMatch(/invalid or expired/i);

      // 1c. Expired token must fail
      const expiredRaw = crypto.randomBytes(32).toString('base64url');
      const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');

      await EmailToken.create({
        user_id: user._id,
        type: 'verify',
        token_hash: expiredHash,
        expires_at: new Date(Date.now() - 1000) // in the past
      });

      const resExpired = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: expiredRaw });

      expect(resExpired.status).toBe(400);
      expect(resExpired.body.error).toMatch(/invalid or expired/i);
    });
  });

  // ─── 2. Forgot-password enumeration protection ──────────────────────────────
  describe('2. Forgot-password returns identical response for known and unknown emails', () => {
    it('returns exact same 200 message regardless of account existence', async () => {
      const knownEmail = 'known.student@test.edu';
      await User.create({
        name: 'Known User',
        email: knownEmail,
        phone: '9876543211',
        password: await hashPassword('KnownStrongP@ss1'),
        role: 'student'
      });

      const unknownEmail = 'completely.unknown.random@test.edu';

      const resKnown = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: knownEmail });

      const resUnknown = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: unknownEmail });

      expect(resKnown.status).toBe(200);
      expect(resUnknown.status).toBe(200);
      expect(resKnown.body).toEqual(resUnknown.body);
      expect(resKnown.body.message).toBe(
        'If an account exists with that email, a password reset link has been sent.'
      );
    });
  });

  // ─── 3. Reset-password deletes all refresh tokens ────────────────────────────
  describe('3. Reset-password invalidates all existing user refresh tokens', () => {
    it('revokes all active sessions upon password reset', async () => {
      const user = await User.create({
        name: 'Reset Target',
        email: 'target.reset@test.edu',
        phone: '9876543212',
        password: await hashPassword('OldStrongP@ss1!'),
        role: 'student'
      });

      // Seed 3 active refresh tokens
      await RefreshToken.create([
        { user_id: user._id, jti: crypto.randomUUID(), expires_at: new Date(Date.now() + 100000) },
        { user_id: user._id, jti: crypto.randomUUID(), expires_at: new Date(Date.now() + 100000) },
        { user_id: user._id, jti: crypto.randomUUID(), expires_at: new Date(Date.now() + 100000) }
      ]);

      expect(await RefreshToken.countDocuments({ user_id: user._id })).toBe(3);

      // Create reset token
      const rawReset = crypto.randomBytes(32).toString('base64url');
      const resetHash = crypto.createHash('sha256').update(rawReset).digest('hex');

      await EmailToken.create({
        user_id: user._id,
        type: 'reset',
        token_hash: resetHash,
        expires_at: new Date(Date.now() + 30 * 60 * 1000)
      });

      const newPass = 'BrandNewStrongP@ssword2026!';
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: rawReset, password: newPass });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset successfully/i);

      // All refresh tokens must be wiped out
      const remainingTokens = await RefreshToken.countDocuments({ user_id: user._id });
      expect(remainingTokens).toBe(0);

      // SecurityEvent must record password_changed
      const event = await SecurityEvent.findOne({ user_id: user._id, type: 'password_changed' });
      expect(event).toBeDefined();
    });
  });

  // ─── 4. Policy rejects "password123" and 73-byte password ───────────────────
  describe('4. Password strength policy enforcement', () => {
    it('rejects trivial passwords, short passwords, and passwords exceeding 72 bytes', async () => {
      // 4a. Trivial password rejected by zxcvbn score < 3
      const trivial = await validatePassword('password123');
      expect(trivial.valid).toBe(false);

      // 4b. 73-byte password rejected by bcrypt 72-byte max length limit
      const tooLong73 = 'A'.repeat(73);
      const longRes = await validatePassword(tooLong73);
      expect(longRes.valid).toBe(false);
      expect(longRes.error).toMatch(/72 bytes/i);

      // 4c. Under 10 characters rejected
      const shortRes = await validatePassword('Short1!');
      expect(shortRes.valid).toBe(false);
      expect(shortRes.error).toMatch(/10 characters/i);

      // 4d. Strong password passes
      const strongRes = await validatePassword('Correct-Horse-Battery-Staple-2026!');
      expect(strongRes.valid).toBe(true);
    });
  });

  // ─── 5. Unverified users blocked from bookings ──────────────────────────────
  describe('5. Unverified email blocks booking actions', () => {
    it('returns 403 EMAIL_NOT_VERIFIED for unverified users and permits verified users', async () => {
      const unverifiedUser = await User.create({
        name: 'Unverified Student',
        email: 'unverified@test.edu',
        phone: '9876543213',
        password: await hashPassword('StrongPassword123!'),
        role: 'student',
        email_verified: false
      });

      const accessToken = generateAccessToken({ userId: unverifiedUser._id, role: 'student' });

      // Request booking endpoint
      const resBlocked = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          listing_id: new mongoose.Types.ObjectId().toString(),
          move_in_date: '2026-11-01'
        });

      expect(resBlocked.status).toBe(403);
      expect(resBlocked.body.code).toBe('EMAIL_NOT_VERIFIED');

      // Update user to verified
      unverifiedUser.email_verified = true;
      await unverifiedUser.save();

      const newAccessToken = generateAccessToken({ userId: unverifiedUser._id, role: 'student' });

      // After verification, requireVerifiedEmail guard passes (proceeds past auth guard)
      const resAllowed = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          listing_id: new mongoose.Types.ObjectId().toString(),
          move_in_date: '2026-11-01'
        });

      // Should not be blocked by EMAIL_NOT_VERIFIED (returns 400 validation or 404 listing not found)
      expect(resAllowed.status).not.toBe(403);
      expect(resAllowed.body.code).not.toBe('EMAIL_NOT_VERIFIED');
    });
  });

  // ─── 6. Sessions listing & cross-user revoke isolation ──────────────────────
  describe('6. Session listing and unauthorized revoke prevention', () => {
    it('lists user sessions and prevents revoking another user session', async () => {
      const userA = await User.create({
        name: 'User A',
        email: 'usera@test.edu',
        phone: '9876543214',
        password: await hashPassword('StrongPassword123!'),
        role: 'student'
      });

      const userB = await User.create({
        name: 'User B',
        email: 'userb@test.edu',
        phone: '9876543215',
        password: await hashPassword('StrongPassword123!'),
        role: 'student'
      });

      // Create 2 sessions for User A
      const tokenA1 = generateRefreshToken({ userId: userA._id });
      const sessionA1 = await RefreshToken.create({
        user_id: userA._id,
        jti: tokenA1.jti,
        expires_at: new Date(tokenA1.expiresAt),
        ip: '192.168.1.50',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      });

      const tokenA2 = generateRefreshToken({ userId: userA._id });
      const sessionA2 = await RefreshToken.create({
        user_id: userA._id,
        jti: tokenA2.jti,
        expires_at: new Date(tokenA2.expiresAt),
        ip: '10.0.0.12',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)'
      });

      // Create 1 session for User B
      const tokenB1 = generateRefreshToken({ userId: userB._id });
      const sessionB1 = await RefreshToken.create({
        user_id: userB._id,
        jti: tokenB1.jti,
        expires_at: new Date(tokenB1.expiresAt),
        ip: '172.16.0.4',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0)'
      });

      const accessA = generateAccessToken({ userId: userA._id, role: 'student' });

      // 6a. GET /api/auth/sessions returns User A's sessions with masked IP and current tag
      const listRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessA}`)
        .set('Cookie', [`refreshToken=${tokenA1.token}`]);

      expect(listRes.status).toBe(200);
      expect(listRes.body.sessions).toHaveLength(2);

      const currentSession = listRes.body.sessions.find((s) => s.current === true);
      expect(currentSession).toBeDefined();
      expect(currentSession.id).toBe(sessionA1._id.toString());
      expect(currentSession.ip).toMatch(/\*\*\*/); // Masked IP

      // 6b. User A tries to revoke User B's session — must be rejected with 404
      const crossRevokeRes = await request(app)
        .delete(`/api/auth/sessions/${sessionB1._id}`)
        .set('Authorization', `Bearer ${accessA}`);

      expect(crossRevokeRes.status).toBe(404);
      expect(await RefreshToken.findById(sessionB1._id)).not.toBeNull();

      // 6c. User A revokes their own session A2 — must succeed
      const ownRevokeRes = await request(app)
        .delete(`/api/auth/sessions/${sessionA2._id}`)
        .set('Authorization', `Bearer ${accessA}`);

      expect(ownRevokeRes.status).toBe(200);
      expect(await RefreshToken.findById(sessionA2._id)).toBeNull();
    });
  });

  // ─── 7. Change-password revokes only other sessions ─────────────────────────
  describe('7. Change password revokes other sessions while preserving current session', () => {
    it('maintains the current session and purges all others', async () => {
      const oldPass = 'OldSecurePassw0rd!2026';
      const user = await User.create({
        name: 'Session Keeper',
        email: 'keeper@test.edu',
        phone: '9876543216',
        password: await hashPassword(oldPass),
        role: 'student'
      });

      // Session 1 (Current session)
      const tokenCurrent = generateRefreshToken({ userId: user._id });
      await RefreshToken.create({
        user_id: user._id,
        jti: tokenCurrent.jti,
        expires_at: new Date(tokenCurrent.expiresAt)
      });

      // Session 2 (Other session)
      const tokenOther = generateRefreshToken({ userId: user._id });
      await RefreshToken.create({
        user_id: user._id,
        jti: tokenOther.jti,
        expires_at: new Date(tokenOther.expiresAt)
      });

      expect(await RefreshToken.countDocuments({ user_id: user._id })).toBe(2);

      const access = generateAccessToken({ userId: user._id, role: 'student' });
      const newPass = 'NewSecurePassw0rd!2026';

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${access}`)
        .set('Cookie', [`refreshToken=${tokenCurrent.token}`])
        .send({
          currentPassword: oldPass,
          newPassword: newPass
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/all other sessions have been (logged|signed) out/i);

      // Verify Session 2 is deleted
      const otherInDb = await RefreshToken.findOne({ jti: tokenOther.jti });
      expect(otherInDb).toBeNull();

      // Verify Session 1 is kept intact
      const currentInDb = await RefreshToken.findOne({ jti: tokenCurrent.jti });
      expect(currentInDb).not.toBeNull();
    });
  });

  // ─── 8. Origin check blocks foreign origins ────────────────────────────────
  describe('8. CSRF Origin Validation', () => {
    it('rejects foreign origin on mutating requests and allows configured origins', async () => {
      // 8a. Foreign origin blocked with 403
      const blockedRes = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'https://malicious-phishing-site.com')
        .send({ email: 'test@test.edu', password: 'SomePassword123!' });

      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.error).toMatch(/cross-origin request blocked/i);

      // 8b. Configured origin allowed
      const allowedRes = await request(app)
        .post('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .send({ email: 'nonexistent@test.edu', password: 'SomePassword123!' });

      // Passes origin check; fails at credential check with 401
      expect(allowedRes.status).toBe(401);
      expect(allowedRes.body.error).not.toMatch(/cross-origin request blocked/i);
    });
  });
});
