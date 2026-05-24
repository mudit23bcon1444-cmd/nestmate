require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ─────────────────────────────────────────────────────────────
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve all frontend HTML pages from the public/ folder
app.use(express.static(path.join(__dirname, 'public')));

// ─── Sessions ─────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'nestmate-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin',    require('./routes/admin'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Fallback: serve home page for unknown routes ────────────────────────────
app.get('*', (req, res) => {
  // Only fall back for non-API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'nestmate_home_refined', 'code.html'));
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
initDB();
app.listen(PORT, () => {
  console.log(`\n🏠 NestMate backend running on http://localhost:${PORT}`);
  console.log(`   Home page:       http://localhost:${PORT}/nestmate_home_refined/code.html`);
  console.log(`   Browse listings: http://localhost:${PORT}/browse_listings_nestmate_refined/code.html`);
  console.log(`   Owner dashboard: http://localhost:${PORT}/owner_dashboard_nestmate/code.html`);
  console.log(`   Admin panel:     http://localhost:${PORT}/admin_panel_nestmate_refined/code.html`);
  console.log(`\n   Admin login: admin@nestmate.com / admin123`);
  console.log(`   Demo owner:  owner@nestmate.com / owner123\n`);
});
