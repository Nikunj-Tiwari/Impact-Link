const mongoose = require('mongoose');
require('dotenv').config();
require('./models/Location');
const Event = require('./models/Event');
const Volunteer = require('./models/Volunteer');
const Project = require('./models/Project');
const { runAllocation } = require('./services/allocationEngine');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const proj = await Project.findOne({ name: 'medicine distribution' }).lean();
    await Event.updateMany({ projectId: proj._id }, {
      $set: { allocationStatus: 'unassigned', saturationRate: 0, resourceGapMet: 0, assignedResponders: [] }
    });
    await Volunteer.updateMany({ projectIds: proj._id }, {
      $set: { assignmentStatus: 'unassigned', currentAssignmentId: null, currentLoad: 0 }
    });
    console.log('Reset complete. Running allocation...');

    const result = await runAllocation(proj._id);
    console.log('Result assignments (Pass 1 - Resident):');
    for (const a of result.assignments) {
      const v = await Volunteer.findById(a.volunteerId).lean();
      console.log('  Pass 1 Vol:', v.name, 'Mission:', a.missionId, 'Score:', a.score);
    }
    console.log('Result dispatches (Pass 2 - Mobile):');
    for (const a of result.dispatches) {
      const v = await Volunteer.findById(a.volunteerId).lean();
      console.log('  Pass 2 Vol:', v.name, 'Mission:', a.missionId, 'Score:', a.allocationScore);
    }
  } catch(e) { console.error(e); } finally { mongoose.disconnect(); }
});
