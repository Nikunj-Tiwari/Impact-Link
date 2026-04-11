const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const AuditLog = require('../models/AuditLog');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Cleanup...');

    const resEvents = await Event.deleteMany({});
    const resVols = await Volunteer.deleteMany({});
    const resLogs = await AuditLog.deleteMany({});

    console.log(`Successfully cleared ${resEvents.deletedCount} Incidents, ${resVols.deletedCount} Responders, and ${resLogs.deletedCount} Audit Logs.`);
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

clearData();
