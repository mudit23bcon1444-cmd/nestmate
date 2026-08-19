// scripts/migrateAmenities.js — One-time data migration script to convert String amenities to Array of Strings [String]
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

// Use current mongoose connection or model schema
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/nestmate';

async function migrateAmenities() {
  console.log('🌱 Connecting to MongoDB for amenities migration...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  // Access the raw collection directly or via Mongoose model to catch string values regardless of schema type
  const collection = mongoose.connection.db.collection('listings');
  const allListings = await collection.find({}).toArray();

  let checked = allListings.length;
  let converted = 0;
  let alreadyArray = 0;
  let emptyOrMissing = 0;

  for (const doc of allListings) {
    const rawVal = doc.amenities;

    if (Array.isArray(rawVal)) {
      alreadyArray++;
      continue;
    }

    if (typeof rawVal === 'string') {
      if (!rawVal.trim()) {
        emptyOrMissing++;
        // Normalize empty string to empty array []
        await collection.updateOne(
          { _id: doc._id },
          { $set: { amenities: [] } }
        );
        converted++;
      } else {
        const arr = rawVal.split(',').map(a => a.trim()).filter(Boolean);
        await collection.updateOne(
          { _id: doc._id },
          { $set: { amenities: arr } }
        );
        converted++;
      }
    } else if (rawVal === null || rawVal === undefined) {
      emptyOrMissing++;
      await collection.updateOne(
        { _id: doc._id },
        { $set: { amenities: [] } }
      );
      converted++;
    }
  }

  console.log('\n======================================================');
  console.log('🎉 Amenities Migration Complete!');
  console.log(`   - Listings checked:                 ${checked}`);
  console.log(`   - Converted from string to array:  ${converted}`);
  console.log(`   - Already arrays:                  ${alreadyArray}`);
  console.log(`   - Empty/missing amenities:         ${emptyOrMissing}`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrateAmenities().catch(err => {
  console.error('❌ Error during amenities migration:', err);
  mongoose.disconnect();
  process.exit(1);
});
