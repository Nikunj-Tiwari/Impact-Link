const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null }, // Nullable for global/legacy events
  firstName: { type: String, required: true }, // Encrypted at rest (logic handled in service)
  lastName: { type: String, required: true },
  age: { type: Number, required: true, min: 0, max: 120 },
  gender: { type: String, enum: ['M', 'F', 'O'], required: true },
  contactPhone: { type: String }, // Encrypted at rest
  aadharMasked: { type: String, required: true, length: 4 }, // Only last 4 digits
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  registeredAt: { type: Date, default: Date.now },
  consentRecord: { type: Boolean, default: false } // Tracking informed consent
});

// Index for geocoding lookup
beneficiarySchema.index({ locationId: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
