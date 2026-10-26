const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  description: { type: String },
  amenities: { type: [String], default: [] },
  room_type: { type: String, enum: ['single', 'shared', 'studio', 'apartment'], default: 'single' },
  image_path: { type: String, default: null },
  images: { type: [String], default: [] },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  location_geo: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  verification_notes: { type: String, default: null },
  verified_at: { type: Date, default: null },
  is_approved: { type: Number, default: 0, enum: [0, 1, 2] },
  is_available: { type: Number, default: 1, enum: [0, 1] }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

listingSchema.index({ location_geo: '2dsphere' }, { sparse: true });

listingSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Listing', listingSchema);
