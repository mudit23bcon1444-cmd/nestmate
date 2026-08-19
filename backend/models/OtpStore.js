const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expires_at: { type: Number, required: true },
  last_sent_at: { type: Number },
  attempt_count: { type: Number, default: 0 },
  locked_until: { type: Number, default: 0 }
});

module.exports = mongoose.model('OtpStore', otpStoreSchema);
