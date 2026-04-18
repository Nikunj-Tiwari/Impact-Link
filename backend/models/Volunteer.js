const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }], // Can span multiple campaigns
  name: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Deployed', 'Inactive'], default: 'Active' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  skills: [{ type: String }],
  contactPhone: { type: String, required: true },
  lastActive: { type: Date, default: Date.now },
  currentAssignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
