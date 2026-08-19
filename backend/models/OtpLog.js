const mongoose = require('mongoose');

const otpLogSchema = new mongoose.Schema({
  phone: { type: String },
  action: { type: String, enum: ['sent', 'failed', 'locked', 'verified'] },
  ip_address: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

otpLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('OtpLog', otpLogSchema);
