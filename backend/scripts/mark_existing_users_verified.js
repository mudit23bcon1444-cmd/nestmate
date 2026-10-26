// scripts/mark_existing_users_verified.js — Backfill email_verified for existing and seed users
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/nestmate';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  const result = await User.updateMany(
    { email_verified: { $ne: true } },
    { $set: { email_verified: true } }
  );

  console.log(`Updated ${result.modifiedCount} users to email_verified: true.`);
  await mongoose.disconnect();
  console.log('Done.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = run;
