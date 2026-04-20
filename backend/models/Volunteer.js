const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }], // Can span multiple campaigns
  name: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Deployed', 'Inactive'], default: 'Active' },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  skills: [{ type: String }],
  contactPhone: { type: String, required: true },
  lastActive: { type: Date, default: Date.now },
  currentAssignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  
  // Tactical Performance Metrics
  performanceScore: { type: Number, default: 85 }, // 0-100%
  missionsCompleted: { type: Number, default: 0 },
  completionRate: { type: Number, default: 100 }, // % of missions finished
  noShowCount: { type: Number, default: 0 },
  experienceLevel: { 
    type: String, 
    enum: ['Junior', 'Mid-Level', 'Senior', 'Elite'], 
    default: 'Mid-Level' 
  },

  // Mobility & Location
  travelRadius: { type: Number, default: 50 }, // km
  
  // Availability
  availability: {
    days: [{ type: String }], // ['Mon', 'Tue', etc]
    timeSlots: [{ type: String }], // ['Morning', 'Afternoon', 'Night']
    projectDuration: { type: String, enum: ['Short-term', 'Medium-term', 'Long-term'], default: 'Short-term' }
  },

  // Logistics
  logistics: {
    vehicle: { type: String, enum: ['None', 'Bike', 'Car', 'Truck'], default: 'None' },
    supplyCapacity: { type: Number, default: 0 } // kg
  }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
