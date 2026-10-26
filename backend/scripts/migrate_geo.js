// scripts/migrate_geo.js — Backfills GeoJSON Point location_geo from existing latitude & longitude
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nestmate';

async function migrateGeo() {
  console.log('🌍 Connecting to MongoDB for GeoJSON migration...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  const listings = await Listing.find({
    latitude: { $ne: null, $exists: true },
    longitude: { $ne: null, $exists: true }
  });

  console.log(`📍 Found ${listings.length} listings with coordinates. Converting to GeoJSON Points...`);
  let updatedCount = 0;

  for (const listing of listings) {
    const lat = Number(listing.latitude);
    const lng = Number(listing.longitude);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      listing.location_geo = {
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
      };
      await listing.save();
      updatedCount++;
    } else {
      console.warn(`⚠️ Skipping listing #${listing._id} due to out-of-range coordinates: [lat: ${lat}, lng: ${lng}]`);
    }
  }

  console.log(`✅ Successfully migrated ${updatedCount}/${listings.length} listings to GeoJSON Points.`);
  await mongoose.disconnect();
}

migrateGeo().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
