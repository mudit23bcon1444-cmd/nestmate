# NestMate Backend

Complete Node.js + Express + SQLite backend for the NestMate student housing platform.

## 🚀 Quick Start

```bash
cd nestmate-backend
npm install
node server.js
```

Open → **http://localhost:3000/nestmate_home_refined/code.html**

---

## 🔑 Seeded Accounts (Ready to Use)

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@nestmate.com       | admin123   |
| Owner | owner@nestmate.com       | owner123   |

> ⚠️ Change the admin password before going to production.

---

## 📁 Project Structure

```
nestmate-backend/
├── server.js              ← Express app entry point
├── database.js            ← SQLite setup, table creation, seeding
├── .env                   ← SESSION_SECRET, PORT (gitignored)
├── nestmate.db            ← Auto-created SQLite file
├── routes/
│   ├── auth.js            ← /api/auth/* (register, login, logout, me)
│   ├── listings.js        ← /api/listings/* (CRUD + availability toggle)
│   ├── bookings.js        ← /api/bookings/* (request, view, accept/reject)
│   └── admin.js           ← /api/admin/* (approve/reject listings, view users)
├── middleware/
│   └── auth.js            ← isLoggedIn, isOwner, isAdmin guards
├── public/                ← All frontend HTML pages (served as static files)
│   ├── nestmate_home_refined/code.html
│   ├── browse_listings_nestmate_refined/code.html
│   ├── browse_listings_nestmate_refined/listing.html  ← Dynamic detail page
│   ├── list_your_property_nestmate/code.html
│   ├── owner_dashboard_nestmate/code.html
│   └── admin_panel_nestmate_refined/code.html
└── uploads/               ← Property images (multer saves here)
```

---

## 🌐 Page URLs

| Page             | URL                                                              |
|------------------|------------------------------------------------------------------|
| Home             | `/nestmate_home_refined/code.html`                              |
| Browse Listings  | `/browse_listings_nestmate_refined/code.html`                   |
| Listing Detail   | `/browse_listings_nestmate_refined/listing.html?id=<ID>`        |
| List Property    | `/list_your_property_nestmate/code.html`                        |
| Owner Dashboard  | `/owner_dashboard_nestmate/code.html`                           |
| Admin Panel      | `/admin_panel_nestmate_refined/code.html`                       |

---

## 🔌 API Reference

### Auth — `/api/auth`
| Method | Endpoint           | Auth Required | Description                    |
|--------|--------------------|---------------|--------------------------------|
| POST   | `/register`        | None          | Create student or owner account |
| POST   | `/login`           | None          | Login with email + password    |
| POST   | `/logout`          | None          | Destroy session                |
| GET    | `/me`              | None          | Get current logged-in user     |

### Listings — `/api/listings`
| Method | Endpoint              | Auth Required | Description                        |
|--------|-----------------------|---------------|------------------------------------|
| GET    | `/`                   | None          | All approved + available listings  |
| GET    | `/owner/mine`         | Owner         | Owner's own listings               |
| GET    | `/:id`                | None          | Single listing detail              |
| POST   | `/`                   | Owner         | Create listing (multipart/image)   |
| PATCH  | `/:id/availability`   | Owner         | Toggle available/unavailable       |
| DELETE | `/:id`                | Owner         | Delete own listing                 |

### Bookings — `/api/bookings`
| Method | Endpoint     | Auth Required | Description                          |
|--------|--------------|---------------|--------------------------------------|
| POST   | `/`          | Student       | Send a booking request               |
| GET    | `/my`        | Logged in     | Student views own bookings           |
| GET    | `/owner`     | Owner         | Owner views bookings on their listings |
| PATCH  | `/:id`       | Owner         | Accept or reject a booking           |

### Admin — `/api/admin`
| Method | Endpoint          | Auth Required | Description                 |
|--------|-------------------|---------------|-----------------------------|
| GET    | `/listings`       | Admin         | All listings (incl. pending) |
| PATCH  | `/listings/:id`   | Admin         | Approve (1) or reject (2)   |
| GET    | `/users`          | Admin         | All registered users        |
| GET    | `/logs`           | Admin         | Admin action log            |

---

## 🧭 User Flow

```
Student
  → Home page → search by location → Browse Listings
  → Click listing → Detail page
  → Log in → Send booking request
  → /api/bookings/my — see booking status

Owner
  → Log in → Owner Dashboard (/api/listings/owner/mine)
  → List new property → /api/listings (POST with image)
  → View booking requests → Accept/Reject (/api/bookings/owner)
  → Toggle availability (/api/listings/:id/availability)

Admin
  → Log in with admin@nestmate.com / admin123
  → Admin Panel → see pending listings
  → Approve/Reject → /api/admin/listings/:id (PATCH)
```

---

## 🚢 Deploy to Render.com (Free)

1. Push this `nestmate-backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   - `SESSION_SECRET` = any random 32-char string
   - `NODE_ENV` = `production`
6. Click **Deploy**

> The SQLite `.db` file lives on Render's disk. On free tier it resets on redeploy — acceptable for a college project.

---

## 🗄️ Database Schema

```sql
users       (id, name, email, password[bcrypt], role)
listings    (id, owner_id, title, location, price, description, amenities, image_path, is_approved, is_available, created_at)
bookings    (id, listing_id, student_id, move_in_date, status, message, created_at)
admin_log   (id, action, done_by, created_at)
```

- `is_approved`: 0 = pending, 1 = approved, 2 = rejected
- `amenities`: comma-separated string: `"WiFi,AC,Gym,Laundry"`
