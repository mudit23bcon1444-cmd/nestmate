# 🎬 NestMate - Live Code Walkthrough & Screen Recording Script

> **Document Type:** Screen Recording & Live Code Walkthrough Blueprint  
> **Project:** NestMate - Student Housing & PG Discovery Platform  
> **Target Audience:** Evaluators, Technical Recruiter / Lead, Project Reviewers  
> **Suggested Video Duration:** 12 - 15 Minutes  

---

## 📽️ Presenter Quick Preparation & Screen Setup Guide

Before hitting **Record** on OBS / Loom / Zoom:
1. **Screen Layout**:
   - **Left Half (50%)**: VS Code with `nestmate` directory open. (Font size: 14px or 16px for clear video readability).
   - **Right Half (50%)**: Browser window with `http://localhost:5000/home/code.html` open alongside Developer Tools (Console & Network tabs).
2. **Terminal Preparation**:
   - Clear terminal output (`clear` or `cls`).
   - Start the server using `npm run dev` in `backend/` to show clean MongoDB Atlas database connection logs.
3. **Prepared Demo Credentials**:
   - **Student Account**: Create a dummy account or use OTP login.
   - **Owner Account**: `owner@nestmate.com` / `owner123`
   - **Admin Account**: `admin@nestmate.com` / `admin123`

---

## ⏱️ Video Timecodes & Section Map

| Section | Topic | Duration | Key Focus Points |
| :--- | :--- | :--- | :--- |
| **00:00 - 02:00** | 1. Project Overview & Live Demo | ~2 min | Problem statement, user personas, live app walkthrough |
| **02:00 - 05:00** | 2. System Design & Architecture | ~3 min | Tech stack, MongoDB schemas, GPS verification, JWT rotation |
| **05:00 - 12:00** | 3. Deep-Dive Code Walkthrough | ~7 min | `server.js`, `auth.js`, `tokens.js`, GPS controllers, Mongoose pipelines |
| **12:00 - 14:00** | 4. GitHub Commits & Evolution | ~2 min | Commit history (`57ae046`, `3e0ce7c`, `5064663`) & backend migration |
| **14:00 - 15:00** | 5. Code Quality & Architecture | ~1 min | Clean code practices, folder structure, error handling |

---

## 🎤 SECTION 1: Project Overview & Live Demo (00:00 - 02:00)

### 📌 Presenter Script & Speech Outline
> *"Hello everyone! Welcome to this live code walkthrough of **NestMate**, a full-stack student housing and PG discovery platform built to connect university students with verified property owners and administrators.*
>
> *Finding student housing near campuses is often plagued by unverified listings, fake photos, lack of direct communication, and tedious booking processes. NestMate addresses this by creating a three-tiered marketplace with **Students**, **Property Owners**, and **System Administrators** equipped with a strong **Photo & Physical GPS Location Verification Workflow**.*
>
> *Let's quickly take a look at the live application running on `http://localhost:5000`."*

### 💻 On-Screen Actions:
1. **Browse & Search (`/browse`)**:
   - Navigate to the property search page.
   - Type a location into the search bar (e.g. `"Campus North"` or `"Downtown"`) and select amenity filters (WiFi, AC, Gym).
   - Show how the listings dynamically update without page reload via asynchronous `fetch()` API calls.
2. **Listing Details & GPS Verification Badge (`/details`)**:
   - Click on a property card to navigate to the details view. Show high-res images, pricing, room amenities, and owner contact options.
   - Highlight the **"Physical Location Verified"** badge with GPS coordinates (`latitude`, `longitude`) and direct Google Maps link.
   - Show the enquiry modal that sends automated emails to property owners using **Nodemailer**.
3. **Dual Authentication (`/login`)**:
   - Show standard **Email & Password login** with `bcrypt` hash verification.
   - Show **Passwordless Phone OTP login** leveraging 6-digit verification codes and Fast2SMS integration with 60-second resend rate-limiting.
4. **Owner Listing Upload with GPS Location Capture (`/listing`)**:
   - Log in as `owner@nestmate.com`.
   - Show how owners submit new property listings with image uploads (handled via `multer`) alongside actual GPS coordinates.
   - Click the **"📍 Capture Current GPS"** button leveraging browser Geolocation (`navigator.geolocation.getCurrentPosition()`) to record exact coordinates.
5. **Admin Physical Verification Panel (`/admin`)**:
   - Log in as `admin@nestmate.com`.
   - Show the pending property queue where administrators inspect submitted property photos alongside an interactive **"View on Google Maps"** link (`https://maps.google.com/?q=lat,lng`) to physically verify the location.
   - Click **"Approve & Verify"**, add optional verification notes, and show how the system updates audit logs (`admin_log`).

---

## 🏗️ SECTION 2: Design & Architecture (02:00 - 05:00)

### 📌 Presenter Script & Speech Outline
> *"Now let's transition to the backend architecture and tech stack powering NestMate.*
>
> *NestMate follows a modular **Node.js + Express.js** RESTful API pattern backed by **MongoDB Atlas** with **Mongoose ODM**. On the client side, we use semantic **HTML5**, **Vanilla JavaScript** for dynamic DOM manipulation, and **Tailwind CSS v3** for utility-first responsive styling.*
>
> *Architectural highlights of NestMate include dual authentication, stateless **JWT Access Token + Refresh Token Rotation**, and strict **Photo & GPS Coordinate Location Verification**."*

### 📐 System Architecture Diagram

```text
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  HTML5 + Vanilla JS + Tailwind CSS v3 (Served statically via Express Public Dir)  |
|  Geolocation Capture API + API Client Interceptor (Attaches Bearer JWT & Auto-Refresh)|
+-----------------------------------------------------------------------------------+
                                         │
                                   HTTP / REST API
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                 EXPRESS BACKEND                                   |
|  server.js -> Routes (/api/auth, /api/listings, /api/bookings, /api/admin)        |
|  Middleware Guards: isLoggedIn (JWT check), isOwner, isAdmin                      |
+-----------------------------------------------------------------------------------+
     │                           │                         │                  │
     ▼                           ▼                         ▼                  ▼
+------------------+   +-------------------+     +------------------+   +-------------------+
|  MONGODB ATLAS   |   |   JWT AUTH & DB   |     |    NODEMAILER    |   |     FAST2SMS      |
| Mongoose Models  |   | Refresh Token DB  |     |  Email Alerts    |   |  SMS OTP Gateway  |
| Users, Listings  |   | JTI Revocation    |     |  Owner Inquiries |   |  Phone Login      |
| (GPS & Photos)   |   | HTTP-Only Cookie  |     |                  |   |                   |
+------------------+   +-------------------+     +------------------+   +-------------------+
```

### 🗄️ Database Schemas & Entity Relationships

Highlight the key Mongoose Schemas in `backend/models/`:
1. **User Schema (`models/User.js`)**:
   - Fields: `name`, `email`, `phone`, `password` (bcrypt hash), `role` (`student`, `owner`, `admin`), `is_otp_user`.
2. **Listing Schema (`models/Listing.js`)**:
   - Fields: `owner_id` (Ref -> User), `title`, `location`, `price`, `description`, `amenities` (Array), `image_path`, **`latitude`**, **`longitude`**, **`verification_notes`**, **`verified_at`**, `is_approved` (`0`=Pending Verification, `1`=Approved & Verified, `2`=Rejected), `is_available` (Boolean).
3. **Booking Schema (`models/Booking.js`)**:
   - Fields: `listing_id` (Ref -> Listing), `student_id` (Ref -> User), `move_in_date`, `status` (`pending`, `accepted`, `rejected`), `message`.
4. **RefreshToken Schema (`models/RefreshToken.js`)**:
   - Fields: `user_id` (Ref -> User), `jti` (Unique UUID string), `expires_at` (TTL Index for auto-cleanup).
5. **Security & Audit Logs**:
   - `OtpStore.js` & `OtpLog.js`: Lockout counters and resend cooldown tracking.
   - `AdminLog.js`: Admin moderation & GPS physical verification audit logs.

### 🔒 Physical Verification & Auth Security
> *"Let's examine our physical verification and security model. Rather than allowing property owners to upload arbitrary photos, NestMate enforces physical verification:*
> - **GPS Coordinate Submission**: Owners capture live coordinates (`latitude`, `longitude`) during photo upload.
> - **Admin Verification Queue**: Listings remain in `is_approved = 0` until an administrator physically verifies the photo against Google Maps GPS data.
> - **Access Token**: Short-lived (15 minutes) JWT containing `{ userId, role }`. Passed via `Authorization: Bearer <token>`.
> - **Refresh Token Rotation**: 7-day token stored in **HTTP-only, SameSite=Strict** cookies with single-use `jti` revocation."*

---

## 💻 SECTION 3: Deep-Dive Code Walkthrough (05:00 - 12:00)

### 📌 Presenter Script & Speech Outline
> *"Let's open VS Code and examine the actual implementation code file by file."*

---

### File 1: `backend/models/Listing.js` — Schema Definition
📁 **Path:** [`backend/models/Listing.js`](file:///Users/muditsaraogi/Desktop/nestmate/backend/models/Listing.js)

**What to highlight on screen:**
- Show the addition of physical verification fields: `latitude`, `longitude`, `verification_notes`, and `verified_at`.

```javascript
// Highlight from Listing.js
const listingSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  description: { type: String },
  amenities: { type: [String], default: [] },
  image_path: { type: String, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  verification_notes: { type: String, default: null },
  verified_at: { type: Date, default: null },
  is_approved: { type: Number, default: 0, enum: [0, 1, 2] },
  is_available: { type: Number, default: 1, enum: [0, 1] }
});
```

---

### File 2: `backend/controllers/listingsController.js` — GPS Validation & Submission
📁 **Path:** [`backend/controllers/listingsController.js`](file:///Users/muditsaraogi/Desktop/nestmate/backend/controllers/listingsController.js)

**What to highlight on screen:**
- Show how `createListing` extracts, validates (-90 to 90 lat / -180 to 180 lng), and persists GPS coordinates alongside property photos (`multer`).

```javascript
// Highlight GPS parsing & validation in createListing
const { title, location, price, description, amenities, latitude, longitude } = req.body;

let parsedLat = (latitude !== undefined && latitude !== null && latitude !== '') ? parseFloat(latitude) : null;
let parsedLng = (longitude !== undefined && longitude !== null && longitude !== '') ? parseFloat(longitude) : null;

if (parsedLat !== null && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
  return res.status(400).json({ error: 'Latitude must be a valid number between -90 and 90.' });
}
if (parsedLng !== null && (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180)) {
  return res.status(400).json({ error: 'Longitude must be a valid number between -180 and 180.' });
}

const listing = await Listing.create({
  owner_id: ownerId,
  title: title.trim(),
  location: location.trim(),
  price: parsedPrice,
  description: description ? description.trim() : null,
  amenities: parsedAmenities,
  image_path: imagePath,
  latitude: parsedLat,
  longitude: parsedLng,
  is_approved: 0,
  is_available: 1
});
```

---

### File 3: `backend/controllers/adminController.js` — Admin Verification & Audit Log
📁 **Path:** [`backend/controllers/adminController.js`](file:///Users/muditsaraogi/Desktop/nestmate/backend/controllers/adminController.js)

**What to highlight on screen:**
- Show how `updateListingApproval` accepts `verification_notes`, sets `verified_at = new Date()`, and records detailed GPS coordinates in `AdminLog`.

```javascript
// Highlight physical verification in adminController.js
exports.updateListingApproval = asyncHandler(async (req, res) => {
  const { is_approved, verification_notes } = req.body;
  const listing = await findByIdOrLegacyId(Listing, req.params.id);

  listing.is_approved = Number(is_approved);
  if (Number(is_approved) === 1) {
    listing.verified_at = new Date();
    listing.verification_notes = verification_notes ? String(verification_notes).trim() : 'Physical photos & GPS coordinates verified by Admin.';
  }
  await listing.save();

  const gpsInfo = (listing.latitude && listing.longitude) ? ` [GPS: ${listing.latitude}, ${listing.longitude}]` : '';
  await AdminLog.create({
    action: `Approved & Verified listing #${req.params.id}${gpsInfo}`,
    done_by: req.user.id
  });
});
```

---

### File 4: `backend/public/listing/code.html` — Geolocation Capture UI
📁 **Path:** [`backend/public/listing/code.html`](file:///Users/muditsaraogi/Desktop/nestmate/backend/public/listing/code.html)

**What to highlight on screen:**
- Show the HTML5 Geolocation button event listener filling latitude and longitude inputs automatically when owners submit listings.

```javascript
// Highlight Geolocation listener in listing/code.html
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('latitude').value = pos.coords.latitude.toFixed(6);
      document.getElementById('longitude').value = pos.coords.longitude.toFixed(6);
    }
  );
});
```

---

### File 5: `backend/public/admin/code.html` — Map Verification Queue
📁 **Path:** [`backend/public/admin/code.html`](file:///Users/muditsaraogi/Desktop/nestmate/backend/public/admin/code.html)

**What to highlight on screen:**
- Show how the admin moderation queue renders property photo thumbnails alongside direct Google Maps links (`https://maps.google.com/?q=${lat},${lng}`).

```javascript
// Highlight Google Maps link rendering in admin/code.html
const mapLink = (listing.latitude && listing.longitude)
  ? `<a href="https://maps.google.com/?q=${listing.latitude},${listing.longitude}" target="_blank" class="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded">
       <span class="material-symbols-outlined text-[14px]">map</span> View on Google Maps (${listing.latitude}, ${listing.longitude})
     </a>`
  : `<span class="text-[11px] italic">No GPS coordinates attached</span>`;
```

---

## 📜 SECTION 4: GitHub Commits & Repository Evolution (12:00 - 14:00)

### 📌 Presenter Script & Speech Outline
> *"Let's review our version control practices and git commit history to demonstrate how NestMate evolved.*
>
> *Opening our terminal and running `git log --oneline`, we can see the clear, structured git commits representing our development milestones."*

### 💻 On-Screen Terminal Action:
Run `git log --oneline -n 10` in VS Code terminal:

```bash
5064663 latest updates - backend architure upgrade
3e0ce7c PROJECT_DETAILS.m --> dREADME
57ae046 first commit-first version
```

### 🔍 Commit Breakdown & Milestone Walkthrough:

#### 1. Commit `57ae046`: `first commit-first version`
- **Milestone**: Initial codebase setup, layout scaffolding, prototype static HTML pages, and core styling assets.

#### 2. Commit `3e0ce7c`: `PROJECT_DETAILS.m --> dREADME`
- **Milestone**: Comprehensive documentation overhaul. Consolidated specification specs into a structured `README.md`.

#### 3. Commit `5064663`: `latest updates - backend architure upgrade`
- **Milestone**: **Major Architectural Upgrade, GPS Verification & Database Migration**.
- **Key Enhancements**:
  - Full migration from SQLite to **MongoDB Atlas** using Mongoose ORM models.
  - Added **Photo & Physical GPS Location Verification** (`latitude`, `longitude`, `verification_notes`, `verified_at`).
  - Implemented stateless **JWT Access Tokens (15 min)** with **Refresh Token Rotation (7 days)** stored in HTTP-only cookies.
  - Created `RefreshToken.js` model for single-use `jti` revocation tracking in MongoDB.
  - Isolated business logic into modular **Controllers** (`authController`, `listingsController`, `bookingsController`, `adminController`).
  - Built-in audit logging (`AdminLog`, `OtpLog`).

---

## ✨ SECTION 5: Code Quality & Architecture Best Practices (14:00 - 15:00)

### 🏆 Key Code Quality Highlights to Point Out:

1. **Clean Folder Structure (MVC Derivative)**:
   - Separated `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `utils/`, and `public/`.
2. **SOLID & DRY Principles**:
   - Single Responsibility Controllers, isolated token utility module, global `asyncHandler` wrapper.
3. **Physical & Digital Security Standards**:
   - **Physical Verification**: Photo + GPS Coordinate inspection via Google Maps before public listing approval.
   - **Authentication Security**: `bcrypt` hashing, HTTP-only SameSite cookies, JWT rotation, OTP brute-force lockout.
4. **Environment Isolation**:
   - Complete environment variable isolation via `.env`.

---

## 🎯 Summary & Closing Statement (15:00)

> *"In summary, NestMate provides a complete, production-ready student housing platform featuring robust photo & GPS physical location verification, MongoDB Atlas aggregation pipelines, JWT refresh token rotation, multi-role authorization, automated email alerts, and administrative moderation.*
>
> *Thank you for watching this live code walkthrough of NestMate!"*

---
