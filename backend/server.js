require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');


const app = express();
const PORT = process.env.PORT || 5700;

// ─── Body & Cookie Parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── Frontend Page Routes ──────────────────────────────────────────────────
app.get(['/browse', '/browse/code.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'browse', 'code.html'));
});

app.get(['/register', '/signup', '/register/code.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register', 'code.html'));
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

// ─── Static Files & API Routes ───────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin',    require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});



// ─── Fallback: serve home page for unknown routes ────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'home', 'code.html'));
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB();
app.listen(PORT, () => {

  console.log(`\n NestMate running on http://localhost:${PORT}`);
  console.log(`   Home page:       http://localhost:${PORT}/home/code.html`);
  console.log(`   Browse listings: http://localhost:${PORT}/browse/code.html`);
  console.log(`   Owner dashboard: http://localhost:${PORT}/dashboard/code.html`);
  console.log(`   Admin panel:     http://localhost:${PORT}/admin/code.html`);
  console.log(`\n   Admin login: admin@nestmate.com / admin123`);
  console.log(`   Demo owner:  owner@nestmate.com / owner123\n`);
});




// app.listen(PORT, () => {
//   console.log(`\n NestMate running on http://localhost:${PORT}`);
// });

// connectDB();