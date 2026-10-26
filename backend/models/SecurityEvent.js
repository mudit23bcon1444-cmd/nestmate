const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'login_success',
      'login_failed',
      'password_changed',
      'password_reset_requested',
      'email_verified',
      'session_revoked',
      'logout_all'
    ],
    required: true
  },
  ip: { type: String, default: null },
  user_agent: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// TTL index: 180 days (180 * 24 * 60 * 60 = 15552000 seconds)
securityEventSchema.index({ created_at: 1 }, { expireAfterSeconds: 15552000 });
securityEventSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);
