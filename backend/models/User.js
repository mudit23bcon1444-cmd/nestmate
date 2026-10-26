const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['student', 'owner', 'admin'], default: 'student' },
  phone: { type: String, unique: true, sparse: true },
  is_active: { type: Boolean, default: true },
  email_verified: { type: Boolean, default: false },
  password_changed_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('User', userSchema);
