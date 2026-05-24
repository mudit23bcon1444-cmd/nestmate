# NestMate Student Housing Platform - Project Overview

## 1. Project Details
NestMate is a comprehensive, full-stack student housing marketplace designed to connect university students with property owners. The platform streamlines the process of finding, browsing, and booking accommodations. It ensures quality and security by implementing an admin approval workflow for new property listings. 

Key features include:
- **User Roles:** Distinct roles for Students, Property Owners, and Administrators.
- **Property Listings:** Owners can upload property details along with images.
- **Booking System:** Students can request to book properties, and owners can accept or reject these requests.
- **Admin Moderation:** An admin panel to review, approve, or reject new property listings before they go live on the platform.

## 2. Tech Stack
The project is built using a modern JavaScript stack, emphasizing simplicity and performance:

### Frontend
- **HTML5 & Vanilla JavaScript:** For page structure and dynamic DOM manipulation without the overhead of heavy frameworks.
- **Tailwind CSS:** A utility-first CSS framework used for rapid UI development, responsive layouts, and modern design aesthetics.

### Backend
- **Node.js:** JavaScript runtime environment.
- **Express.js:** Fast, unopinionated web framework for building the RESTful API and serving static files.
- **Multer:** Middleware for handling `multipart/form-data`, specifically used for property image uploads.
- **Express-Session:** For managing user sessions and authentication state.
- **Bcrypt:** For securely hashing user passwords before storing them in the database.

### Database
- **SQLite:** A lightweight, serverless relational database, accessed via the `better-sqlite3` package for high-performance synchronous queries.

## 3. Website Flow

The platform's flow is tailored to the three primary user roles:

### A. Student Flow
1. **Discovery:** Students arrive at the **Home Page** and can search for properties by location.
2. **Browsing:** The search leads to the **Browse Listings Page**, displaying a grid of all *approved* and *available* properties.
3. **Detail View:** Clicking a listing opens the **Listing Detail Page**, showing high-quality images, pricing, amenities, and a description.
4. **Booking:** To book, the student logs in or registers. They can then submit a booking request specifying a move-in date and an optional message.
5. **Tracking:** Students can track the status of their requests (Pending, Accepted, or Rejected) through their profile.

### B. Property Owner Flow
1. **Onboarding:** Owners register and log in, landing on the **Owner Dashboard**.
2. **Listing Creation:** Owners can navigate to the **List Property Page** to add a new accommodation, providing details, pricing, amenities, and uploading a cover image.
3. **Moderation Status:** Newly created listings are initially marked as "Pending" and are not visible to students until admin approval.
4. **Management:** From the dashboard, owners can view all their properties, toggle their availability status (e.g., if a room is filled), and delete listings.
5. **Booking Resolution:** Owners receive booking requests from students and can review, accept, or reject them directly from their dashboard.

### C. Admin Flow
1. **Access:** Admins log in using secure credentials and access the dedicated **Admin Panel**.
2. **Listing Moderation:** Admins view all pending property listings submitted by owners. They can review the details and click "Approve" to make the listing public or "Reject" to decline it.
3. **Oversight:** Admins also have access to view all registered users on the platform and check the system logs for administrative actions.
