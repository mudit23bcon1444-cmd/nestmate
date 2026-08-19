// scripts/seed.js — Idempotent & Non-Destructive SQL-to-MongoDB Seed Migration
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Enquiry = require('../models/Enquiry');
const AdminLog = require('../models/AdminLog');
const OtpStore = require('../models/OtpStore');
const OtpLog = require('../models/OtpLog');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nestmate';

async function seed() {
  console.log('🌱 Connecting to MongoDB for non-destructive migration...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const seedFilePath = path.join(__dirname, '../seeds/seed_data.json');
  if (!fs.existsSync(seedFilePath)) {
    console.error(`❌ Seed data file not found at ${seedFilePath}`);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));

  let stats = {
    users: { inserted: 0, skipped: 0 },
    listings: { inserted: 0, skipped: 0 },
    bookings: { inserted: 0, skipped: 0 },
    enquiries: { inserted: 0, skipped: 0 },
    admin_logs: { inserted: 0, skipped: 0 },
    otp_store: { inserted: 0, skipped: 0 },
    otp_logs: { inserted: 0, skipped: 0 }
  };

  // In-memory migration mapping (SQL Integer ID -> MongoDB ObjectId)
  const userIdMap = new Map();
  const listingIdMap = new Map();

  // 1. Process Users (Lookup by normalized email, then by normalized phone)
  console.log(`👤 Processing ${seedData.users.length} users...`);
  for (const u of seedData.users) {
    let existingUser = null;

    if (u.email && u.email.trim()) {
      existingUser = await User.findOne({ email: u.email.toLowerCase().trim() });
    }

    if (!existingUser && u.phone && u.phone.trim()) {
      existingUser = await User.findOne({ phone: u.phone.trim() });
    }

    if (existingUser) {
      userIdMap.set(u.id, existingUser._id);
      stats.users.skipped++;
    } else {
      const userData = {
        name: u.name,
        email: u.email ? u.email.toLowerCase().trim() : undefined,
        password: u.password,
        role: u.role || 'student'
      };
      if (u.phone) userData.phone = u.phone.trim();

      const userDoc = await User.create(userData);
      userIdMap.set(u.id, userDoc._id);
      stats.users.inserted++;
    }
  }

  // 2. Process Listings (Lookup by owner_id + title + location)
  console.log(`🏠 Processing ${seedData.listings.length} listings...`);
  for (const l of seedData.listings) {
    const ownerObjectId = userIdMap.get(l.owner_id);
    if (!ownerObjectId) {
      console.warn(`⚠️ Warning: Owner ID ${l.owner_id} not found for listing "${l.title}". Skipping.`);
      continue;
    }

    const existingListing = await Listing.findOne({
      owner_id: ownerObjectId,
      title: l.title.trim(),
      location: l.location.trim()
    });

    if (existingListing) {
      listingIdMap.set(l.id, existingListing._id);
      stats.listings.skipped++;
    } else {
      const listingDoc = await Listing.create({
        owner_id: ownerObjectId,
        title: l.title.trim(),
        location: l.location.trim(),
        price: l.price,
        description: l.description || null,
        amenities: Array.isArray(l.amenities) ? l.amenities : (l.amenities ? l.amenities.split(',').map(a => a.trim()).filter(Boolean) : []),
        image_path: l.image_path || null,
        is_approved: l.is_approved !== undefined ? l.is_approved : 0,
        is_available: l.is_available !== undefined ? l.is_available : 1,
        created_at: l.created_at ? new Date(l.created_at) : new Date()
      });
      listingIdMap.set(l.id, listingDoc._id);
      stats.listings.inserted++;
    }
  }

  // 3. Process Bookings (Lookup by listing_id, student_id, move_in_date)
  if (seedData.bookings && seedData.bookings.length > 0) {
    console.log(`📅 Processing ${seedData.bookings.length} bookings...`);
    for (const b of seedData.bookings) {
      const listingObjectId = listingIdMap.get(b.listing_id);
      const studentObjectId = userIdMap.get(b.student_id);
      if (!listingObjectId || !studentObjectId) continue;

      const existingBooking = await Booking.findOne({
        listing_id: listingObjectId,
        student_id: studentObjectId,
        move_in_date: b.move_in_date
      });

      if (existingBooking) {
        stats.bookings.skipped++;
      } else {
        await Booking.create({
          listing_id: listingObjectId,
          student_id: studentObjectId,
          move_in_date: b.move_in_date,
          status: b.status || 'pending',
          message: b.message || '',
          created_at: b.created_at ? new Date(b.created_at) : new Date()
        });
        stats.bookings.inserted++;
      }
    }
  }

  // 4. Process Enquiries (Lookup by listing_id, student_phone, message)
  if (seedData.enquiries && seedData.enquiries.length > 0) {
    console.log(`📩 Processing ${seedData.enquiries.length} enquiries...`);
    for (const e of seedData.enquiries) {
      const listingObjectId = listingIdMap.get(e.listing_id);
      if (!listingObjectId) continue;

      const existingEnquiry = await Enquiry.findOne({
        listing_id: listingObjectId,
        student_phone: e.student_phone.trim(),
        message: e.message || ''
      });

      if (existingEnquiry) {
        stats.enquiries.skipped++;
      } else {
        await Enquiry.create({
          listing_id: listingObjectId,
          student_name: e.student_name.trim(),
          student_phone: e.student_phone.trim(),
          message: e.message || '',
          created_at: e.created_at ? new Date(e.created_at) : new Date()
        });
        stats.enquiries.inserted++;
      }
    }
  }

  // 5. Process Admin Logs (Lookup by action, done_by, created_at)
  if (seedData.admin_logs && seedData.admin_logs.length > 0) {
    console.log(`📜 Processing ${seedData.admin_logs.length} admin logs...`);
    for (const log of seedData.admin_logs) {
      const doneByObjectId = userIdMap.get(log.done_by);
      const createdAtDate = log.created_at ? new Date(log.created_at) : new Date();

      const existingLog = await AdminLog.findOne({
        action: log.action,
        done_by: doneByObjectId || null,
        created_at: createdAtDate
      });

      if (existingLog) {
        stats.admin_logs.skipped++;
      } else {
        await AdminLog.create({
          action: log.action,
          done_by: doneByObjectId || null,
          created_at: createdAtDate
        });
        stats.admin_logs.inserted++;
      }
    }
  }

  // 6. Process OTP Store (Lookup by phone)
  if (seedData.otp_store && seedData.otp_store.length > 0) {
    console.log(`🔑 Processing ${seedData.otp_store.length} OTP store records...`);
    for (const o of seedData.otp_store) {
      const existingOtp = await OtpStore.findOne({ phone: o.phone.trim() });
      if (existingOtp) {
        stats.otp_store.skipped++;
      } else {
        await OtpStore.create({
          phone: o.phone.trim(),
          otp: o.otp || o.otp_hash || '123456',
          expires_at: o.expires_at ? Number(o.expires_at) : Date.now() + 600000
        });
        stats.otp_store.inserted++;
      }
    }
  }

  // 7. Process OTP Logs (Lookup by phone, action, created_at)
  if (seedData.otp_logs && seedData.otp_logs.length > 0) {
    console.log(`📱 Processing ${seedData.otp_logs.length} OTP logs...`);
    for (const ol of seedData.otp_logs) {
      const createdAtDate = ol.created_at ? new Date(ol.created_at) : new Date();
      const existingLog = await OtpLog.findOne({
        phone: ol.phone.trim(),
        action: ol.action,
        created_at: createdAtDate
      });

      if (existingLog) {
        stats.otp_logs.skipped++;
      } else {
        await OtpLog.create({
          phone: ol.phone.trim(),
          action: ol.action,
          ip_address: ol.ip_address || null,
          created_at: createdAtDate
        });
        stats.otp_logs.inserted++;
      }
    }
  }

  console.log('\n======================================================');
  console.log('🎉 Migration Completed Successfully!');
  console.log('📊 Migration Summary:');
  console.log(`   - Users:      ${stats.users.inserted} inserted, ${stats.users.skipped} skipped (already exist)`);
  console.log(`   - Listings:   ${stats.listings.inserted} inserted, ${stats.listings.skipped} skipped (already exist)`);
  console.log(`   - Bookings:   ${stats.bookings.inserted} inserted, ${stats.bookings.skipped} skipped (already exist)`);
  console.log(`   - Enquiries:  ${stats.enquiries.inserted} inserted, ${stats.enquiries.skipped} skipped (already exist)`);
  console.log(`   - Admin Logs: ${stats.admin_logs.inserted} inserted, ${stats.admin_logs.skipped} skipped (already exist)`);
  console.log(`   - OTP Store:  ${stats.otp_store.inserted} inserted, ${stats.otp_store.skipped} skipped (already exist)`);
  console.log(`   - OTP Logs:   ${stats.otp_logs.inserted} inserted, ${stats.otp_logs.skipped} skipped (already exist)`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error during seeding:', err);
  mongoose.disconnect();
  process.exit(1);
});
