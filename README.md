# 🏠 NestMate - Student Housing & PG Discovery Platform

NestMate is a full-stack student housing marketplace designed to connect university students with verified property owners. The platform streamlines finding, browsing, enquiring, and booking accommodations with a robust admin moderation workflow to ensure safety and quality control.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🗄️ Database Architecture & Schema](#️-database-architecture--schema)
- [🔑 Default Credentials](#-default-credentials)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [🌐 Environment Variables](#-environment-variables)
- [🔌 API Endpoint Reference](#-api-endpoint-reference)
- [👥 User Workflows](#-user-workflows)
- [🚢 Deployment Guide](#-deployment-guide)

---

## ✨ Key Features

### 🎓 For Students
- **Smart Location Search**: Filter approved properties by campus or city location.
- **Detailed Property Views**: Inspect high-res image uploads, room descriptions, monthly rent, and amenities (WiFi, AC, Food, Gym, etc.).
- **Dual Authentication**: Sign up and log in via standard **Email & Password** or passwordless **Phone Number + 6-Digit SMS OTP**.
- **Direct Enquiries**: Send instant property enquiries to owners with automatic email notifications.
- **Move-in Booking Requests**: Reserve housing by requesting a move-in date and tracking application status (`pending`, `accepted`, `rejected`).

### 🏡 For Property Owners
- **Listing Management**: List properties with multi-field specs and image upload support.
- **Availability Toggle**: Switch room status between *Available* and *Unavailable* in one click.
- **Booking Requests Dashboard**: Review incoming student booking applications with power to accept or decline.
- **Email Notifications**: Receive automated email alerts whenever a student submits a new inquiry.

### 🛡️ For System Administrators
- **Property Moderation Queue**: Review pending property submissions before they appear publicly. Approve or reject listings with automated audit logging.
- **User Management**: Monitor registered platform users and their listing activity counts.
- **Audit Logs**: Full audit trail of administrative actions (`admin_log`) and security attempts (`otp_logs`).

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla JavaScript | Dynamic DOM manipulation, asynchronous Fetch API client calls |
| **Styling** | Tailwind CSS v3 | Utility-first responsive CSS styling with custom build minification |
| **Backend Framework** | Node.js + Express.js | REST API, static asset server, and middleware guards |
| **Database** | MongoDB + Mongoose | High-performance document database with Mongoose ODM modeling |
| **Authentication** | `express-session`, `bcrypt` | Cookie-based HTTP-only session state (`connect.sid`) + password salt hashing |
| **Media Handling** | `multer` | Disk storage handling for uploaded property images (`/uploads`) |
| **Communications** | `nodemailer`, `Fast2SMS` | Gmail SMTP integration for enquiries + SMS Gateway for phone OTPs |

---

## 🔒 Auth Architecture (JWT & Refresh Token Rotation)

NestMate uses stateless **JWT Access Tokens** paired with persistent **Refresh Token Rotation**:
- **Access Token**: Short-lived (15 min) JWT containing payload `{ userId, role }`. Transmitted via `Authorization: Bearer <accessToken>` header for protected API routes.
- **Refresh Token**: Long-lived (7 days) JWT containing `{ userId, jti }`. Stored as a secure, HTTP-only, `sameSite='strict'` cookie (`refreshToken`).
- **Token Rotation & Revocation**: Every refresh request (`POST /api/auth/refresh`) revokes the used `jti` in the SQLite `refresh_tokens` database table and issues a brand new access and refresh token pair (one-time use).
- **Logout**: Calling `POST /api/auth/logout` explicitly revokes the active `jti` claim in the DB and clears the refresh cookie.
- **Frontend Interceptor**: Client JS (`/auth-client.js`) transparently attaches the Bearer token to API calls and retries failed requests once after auto-refreshing on `401 Token Expired` responses.

---

## 📁 Project Structure

```text
nestmate/
├── backend/
│   ├── server.js              # Express app entry point & route registration
│   ├── database.js            # SQLite setup, migrations, table schemas & seed data
│   ├── input.css              # Source CSS for Tailwind processing
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── package.json           # Backend node dependencies & scripts
│   ├── config/                # Platform configuration files
│   ├── controllers/           # Business logic modules
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── bookingsController.js
│   │   └── listingsController.js
│   ├── middleware/            # Auth guard middleware (isLoggedIn, isOwner, isAdmin)
│   │   └── auth.js
│   ├── models/                # Entity models & helper wrappers
│   ├── public/                # Static frontend pages served by Express
│   │   ├── admin/             # Admin moderation panel UI
│   │   ├── browse/            # Public property search & detail UI
│   │   ├── complete_profile/  # OTP profile setup UI
│   │   ├── dashboard/         # Owner dashboard UI
│   │   ├── home/              # Homepage UI
│   │   ├── listing/           # Property creation UI
│   │   └── login/             # Auth gateway UI
│   ├── routes/                # REST API route handlers
│   │   ├── admin.js           # /api/admin/*
│   │   ├── auth.js            # /api/auth/*
│   │   ├── bookings.js        # /api/bookings/*
│   │   └── listings.js        # /api/listings/*
│   ├── uploads/               # Stored property listing images
│   └── utils/                 # Utility services (email.js, sms.js)
└── scripts/
    └── create_backup.js       # SQLite database backup automation script
```

---

## 🗄️ Database Architecture & Schema

The platform relies on SQLite (`nestmate.db`) with Foreign Keys enabled:

```
                      +-------------------+
                      |       users       |
                      +-------------------+
                      | id (PK)           |
                      | name, email, phone|
                      | password, role    |
                      +---------+---------+
                                |
             +------------------+------------------+
             | 1:N                                 | 1:N
             v                                     v
+------------------------+             +------------------------+
|        listings        |             |        bookings        |
+------------------------+             +------------------------+
| id (PK)                |             | id (PK)                |
| owner_id (FK -> users) |<---+        | listing_id (FK)        |
| title, location, price |    |        | student_id (FK -> users|
| description, amenities |    | 1:N    | move_in_date, status   |
| image_path             |    +--------| message, created_at    |
| is_approved,available  |             +------------------------+
+-----------+------------+
            | 1:N
            v
+------------------------+
|       enquiries        |
+------------------------+
| id (PK)                |
| listing_id (FK)        |
| student_name, phone    |
| message, created_at    |
+------------------------+
```

### Table Definitions
1. **`users`**: Platform users storing `id`, `name`, `email`, `password` (bcrypt), `phone` (unique), and `role` (`student`, `owner`, `admin`).
2. **`listings`**: Accommodations with `owner_id` (FK), `title`, `location`, `price`, `description`, `amenities`, `image_path`, `is_approved` (`0`=Pending, `1`=Approved, `2`=Rejected), and `is_available` (`1`=Yes, `0`=No).
3. **`bookings`**: Move-in requests linking `listing_id` (FK) & `student_id` (FK) with `move_in_date`, `status` (`pending`, `accepted`, `rejected`), and `message`.
4. **`enquiries`**: Direct inquiries connecting `listing_id` (FK) with student contact information.
5. **`otp_store`**: Manages phone OTP verification, 60s resend cooldowns, and 15-minute brute-force security lockouts (`attempt_count`, `locked_until`).
6. **`admin_log` & `otp_logs`**: Security and administrative audit trails.

---

## 🔑 Default Credentials

When starting for the first time, the database automatically seeds demo accounts:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@nestmate.com` | `admin123` | Moderate listings, review users & audit logs |
| **Owner** | `owner@nestmate.com` | `owner123` | Create listings, manage availability, process bookings |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/nestmate.git
   cd nestmate/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional for local testing):
   Create a `.env` file inside the `backend/` directory:
   ```env
   PORT=5000
   SESSION_SECRET=your-super-secret-key-change-this
   NODE_ENV=development

   # Optional: Mail configuration for real enquiry notifications
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_gmail_app_password

   # Optional: Fast2SMS API key for sending real SMS OTPs in India
   FAST2SMS_API_KEY=your_fast2sms_api_key
   ```

4. **Start the server**:
   - **Development Mode** (with auto-reload):
     ```bash
     npm run dev
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```

5. **Open in Browser**:
   Navigate to `http://localhost:5000/home/code.html`

---

## 🔌 API Endpoint Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Auth Guard | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register with email, password & role |
| `POST` | `/api/auth/login` | Public | Login with email & password |
| `POST` | `/api/auth/logout` | Logged In | Clear session & cookie |
| `GET` | `/api/auth/me` | Public | Fetch current authenticated user session |
| `POST` | `/api/auth/send-otp` | Public | Request 6-digit SMS OTP (60s cooldown limit) |
| `POST` | `/api/auth/verify-otp` | Public | Verify OTP code & establish session |
| `POST` | `/api/auth/complete-profile` | Logged In | Update profile details for OTP signups |

### 🏠 Property Listings (`/api/listings`)
| Method | Endpoint | Auth Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings` | Public | Fetch approved & available listings (supports `?location=`) |
| `GET` | `/api/listings/owner/mine` | Owner / Admin | Fetch property owner's own listings |
| `GET` | `/api/listings/:id` | Public | Fetch single property detail by ID |
| `POST` | `/api/listings` | Owner | Create new property listing with image upload |
| `PATCH` | `/api/listings/:id/availability` | Owner / Admin | Toggle property availability status |
| `DELETE` | `/api/listings/:id` | Owner / Admin | Delete listing and related bookings |
| `POST` | `/api/listings/enquire/:propertyId` | Logged In | Submit enquiry & send email alert to owner |

### 📅 Bookings (`/api/bookings`)
| Method | Endpoint | Auth Guard | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Student | Request booking for a move-in date |
| `GET` | `/api/bookings/my` | Student | View student's submitted booking requests |
| `GET` | `/api/bookings/owner` | Owner / Admin | View incoming booking requests for owner's properties |
| `PATCH` | `/api/bookings/:id` | Owner / Admin | Accept or reject a student booking request |

### 🛠️ Admin Moderation (`/api/admin`)
| Method | Endpoint | Auth Guard | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/listings` | Admin | Fetch all listings (including pending approvals) |
| `PATCH` | `/api/admin/listings/:id` | Admin | Approve (`1`) or reject (`2`) a property listing |
| `GET` | `/api/admin/users` | Admin | List all registered users with property counts |
| `GET` | `/api/admin/logs` | Admin | View audit trail of admin actions |

---

## 👥 User Workflows

```
STUDENT FLOW:
Home Page -> Search by Location -> Browse Approved Listings -> View Detail Page
  └─> Login / OTP Verify -> Send Booking Request / Enquiry -> Track Request Status in Profile

OWNER FLOW:
Login -> Owner Dashboard -> List New Property (Upload Image)
  └─> Listing Marked Pending -> Wait for Admin Approval -> Manage Bookings & Room Availability

ADMIN FLOW:
Login as admin@nestmate.com -> Admin Moderation Panel -> Review Pending Listings
  └─> Click Approve/Reject -> Log action -> System updates public listing search
```

---

## 🚢 Deployment Guide

### Deploying to Render.com (Free Tier)

1. Push your project to a GitHub repository.
2. Go to [Render.com](https://render.com) and create a **New Web Service**.
3. Select your GitHub repository.
4. Configure settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add Environment Variables:
   - `SESSION_SECRET`: Random 32-character string
   - `NODE_ENV`: `production`
6. Click **Deploy Web Service**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
