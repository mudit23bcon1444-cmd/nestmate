// routes/auth.js — register, login, logout, me

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { getDB } = require('../database');
const { sendOTP } = require('../utils/sms');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Validate role — only 'student' or 'owner' allowed via self-registration
    const allowedRoles = ['student', 'owner'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    const db = getDB();

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), email.toLowerCase().trim(), hashedPassword, userRole);

    const newUser = {
      id: result.lastInsertRowid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: userRole
    };

    req.session.user = newUser;

    return res.status(201).json({ message: 'Account created successfully.', user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    req.session.user = sessionUser;

    return res.status(200).json({ message: 'Logged in successfully.', user: sessionUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out. Please try again.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully.' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({ user: req.session.user });
  }
  return res.status(401).json({ error: 'Not authenticated.' });
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins from now

    const db = getDB();
    
    // Store in otp_store
    db.prepare(`
      INSERT INTO otp_store (phone, otp, expires_at) 
      VALUES (?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET otp=excluded.otp, expires_at=excluded.expires_at
    `).run(phone, otp, expiresAt);

    await sendOTP(phone, otp);

    return res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required.' });

    const db = getDB();
    const record = db.prepare('SELECT * FROM otp_store WHERE phone = ?').get(phone);

    if (!record || record.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP.' });
    }

    if (Date.now() > record.expires_at) {
      return res.status(401).json({ error: 'OTP has expired.' });
    }

    // Delete used OTP
    db.prepare('DELETE FROM otp_store WHERE phone = ?').run(phone);

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    let isNewUser = false;

    if (!user) {
      // Create incomplete user profile
      const result = db.prepare(
        'INSERT INTO users (name, role, phone) VALUES (?, ?, ?)'
      ).run('New User', 'student', phone);

      user = {
        id: result.lastInsertRowid,
        name: 'New User',
        role: 'student',
        phone: phone
      };
      isNewUser = true;
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    req.session.user = sessionUser;

    return res.status(200).json({ 
      message: 'Logged in successfully.', 
      user: sessionUser,
      isNewUser: isNewUser || !user.email // if email is missing, still needs profile completion
    });

  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// POST /api/auth/complete-profile
router.post('/complete-profile', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const allowedRoles = ['student', 'owner'];
    const userRole = allowedRoles.includes(role) ? role : 'student';

    const db = getDB();

    // Check if email already taken by someone else
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), req.session.user.id);
    if (existing) {
      return res.status(409).json({ error: 'This email is already in use.' });
    }

    db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(
      name.trim(), email.toLowerCase().trim(), userRole, req.session.user.id
    );

    req.session.user.name = name.trim();
    req.session.user.email = email.toLowerCase().trim();
    req.session.user.role = userRole;

    return res.status(200).json({ message: 'Profile completed successfully.', user: req.session.user });
  } catch (err) {
    console.error('Complete profile error:', err);
    return res.status(500).json({ error: 'Failed to complete profile.' });
  }
});

module.exports = router;
