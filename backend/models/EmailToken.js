const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['verify', 'reset'], required: true },
  token_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// TTL index to automatically remove expired tokens from MongoDB
emailTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
emailTokenSchema.index({ user_id: 1, type: 1 });
emailTokenSchema.index({ token_hash: 1 });

module.exports = mongoose.model('EmailToken', emailTokenSchema);
