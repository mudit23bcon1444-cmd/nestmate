const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  done_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

adminLogSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

module.exports = mongoose.model('AdminLog', adminLogSchema);
