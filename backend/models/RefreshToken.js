const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jti: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  revoked_at: { type: Date, default: null },
  replaced_by: { type: String, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
