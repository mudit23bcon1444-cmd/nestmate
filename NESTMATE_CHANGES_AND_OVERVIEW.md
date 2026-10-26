# NestMate: Complete Project Changelog & Feature Architecture Overview

---

## 1. Executive Summary

**NestMate** is a modern student housing and room-rental platform built to connect university students with verified accommodation owners. It eliminates brokerage fees and predatory leasing through transparency, map-based proximity search, and atomic booking conflict resolution.

This document details:
1. **The Complete Changelog**: Every architectural, security, design, and functional bug fix implemented across the frontend and backend.
2. **Feature-by-Feature Overview**: An exact description of how every page and feature in the project looks, behaves, and adapts across roles (Guest, Student, Owner, Superadmin).

---

## 2. Architectural & Technical Stack

| Layer | Technologies | Key Characteristics |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8.3 | High-speed Rolldown/Vite client build, sub-second HMR |
| **State & Data Fetching** | TanStack React Query v5 | Automatic query caching, window focus refetch, optimistic mutation |
| **Styling & Design System** | Tailwind CSS v3.4 + Custom Tokens | Tailored warm palette, fractal SVG noise overlay, `sharp-shadow` |
| **Typography & Icons** | Google Fonts + Lucide Icons | *Poppins* (Headings), *Inter* (Body/Buttons), *Material Symbols* |
| **Mapping Engine** | Leaflet + React-Leaflet | OpenStreetMap tiles, dynamic bounds fitting, custom marker popups |
| **Backend & API** | Node.js + Express | REST API, Zod schema validation, Helmet, rate limiters |
| **Database** | MongoDB Atlas + Mongoose 9 | GeoJSON geospatial index (`2dsphere`), replica set transactions |
| **Authentication** | JWT In-Memory + HTTP-only Cookie | Refresh token rotation, single-use JTIs, 15-second grace window |

---

## 3. What Changed in the Project (Detailed Changelog)

### A. Security & Backend Reliability Overhaul
1. **Secret & Key Isolation**:
   - Removed `.env` from automatic backups in `scripts/create_backup.js`.
   - Prevented accidental exposure of Atlas connection strings, Fast2SMS keys, and Gmail app credentials.
2. **Database Pipeline Optimizations**:
   - Refactored `adminController.getAllUsers` to exclude password hashes (`.select('-password')`).
   - Replaced redundant loops with MongoDB aggregation pipelines (`$lookup` and `$group`) to eliminate N+1 query bottlenecks.
   - Replaced mock performance figures in documentation with reproducible `explain('executionStats')` benchmarks.
3. **Compound Rate Limiting**:
   - Login rate limiter now uses a compound key of `IP + Email` to prevent campus/hostel Wi-Fi users from locking each other out.
   - Excluded `/api/auth/refresh` from global rate limiting to ensure continuous session continuity across navigation.
4. **macOS Port Conflict Resolution**:
   - Reconfigured backend default port from `5000` to `5001` to eliminate `EPERM` conflicts with macOS AirPlay Receiver (`ControlCenter`).
   - Updated Vite proxy in `frontend/vite.config.js` to target `http://localhost:5001`.

### B. Route Hijacking & Server Delivery Fix
- **Problem**: When accessing `http://localhost:5001/dashboard`, Express had hardcoded routes returning legacy static HTML (`public/dashboard/code.html`), which displayed a static "Owner Overview" containing mock listings (`Sunset Loft Studio`).
- **Fix in `backend/server.js`**:
  - Configured Express to serve the compiled React SPA (`frontend/dist/index.html`) for all client routes (`/dashboard`, `/browse`, `/admin`, etc.) whenever `frontend/dist` exists.
  - Converted legacy HTML serving into a fallback only used if the React production bundle is unbuilt.

### C. Role-Based Navigation & Identity Isolation
- **Problem**: Students logging in as `mudit.23bcon1444@jecrcu.edu.in` saw "List Property" in the top navigation and were shown an owner dashboard with empty listing tables. Clicking "List Property" caused unexpected redirects to `/browse`.
- **Fix in `frontend/src/components/Navbar.jsx`**:
  - **Student View**: Shows `Browse`, `My Bookings` (active underline), `About`, and a user pill showing `Mudit (Student)`. "List Property" is hidden.
  - **Owner View**: Shows `Browse`, `List Property` (links to `/listing/new`), `Dashboard` (Owner Overview), `About`, and an `Owner` badge.
  - **Admin View**: Shows `Browse`, `List Property`, `Dashboard`, `Admin Portal` (links to `/admin`), and an `Admin` badge.
  - **Guest View**: Shows `Browse`, `List Property` (redirects to register/login), `About`, `Login`, and `Sign Up`.

### D. Dedicated Student vs. Owner Dashboards (`Dashboard.jsx`)
- **Problem**: The dashboard page was written purely around the owner template, mixing owner tables with student accounts and failing on `.map()` calls due to API response wrapping.
- **Fix in `frontend/src/pages/Dashboard.jsx`**:
  - **Normalized API Data Shapes**: Handled wrapped objects (`{ bookings: [...] }` and `{ listings: [...] }`) with defensive array guards (`data?.bookings || []`).
  - **Brand New Student Portal**:
    - Header with Student Badge and email.
    - 3 Student Stat Cards: *Total Applications*, *Confirmed Stays*, and *Under Review*.
    - Interactive Stay Cards featuring property photos, title, location, monthly rent, target move-in date (`move_in_date`), landlord contact, and live status badges (*Confirmed Stay*, *Under Review*, *Declined*).
    - Zero owner forms, widgets, or listing buttons shown to students.
  - **Owner Management Portal**:
    - Maintained Active Listings, Total Views, and Enquiries stat cards.
    - Tabbed view: *Incoming Tenant Requests* (with atomic Accept/Decline action buttons) and *My Properties* (with live availability status and Edit buttons).

### E. Booking Mutation Field Synchronization (`PropertyDetail.jsx`)
- **Problem**: Booking submission was sending `start_date`, which was rejected by backend Zod validation requiring `move_in_date`.
- **Fix**: Updated payload to `{ listing_id: id, move_in_date: startDate, message: message.trim() }`.

---

## 4. Feature-by-Feature Visual & Functional Overview

### 1. Global Design System & Navigation Bar
- **Aesthetic**:
  - Light mode surface background (`#fff8f6`) accented with warm orange highlights (`#ff6b35` and `#ab3500`).
  - Fractal SVG noise overlay in `body::before` adds tactile depth.
  - Glassmorphic navigation header (`backdrop-blur-lg bg-surface/90`) pinned to top.
- **Elements**:
  - **Brand Logo**: `NestMate.` in bold Poppins typography with a vibrant orange period.
  - **Role Badge**: Pill badge in the top right displaying user initial avatar, first name, and account type (`Student`, `Owner`, or `Admin`).
  - **Quick Logout**: Discrete icon button in red hover container that securely clears the in-memory access token and ends the session.

---

### 2. Homepage (`/`)
- **Hero Canvas**:
  - Warm dual-gradient ambient backdrop (`from-primary/10 via-surface-container to-transparent`).
  - Headline: *"Find Your Perfect Student Home, Near Campus & Zero Brokerage"*.
  - Subtitle explaining verified student accommodations with transparent pricing.
- **Integrated Search Pill**:
  - Multi-parameter floating bar featuring Location input, Student Budget dropdown, and Property Type selector (`Studio`, `PG`, `Flat`, `Hostel`).
  - Search button triggers navigation to `/browse` with pre-filled query parameters.
- **Live Platform Stats**:
  - 4 glass cards displaying real numbers: `2,400+ Active Listings`, `800+ Verified Owners`, `12 College Cities`, and `4.8★ Tenant Satisfaction`.
- **Category Grid**:
  - 4 quick-select cards with hover zoom: *Private PG*, *Shared Student Flat*, *Campus Hostels*, and *Studio Apartments*.
- **Curated Featured Listings**:
  - Displays real listings from MongoDB Atlas with fallbacks to curated studio lofts.
  - Cards include badges (`FEATURED`, `NEW`, `POPULAR`), heart button micro-interaction, location pin, price per month, and instant navigation.
- **Connected 3-Step "How It Works" Section**:
  - Step 1: *Search & Filter* (proximity to campus).
  - Step 2: *Request Viewing or Instant Booking* (conflict-free reservations).
  - Step 3: *Move In Seamlessly* (direct contact with verified landlords).
- **Role-Aware Call-to-Action Banner**:
  - Dark brown container (`#261814`) with warm ambient glowing circle.
  - If guest: *"List Your Property Now"* (leads to register).
  - If student: *"Find Your Room Today"* (leads to browse).
  - If owner: *"Add New Property"* (leads to `/listing/new`).

---

### 3. Browse Listings (`/browse`)
- **Live Search Header**:
  - Search query counter with pulsing live indicator (*"Live Listings Found"*).
  - Sort selector dropdown: *Price: Low to High*, *Price: High to Low*, *Newest Added*, and *Best Match*.
  - Layout toggle: Switch between responsive **Grid View** and interactive **Map View**.
- **Sticky Left Filter Sidebar**:
  - **Price Range**: Interactive slider from ₹2,000 to ₹50,000 with real-time value label.
  - **Property Type**: Multi-select pills (`PG / Hostel`, `Studio`, `1BHK Flat`, `Shared Room`).
  - **Gender / Resident Preference**: Filter by *Any*, *Boys Only*, *Girls Only*, or *Co-living*.
  - **Amenities Checklist**: Checkboxes for *High-Speed WiFi*, *Air Conditioning*, *Power Backup*, *Attached Bath*, *Laundry*, *Gym*, and *Food Included*.
  - **Reset Filters**: Button that clears all URL query params with one click.
- **Listings Grid**:
  - 3-column card grid with hover lift animation (`hover-lift`).
  - Image preview with room type tag (`Studio`, `Single`, `Shared`).
  - Title, university proximity snippet, verified green checkmark, and floating price tag (`₹X,XXX/mo`).
- **Interactive Leaflet Map**:
  - Renders custom markers for every listing with latitude and longitude.
  - Clicking any pin displays a popup card with property photo, title, rent, and a direct link to the listing.

---

### 4. Property Detail Page (`/property/:id`)
- **Asymmetrical Photo Gallery**:
  - Large hero photo on the left (2 columns wide).
  - Two stacked preview photos on the right with a *"View all photos"* counter button.
- **Property Header & Badges**:
  - Badges: `Featured`, `NestMate Verified`, and `Available for Rent` (or `Already Reserved` in neutral grey).
  - Title in bold Poppins typography (`The Heritage Loft by NestMate`).
  - Location subtitle with Google Maps clickout.
- **Detailed Information Sections**:
  - **About Property**: Formatted description with paragraph spacing.
  - **Amenities Grid**: 6 distinct cards with icons (*WiFi*, *Air Conditioning*, *Laundry*, *Kitchen*, *Gym*, *24/7 Security*).
  - **House Rules**: Styled tiles (*Check-in after 2:00 PM*, *No smoking*, *Max residents*, *Pet policy*).
  - **Embedded Proximity Map**: Embedded Leaflet map showing the exact neighborhood coordinates.
  - **Tenant Reviews**: Verified resident reviews with 5-star rating scores and tenant profile badges.
- **Sticky Right Booking & Host Card**:
  - Monthly rent price display with *"Utilities & WiFi included"* subtext.
  - **Host Profile**: Host headshot with online status indicator, host name, response time, and star rating.
  - **Booking Form**:
    - Target move-in date picker (`move_in_date`).
    - Optional message to landlord.
    - Primary button: *"Request Room Booking"*.
    - Conflict Guard: If another student reserved the room while the page was open, displays a 409 conflict alert: *"This room was just booked by another student"*.

---

### 5. Student Living Dashboard (`/dashboard` for Students)
- **Header**:
  - Branded `Student Portal` badge with student email.
  - Title: *"My Student Bookings & Stays"*.
  - Subtitle: *"Welcome back, Mudit! Track your room applications, verified stays, and move-in dates."*
  - Top action button: *"Browse Rooms"* (direct link to `/browse`).
- **Student Metric Cards**:
  1. **Total Applications**: Total count of all requests submitted.
  2. **Confirmed Stays**: Count of bookings marked `accepted` by owners.
  3. **Under Review**: Count of bookings currently pending review.
- **Student Stays Feed**:
  - Each booking is rendered in an individual card:
    - Property thumbnail with room type tag (`Studio`, `PG`, `Single Room`).
    - Status pill:
      - `Confirmed Stay` (Green with checkmark).
      - `Under Review` (Amber with clock).
      - `Declined` (Red with cancel).
    - Accommodation title and university location link.
    - Confirmed Move-in Date (`Move-in: DD/MM/YYYY`).
    - Monthly rent (`₹X,XXX/mo`).
    - Landlord Name for easy reference.
    - Action button: *"View Listing"* (opens public property page).
- **Empty State**:
  - Displayed if the student has no bookings:
    - Stylized bed icon.
    - Title: *"No Room Applications Yet"*.
    - Description: *"You haven't applied for any student rooms yet. Browse our verified listings near university campuses with zero brokerage fees."*
    - Primary CTA button: *"Browse Student Accommodations"*.

---

### 6. Owner Management Portal (`/dashboard` for Owners & Admins)
- **Header**:
  - Branded `Owner Portal` badge with owner email.
  - Title: *"Owner Property Overview"*.
  - Subtitle: *"Welcome back! Manage your listings and tenant rental applications."*
  - Top action button: *"List Property"* (`/listing/new`).
- **Owner Metric Cards**:
  1. **Active Listings**: Number of properties currently live.
  2. **Total Views**: Estimated tenant view impressions.
  3. **Bookings & Enquiries**: Total incoming student applications.
- **Tabbed Interface**:
  - **Tab 1: Tenant Requests**:
    - Filterable table with student name, student email, property title, target move-in date, tenant message, and status.
    - **Live Actions**:
      - `Accept`: Triggers atomic MongoDB transaction that reserves the room (`is_available = 0`), sets status to `accepted`, and auto-rejects competing requests.
      - `Decline`: Sets status to `rejected` and frees up the queue.
  - **Tab 2: My Properties**:
    - Table displaying property photo, title, location, monthly rent, and live status badge (`Available` or `Reserved`).
    - Quick actions: *View Public Page* and *Edit Property* (`/edit/:id`).

---

### 7. Create & Edit Property (`/listing/new` & `/edit/:id`)
- **Visual Progress Bar**:
  - 3-step indicator (*1. Basic Info* → *2. Photos & Amenities* → *3. Rules & Pricing*) with an orange progress bar.
- **Form Sections**:
  - **Property Title**: Floating label input (e.g., *"Cozy Studio near Campus"*).
  - **Property Type & Capacity**: Dropdown options (*Studio Apartment*, *Private Room in Shared House*, *Shared Dormitory*) and student capacity number.
  - **Address & GPS Detection**: Text area for full address and university proximity, plus an *"Auto-detect GPS coordinates"* button for interactive map placement.
  - **Amenities Selection**: 9 interactive toggle pills (*WiFi*, *Air Conditioning*, *Attached Bath*, etc.).
  - **Image Upload**: Multi-file uploader with live thumbnail preview and URL fallback.
  - **Pricing & Availability**: Monthly rent in INR and availability toggle.
- **Visual Context Card**:
  - Ambient preview banner with inspirational message: *"Listing a space that feels like home starts with clear details."*

---

### 8. Admin Control Panel (`/admin`)
- **Access Guard**: Strictly restricted to users with `role: 'admin'`. Unauthorized users are redirected.
- **Header**:
  - Search bar to filter users and listings.
  - Administrator identity badge (*"Administrator Portal"*).
- **Platform Overview Cards**:
  1. **Total Registered Users** (Students vs. Landlords).
  2. **Total Listings** (Approved vs. Pending).
  3. **Verification Queue** (Awaiting approval).
  4. **Active System Security Alerts** (Failed logins or audit flags).
- **Two-Column Management Console**:
  - **Listings Awaiting Approval**: Table of newly submitted properties with landlord details. Admin can click `Approve` (sets `is_approved = 1`) or `Reject` (sets `is_approved = 2`).
  - **User Accounts & Moderation**: List of registered users with role badges, email, verification status, and an interactive **Suspend / Activate** toggle button (`is_active`).

---

### 9. Authentication & Onboarding
- **Login (`/login`)**:
  - Minimalist glassmorphic card with `NestMate.` typography.
  - Dual login modes: **Password Login** (email + password) and **OTP Login** (phone number with instant SMS code fallback).
  - On submit: stores access token in memory, sets non-sensitive `localStorage.logged_in = true`, and sets HTTP-only refresh cookie.
- **Registration (`/register`)**:
  - Role selection segmented pill: **"I am a Student looking for a room"** vs. **"I am a Property Owner listing a room"**.
  - Password strength validation and email duplicate detection.
- **Complete Profile (`/complete-profile`)**:
  - Post-registration prompt for phone verification and student university name.

---

### 10. Platform Footer
- **Aesthetic**: Dark espresso theme (`#261814`) with warm white text.
- **Elements**:
  - Brand heading `NestMate` with tagline: *"Finding your home-coming near campus."*
  - Quick links: *Privacy Policy*, *Terms of Service*, *FAQ*, *Contact Support*, and *Student Safety Guide*.
  - Colophon: *"Hand-coded with ❤️ in India. Built for students, trusted by owners."*

---

## 5. Summary Verification Checklist

| Feature / Page | URL Route | Student View | Owner View | Admin View |
| :--- | :--- | :--- | :--- | :--- |
| **Home** | `/` | Browse CTA | List Property CTA | Full CTA |
| **Browse** | `/browse` | Full Access | Full Access | Full Access |
| **Property Details** | `/property/:id` | Can Request Booking | Can View Only | Full Access |
| **Dashboard** | `/dashboard` | **Student Portal (Bookings)** | **Owner Portal (Properties & Requests)** | **Both Views** |
| **Create Listing** | `/listing/new` | Blocked (Redirects) | Full Access | Full Access |
| **Edit Listing** | `/edit/:id` | Blocked (Redirects) | Owned Listings Only | Full Access |
| **Admin Portal** | `/admin` | Blocked (Redirects) | Blocked (Redirects) | Full Access |

---
*Document generated on October 26, 2026. NestMate application is live and running on ports 5173 (Vite Dev Server) and 5001 (Node.js API Server connected to MongoDB Atlas).*
