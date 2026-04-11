const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', default: null }, // Nullable for general area events
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  eventType: { type: String, default: 'General' }, // e.g. "Health Check", "Relief Delivery", "Utility Failure"
  severity: { type: Number, required: true, min: 1, max: 10 },
  resourceGap: { type: Number, required: true, min: 1, max: 10 },
  frequency: { type: Number, required: true, min: 1, max: 10 },
  timeSensitivity: { type: Number, required: true, min: 1, max: 10 },
  eventTime: { type: Date, default: Date.now },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  notes: { type: String }
});

// Spatial index for clustering and radius searches
eventSchema.index({ lat: 1, lng: 1 });
eventSchema.index({ eventTime: -1 });

module.exports = mongoose.model('Event', eventSchema);
