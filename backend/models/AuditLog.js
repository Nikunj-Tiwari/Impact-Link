const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: true }, // Firebase UID
  userEmail: { type: String },
  action: { type: String, required: true }, // e.g., "VIEW_PII", "EXPORT_DATA"
  resource: { type: String, required: true }, // e.g., "BeneficiaryRecords"
  targetId: { type: String }, // ID of the accessed record
  ipAddress: { type: String }
});

// Index for rapid compliance reporting
auditLogSchema.index({ timestamp: -1, action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
