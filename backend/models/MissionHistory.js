const mongoose = require('mongoose');

const MissionHistorySchema = new mongoose.Schema({
  volunteerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true, index: true },
  missionId:     { type: mongoose.Schema.Types.ObjectId, ref: 'StrategicMission' },
  allocationId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceAllocation' },
  projectId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  missionName:   { type: String },
  resourceType:  { type: String },
  unitsCarried:  { type: Number },
  status:        { type: String, enum: ['completed', 'recalled', 'incomplete'] },
  startedAt:     { type: Date },
  completedAt:   { type: Date },
  durationMinutes: { type: Number },
  ratingGiven:   { type: Number, min: 1, max: 5 },
  adminNotes:    { type: String },
}, { timestamps: true });

module.exports = mongoose.model('MissionHistory', MissionHistorySchema);
