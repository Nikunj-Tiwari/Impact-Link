const mongoose = require('mongoose');

const ServiceLogSchema = new mongoose.Schema({
  beneficiaryId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: true, index: true },
  volunteerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', index: true },
  projectId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  
  // Delivery Details
  serviceType:       { type: String, required: true }, // e.g., "Ration Distribution", "Medical Checkup"
  quantity:          { type: Number },
  unit:              { type: String },
  deliveryDate:      { type: Date, default: Date.now },
  staffInvolved:     { type: [String] },
  
  // Outcome Tracking
  status:            { type: String, enum: ['delivered', 'partial', 'failed', 'refused'], default: 'delivered' },
  measurableImprovement: { type: String }, // Qualitative or quantitative improvement
  beneficiaryFeedback: { type: String },
  
  // Evidence
  photoProofUrl:     { type: String },
  locationVerified:  { type: Boolean, default: false },
  gpsAtDelivery: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('ServiceLog', ServiceLogSchema);
