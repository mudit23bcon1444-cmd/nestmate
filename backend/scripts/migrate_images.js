// scripts/migrate_images.js — Migrates local /uploads files to Cloudinary
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nestmate';

async function migrateToCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('⚠️ Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) not fully configured.');
    console.log('ℹ️ Once Cloudinary credentials are provided in .env, run this script to migrate local files.');
    return;
  }

  let cloudinary;
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
  } catch (err) {
    console.error('❌ Cloudinary SDK not installed. Run `npm install cloudinary` in backend/.');
    return;
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const uploadsDir = path.join(__dirname, '../uploads');
  const listings = await Listing.find({
    image_path: { $regex: '^uploads/' }
  });

  console.log(`🚀 Found ${listings.length} listings with local image paths to migrate to Cloudinary.`);

  for (const listing of listings) {
    const localFilePath = path.join(__dirname, '..', listing.image_path);
    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️ File not found locally: ${localFilePath}`);
      continue;
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(localFilePath, {
        folder: 'nestmate/listings'
      });
      const secureUrl = uploadResult.secure_url;

      listing.image_path = secureUrl;
      listing.images = [secureUrl];
      await listing.save();
      console.log(`✅ Migrated listing #${listing._id} -> ${secureUrl}`);
    } catch (uploadErr) {
      console.error(`❌ Failed to upload ${localFilePath}:`, uploadErr.message);
    }
  }

  console.log('🎉 Cloudinary migration run complete.');
  await mongoose.disconnect();
}

migrateToCloudinary().catch(err => {
  console.error('❌ Migration process encountered error:', err);
  process.exit(1);
});
