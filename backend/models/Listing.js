const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  description: { type: String },
  amenities: { type: [String], default: [] },
  image_path: { type: String, default: null },
  is_approved: { type: Number, default: 0, enum: [0, 1, 2] },
  is_available: { type: Number, default: 1, enum: [0, 1] }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

listingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Listing', listingSchema);
