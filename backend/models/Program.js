const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
  programId:    { type: String, required: true, unique: true }, // e.g., "PMRPY-2026"
  name:         { type: String, required: true },
  description:  { type: String },
  orgId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  
  // Criteria for AI Prioritization
  targetGroups: { type: [String] }, // e.g., ["Widows", "BPL Families", "Migrant Labor"]
  priorityFactors: {
    incomeMax:     { type: Number },
    familySizeMin: { type: Number },
    needs:         { type: [String] }
  },
  
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Program', ProgramSchema);
