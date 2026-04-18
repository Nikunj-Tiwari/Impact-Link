const mongoose = require('mongoose');

const supplySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, required: true }, // Should match one of the types in Project's supplySchema
  quantity: { type: Number, required: true, default: 0 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', default: null }, // If null, it's just stockpiled in the project
  location: { type: String, default: 'Warehouse' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Supply', supplySchema);
