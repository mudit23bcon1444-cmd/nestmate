// scripts/migrate_images_array.js — Populates images array from existing image_path
require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nestmate';

async function migrateImages() {
  console.log('🖼️ Connecting to MongoDB for images array migration...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.');

  const listings = await Listing.find({
    image_path: { $ne: null, $exists: true }
  });

  console.log(`📸 Found ${listings.length} listings with image_path.`);
  let updatedCount = 0;

  for (const listing of listings) {
    if (!listing.images || listing.images.length === 0) {
      listing.images = [listing.image_path];
      await listing.save();
      updatedCount++;
    }
  }

  console.log(`✅ Successfully backfilled images array for ${updatedCount} listings.`);
  await mongoose.disconnect();
}

migrateImages().catch(err => {
  console.error('❌ Images migration failed:', err);
  process.exit(1);
});
