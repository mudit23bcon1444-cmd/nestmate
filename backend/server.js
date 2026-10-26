const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5001;

// Trust reverse proxy (Docker, Render, AWS ALB, Nginx)
app.set('trust proxy', 1);

// ─── Security Headers & Helmet CSP ───────────────────────────────────────────
// React bundle Content Security Policy + Referrer-Policy + HSTS in production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://res.cloudinary.com",
        "https://*.tile.openstreetmap.org",
        "https://images.unsplash.com",
        "https://lh3.googleusercontent.com"
      ],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// ─── CSRF / Origin Validation Middleware ──────────────────────────────────────
// If an Origin header is present on mutating requests, verify it is in ALLOWED_ORIGINS
const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:5001'];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().replace(/\/+$/, ''))
  : defaultAllowedOrigins;

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin) {
      const cleanOrigin = origin.trim().replace(/\/+$/, '');
      if (!configuredOrigins.includes(cleanOrigin)) {
        return res.status(403).json({ error: 'Cross-origin request blocked by CSRF protection.' });
      }
    }
  }
  next();
});

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Skip refresh endpoint (fires on page load/navigation)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/refresh' || req.originalUrl.includes('/refresh')
});

// Login limiter: compound key of IP + email to protect shared campus Wi-Fi
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const email = req.body && req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    return `${req.ip}_${email}`;
  },
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Send-OTP limiter: per-IP rate protection
const sendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many OTP requests from this network. Try again later.' }
});

// ─── Body & Cookie Parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── Static Files & API Routes ───────────────────────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist');
const hasFrontendDist = fs.existsSync(frontendDist);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (hasFrontendDist) {
  app.use(express.static(frontendDist));
} else {
  app.use(express.static(path.join(__dirname, 'public')));

  // Legacy fallback routes for unbuilt state
  app.get(['/browse', '/browse/code.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'browse', 'code.html'));
  });
  app.get(['/register', '/signup', '/register/code.html'], (req, res) => {
    res.redirect('/login');
  });
  app.get(['/listing', '/listing/code.html', '/list_your_property_nestmate'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'listing', 'code.html'));
  });
  app.get(['/details', '/details/code.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'details', 'code.html'));
  });
  app.get(['/dashboard', '/dashboard/code.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard', 'code.html'));
  });
  app.get(['/admin', '/admin/code.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'code.html'));
  });
  app.get(['/complete-profile', '/complete_profile/code.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'complete_profile', 'code.html'));
  });
  app.get(['/login', '/otp-login', '/login/code.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'code.html'));
  });
}

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/send-otp', sendOtpLimiter);
app.use('/api/auth',     authLimiter, require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Fallback: serve React SPA or legacy home page ────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  if (hasFrontendDist) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'home', 'code.html'));
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'An unexpected error occurred.',
    status
  });
});

// ─── Start Server if executed directly ────────────────────────────────────────
if (require.main === module) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`\n NestMate running on http://localhost:${PORT}`);
    console.log(`   Home page:       http://localhost:${PORT}/home/code.html`);
    console.log(`   Browse listings: http://localhost:${PORT}/browse/code.html`);
    console.log(`   Owner dashboard: http://localhost:${PORT}/dashboard/code.html`);
    console.log(`   Admin panel:     http://localhost:${PORT}/admin/code.html\n`);
  });
}

module.exports = app;