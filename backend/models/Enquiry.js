const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  student_name: { type: String, required: true, trim: true },
  student_phone: { type: String, required: true, trim: true },
  message: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

enquirySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('Enquiry', enquirySchema);
