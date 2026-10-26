const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true }, // HMAC-SHA256 hex digest
  expires_at: { type: Date, required: true },
  last_sent_at: { type: Date },
  attempt_count: { type: Number, default: 0 },
  locked_until: { type: Date, default: null },
  daily_count: { type: Number, default: 0 },
  daily_reset_at: { type: Date }
});

otpStoreSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpStore', otpStoreSchema);
