const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jti: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  revoked_at: { type: Date, default: null },
  replaced_by: { type: String, default: null },
  user_agent: { type: String, default: null },
  ip: { type: String, default: null },
  last_used_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user_id: 1, revoked_at: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
