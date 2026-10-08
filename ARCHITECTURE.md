# NestMate — Design & Architecture

> A student housing platform connecting property owners with students looking for accommodation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Data Models](#6-data-models)
7. [API Reference](#7-api-reference)
8. [Authentication & Security](#8-authentication--security)
9. [File Uploads](#9-file-uploads)
10. [Notification System](#10-notification-system)
11. [Admin Panel](#11-admin-panel)
12. [Key Design Decisions](#12-key-design-decisions)

---

## 1. Project Overview

NestMate is a **full-stack, server-rendered web application** that enables:

| Actor       | Capabilities                                                              |
|-------------|---------------------------------------------------------------------------|
| **Students** | Browse listings, view property details, submit booking requests & enquiries |
| **Owners**   | Post property listings (with images), manage availability, track bookings  |
| **Admins**   | Approve / reject listings, manage all users, view audit logs               |

**Tech stack at a glance:**

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Runtime      | Node.js >= 18                                   |
| Web Framework | Express 4                                      |
| Database     | MongoDB via Mongoose 9                          |
| Auth         | JWT (access + refresh tokens) + OTP via SMS     |
| Frontend     | Vanilla HTML / CSS / JavaScript (multi-page)   |
| Styling      | TailwindCSS 3 (compiled to `public/style.css`) |
| File Storage | Local disk (`/uploads`)                         |
| Email        | Nodemailer                                      |

---

## 2. High-Level Architecture

```
+-------------------------------------------------------------+
|                        Browser (Client)                      |
|                                                              |
|  Home  | Browse | Details | Login | Register | Dashboard ... |
|  (Vanilla HTML + CSS + JS pages in /public)                 |
+-------------------------+-----------------------------------+
                          | HTTP (REST + static files)
                          |
+-------------------------v-----------------------------------+
|                    Express Server  (server.js)               |
|                                                              |
|  +-------------+  +-------------+  +--------------------+   |
|  | Page Routes |  | Static Files|  |   API Routes        |   |
|  | /browse     |  | /uploads    |  |  /api/auth          |   |
|  | /register   |  | /public     |  |  /api/listings      |   |
|  | /details    |  +-------------+  |  /api/bookings      |   |
|  | /dashboard  |                   |  /api/admin         |   |
|  | /admin ...  |                   +----------+----------+   |
|  +-------------+                              |              |
|                        +-----------------------+             |
|                        |  Middleware: isLoggedIn/isOwner/isAdmin  |
|                        |                                    |
|              +---------v----------+                         |
|              |    Controllers      |                         |
|              |  auth / listings /  |                         |
|              |  bookings / admin   |                         |
|              +---------+----------+                         |
|                        |                                    |
|              +---------v----------+                         |
|              |    Mongoose Models  |                         |
|              |  User / Listing /   |                         |
|              |  Booking / Enquiry..|                         |
|              +---------+----------+                         |
+------------------------+------------------------------------+
                         |
               +---------v----------+
               |      MongoDB        |
               |   (Atlas or local)  |
               +--------------------+
```

The server acts as **both a static file server** (serving the multi-page frontend) **and a REST API** (consumed by those same pages via `fetch`).

---

## 3. Directory Structure

```
nestmate/
+-- backend/                    <- All server-side code
|   +-- server.js               <- Entry point; registers routes & middleware
|   +-- config/
|   |   +-- db.js               <- Mongoose connection helper
|   +-- models/                 <- Mongoose schemas
|   |   +-- User.js
|   |   +-- Listing.js
|   |   +-- Booking.js
|   |   +-- Enquiry.js
|   |   +-- OtpStore.js
|   |   +-- OtpLog.js
|   |   +-- RefreshToken.js
|   |   +-- AdminLog.js
|   +-- routes/                 <- Express routers (thin - delegate to controllers)
|   |   +-- auth.js
|   |   +-- listings.js
|   |   +-- bookings.js
|   |   +-- admin.js
|   +-- controllers/            <- Business logic
|   |   +-- authController.js
|   |   +-- listingsController.js
|   |   +-- bookingsController.js
|   |   +-- adminController.js
|   +-- middleware/
|   |   +-- auth.js             <- JWT verification & role guards
|   +-- utils/
|   |   +-- tokens.js           <- JWT generation / verification helpers
|   |   +-- email.js            <- Nodemailer email helper
|   |   +-- sms.js              <- SMS / OTP helper
|   |   +-- asyncHandler.js     <- try/catch wrapper
|   +-- public/                 <- Frontend (served as static files)
|   |   +-- style.css           <- Compiled TailwindCSS output
|   |   +-- auth-client.js      <- Shared client-side token refresh logic
|   |   +-- home/code.html
|   |   +-- browse/code.html
|   |   +-- details/code.html
|   |   +-- login/code.html
|   |   +-- register/code.html
|   |   +-- complete_profile/code.html
|   |   +-- dashboard/code.html
|   |   +-- admin/code.html
|   +-- uploads/                <- Persisted listing images (local disk)
|   +-- seeds/                  <- Database seeding scripts
|   +-- scripts/                <- One-off migration / utility scripts
|       +-- migrateAmenities.js
+-- scripts/                    <- Project-level scripts (backups, etc.)
+-- package.json                <- Root package file
+-- ARCHITECTURE.md             <- This file
```

---

## 4. Frontend Architecture

### Pattern: Multi-Page Application (MPA)

Each page is a **self-contained `code.html`** file in its own subdirectory under `public/`. Pages communicate with the backend exclusively through `fetch()` calls to the REST API.

### Pages

| Route              | Page File                             | Purpose                              |
|--------------------|---------------------------------------|--------------------------------------|
| `/` (fallback)     | `public/home/code.html`               | Landing / marketing page             |
| `/browse`          | `public/browse/code.html`             | Search & filter listings             |
| `/details`         | `public/details/code.html`            | Single listing detail + book/enquire |
| `/listing`         | `public/listing/code.html`            | Owner: post a new listing            |
| `/dashboard`       | `public/dashboard/code.html`          | Owner: manage own listings & bookings|
| `/login`           | `public/login/code.html`              | Email/password + OTP login           |
| `/register`        | `public/register/code.html`           | New user registration                |
| `/complete-profile`| `public/complete_profile/code.html`   | Post-OTP profile completion          |
| `/admin`           | `public/admin/code.html`              | Admin panel                          |

### Shared Client Logic

**`public/auth-client.js`** is loaded by pages that need authentication. It handles:
- Storing / reading the JWT **access token** from `localStorage`
- Automatically calling `POST /api/auth/refresh` when a `401 expired` response is detected (silent token rotation)
- Redirecting to `/login` when the session is truly expired

### Styling

TailwindCSS is used in **JIT/build mode**:
```
input.css  ->  [tailwindcss CLI]  ->  public/style.css
```
Run `npm run build:css` inside `backend/` to recompile. The output `style.css` is committed and served statically.

---

## 5. Backend Architecture

### Pattern: MVC (Model - View - Controller)

```
Route  ->  Middleware  ->  Controller  ->  Model  ->  MongoDB
```

- **Routes** are thin: they only attach middleware and delegate to a controller function.
- **Controllers** hold all business logic: validation, DB queries, response shaping.
- **Models** are pure Mongoose schemas with no embedded logic.
- **Middleware** is stateless and focused: JWT verification + role enforcement only.

### Entry Point: `server.js`

Responsibilities:
1. Load `.env` and initialise Express
2. Register body/cookie parsers
3. Mount **page routes** (serving HTML files)
4. Mount **static file** middleware (`/uploads`, `/public`)
5. Mount **API routers** under `/api/*`
6. Register a **catch-all** that serves the home page for unknown non-API routes
7. Register a **global error handler**
8. Connect to MongoDB and start listening

---

## 6. Data Models

### User
```
_id          ObjectId (PK)
name         String  (required)
email        String  (unique, sparse, lowercase)
password     String  (bcrypt hash; null for OTP-only users)
role         String  enum['student', 'owner', 'admin']  default: 'student'
phone        String  (unique, sparse)
created_at   Date    (auto)
```

### Listing
```
_id                ObjectId (PK)
owner_id           ObjectId -> User (required)
title              String   (required)
location           String   (required)
price              Number   (required, monthly rent)
description        String
amenities          [String]
image_path         String   (relative path in /uploads)
latitude           Number
longitude          Number
is_approved        Number   enum[0, 1, 2]  -> 0=pending, 1=approved, 2=rejected
is_available       Number   enum[0, 1]     -> 0=unavailable, 1=available
verification_notes String   (admin notes on approval/rejection)
verified_at        Date
created_at         Date     (auto)
```

### Booking
```
_id           ObjectId (PK)
listing_id    ObjectId -> Listing (required)
student_id    ObjectId -> User    (required)
move_in_date  String   (required)
status        String   enum['pending', 'accepted', 'rejected']  default: 'pending'
message       String
created_at    Date     (auto)
```

### Enquiry
```
_id           ObjectId (PK)
listing_id    ObjectId -> Listing (required)
student_name  String   (required)
student_phone String   (required)
message       String
created_at    Date     (auto)
```

### OtpStore
```
phone          String  (unique, PK for lookups)
otp            String  (hashed or plain)
expires_at     Number  (unix ms)
last_sent_at   Number  (unix ms)
attempt_count  Number
locked_until   Number  (unix ms; 0 = not locked)
```

### RefreshToken
```
_id         ObjectId (PK)
user_id     ObjectId -> User (required)
jti         String   (unique JWT ID)
expires_at  Number   (unix ms)
revoked_at  Date     (null = active)
created_at  Date     (auto)
```

### AdminLog
```
_id        ObjectId (PK)
action     String   (required; human-readable description)
done_by    ObjectId -> User
created_at Date     (auto)
```

### Entity Relationships

```
User --------< Listing   (via owner_id)
User --------< Booking   (via student_id)
Listing -----< Booking   (via listing_id)
Listing -----< Enquiry   (via listing_id)
User --------< RefreshToken (via user_id)
User --------< AdminLog  (via done_by)
```

---

## 7. API Reference

### Auth  `/api/auth`

| Method | Path                | Auth Required | Description                               |
|--------|---------------------|---------------|-------------------------------------------|
| POST   | `/register`         | —             | Register with name, email, password       |
| POST   | `/login`            | —             | Login; returns access + refresh token     |
| POST   | `/refresh`          | —             | Rotate refresh token; return new access token |
| POST   | `/logout`           | —             | Revoke refresh token                      |
| GET    | `/me`               | Bearer        | Return current user profile               |
| POST   | `/send-otp`         | —             | Send OTP to phone number                  |
| POST   | `/verify-otp`       | —             | Verify OTP; return tokens                 |
| POST   | `/complete-profile` | Bearer        | Set name/email after OTP login            |

### Listings  `/api/listings`

| Method | Path                    | Auth Required | Description                                     |
|--------|-------------------------|---------------|-------------------------------------------------|
| GET    | `/`                     | —             | Browse all approved listings (supports `?q=`, `?location=`, `?minPrice=`, `?maxPrice=`, `?amenities=`) |
| GET    | `/:id`                  | —             | Single listing detail                           |
| GET    | `/owner/mine`           | Owner         | Owner's own listings                            |
| POST   | `/`                     | Owner         | Create listing (multipart/form-data with image) |
| PATCH  | `/:id/availability`     | Owner         | Toggle `is_available`                           |
| DELETE | `/:id`                  | Owner         | Delete own listing                              |
| POST   | `/enquire/:propertyId`  | Logged in     | Submit an enquiry                               |

### Bookings  `/api/bookings`

| Method | Path    | Auth Required | Description                               |
|--------|---------|---------------|-------------------------------------------|
| POST   | `/`     | Logged in     | Create a booking request                  |
| GET    | `/my`   | Logged in     | List student's own bookings               |
| GET    | `/owner`| Owner         | List booking requests on owner's listings |
| PATCH  | `/:id`  | Owner         | Accept or reject a booking                |

### Admin  `/api/admin`

| Method | Path           | Auth Required | Description                  |
|--------|----------------|---------------|------------------------------|
| GET    | `/listings`    | Admin         | All listings (any status)    |
| PATCH  | `/listings/:id`| Admin         | Approve or reject a listing  |
| GET    | `/users`       | Admin         | All registered users         |
| GET    | `/logs`        | Admin         | Admin action audit log       |

---

## 8. Authentication & Security

### Token Strategy: Dual-JWT

```
Login  ->  [Access Token: 15 min JWT]  +  [Refresh Token: 7 day JWT stored in DB]
                |                                    |
         sent in response body              sent in HttpOnly cookie
                |
         stored in localStorage by auth-client.js
                |
         attached as  Authorization: Bearer <token>  on every API call
```

**Silent Refresh:**
When any API call returns `{ expired: true }` with a 401, `auth-client.js` automatically calls `POST /api/auth/refresh`. On success it retries the original request transparently; on failure it redirects to `/login`.

**Refresh Token Rotation:**
Each `POST /api/auth/refresh` call **revokes the old `jti`** and issues a brand new refresh token, preventing replay attacks.

### Password Hashing
Passwords are hashed with **bcrypt** before storage. The `password` field is `null` for phone-OTP-only users.

### Role-Based Access Control (RBAC)

| Middleware  | Allowed Roles          |
|-------------|------------------------|
| `isLoggedIn`| any authenticated user |
| `isOwner`   | `owner`, `admin`       |
| `isAdmin`   | `admin` only           |

### OTP Security

`OtpStore` tracks per-phone:
- **Rate limiting**: `last_sent_at` prevents OTP spam
- **Brute-force lockout**: `attempt_count` + `locked_until` lock the phone after N failed verifications
- **Expiry**: `expires_at` enforces a short-lived OTP window

---

## 9. File Uploads

Property images are handled by **Multer**:

```
POST /api/listings  (multipart/form-data)
         |
    [Multer diskStorage]
         |
   /backend/uploads/listing-<timestamp>-<random>.<ext>
         |
   Listing.image_path = "listing-<...>.jpg"
         |
   Served at  GET /uploads/listing-<...>.jpg
```

- **Allowed types:** `jpeg`, `jpg`, `png`, `webp`
- **Max file size:** 5 MB
- **Storage:** Local filesystem (suitable for single-server deployments; swap for S3/Cloudinary for production scale)

---

## 10. Notification System

Located in `utils/email.js` and `utils/sms.js`.

| Trigger               | Channel | Recipient                          |
|-----------------------|---------|------------------------------------|
| Booking accepted      | Email   | Student                            |
| Booking rejected      | Email   | Student                            |
| New booking request   | Email   | Owner                              |
| OTP verification      | SMS     | User's phone                       |
| New enquiry submitted | Email   | Owner (via listing contact)        |

Both helpers are thin wrappers:
- `email.js` — wraps **Nodemailer** with a reusable `sendMail(to, subject, html)` function.
- `sms.js` — integrates with a configurable SMS gateway for OTP delivery.

---

## 11. Admin Panel

The admin panel (`/admin`) provides:

1. **Listing moderation** — view all listings (pending / approved / rejected), approve or reject with optional notes. Approval state is represented as:
   - `0` — Pending review
   - `1` — Approved (visible to students)
   - `2` — Rejected

2. **User management** — view all registered users and their roles.

3. **Audit log** — all admin actions are recorded in `AdminLog` with the acting admin's `user_id`, enabling accountability.

---

## 12. Key Design Decisions

### Why MPA instead of SPA?
Each page is a standalone HTML file rather than a React/Vue SPA. This keeps the stack simple, avoids a build step for the frontend, and makes the project easier to understand and extend without a JavaScript framework.

### Why store access tokens in `localStorage`?
The access token (15-minute lifetime) is stored in `localStorage` for easy JavaScript access. The long-lived refresh token is stored in an **HttpOnly cookie**, which is inaccessible to JavaScript and thus protected from XSS theft.

### Why local disk storage for images?
Multer + local disk is the simplest setup for a single-server deployment (e.g., MVP). Migrating to cloud object storage (S3, Cloudinary) requires only changing the Multer storage engine and updating `image_path` to a full URL.

### Why `is_approved` as a Number (0/1/2) instead of a String?
Numeric states are easy to sort and filter with range queries in MongoDB and map naturally to CSS conditionals in the UI without string comparisons.

### Why store OTP state on `OtpStore` directly?
Rate-limit fields (`attempt_count`, `locked_until`) live directly on the `OtpStore` document keyed by phone. This keeps OTP security logic atomic and co-located with the OTP itself, eliminating the need for a separate rate-limit table.

### Why store Refresh Tokens in the DB?
Storing `jti` in MongoDB allows **server-side revocation** on logout — something pure stateless JWTs cannot provide. The trade-off is one extra DB read on each refresh call, which is acceptable given the infrequency of token rotation.
