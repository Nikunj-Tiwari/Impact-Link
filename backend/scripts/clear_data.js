const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const AuditLog = require('../models/AuditLog');
const Beneficiary = require('../models/Beneficiary');
const Location = require('../models/Location');
const Project = require('../models/Project');
const Supply = require('../models/Supply');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function clearData() {
  try {
    const args = process.argv.slice(2);
    const projectName = args.join(' ');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB for Cleanup...');

    let filter = {};
    let volFilter = {};

    if (projectName) {
      const project = await Project.findOne({ name: projectName });
      if (!project) {
        console.error(`❌ Error: Project "${projectName}" not found. No data cleared.`);
        process.exit(1);
      }
      console.log(`🧹 Scoping cleanup to Project: ${project.name} (${project._id})`);
      filter = { projectId: project._id };
      volFilter = { projectIds: project._id };
    } else {
      console.warn('⚠️ No project name provided. Wiping ENTIRE database (Incidents, Responders, Beneficiaries, etc.)...');
    }

    const resEvents = await Event.deleteMany(filter);
    const resBenes = await Beneficiary.deleteMany(filter);
    const resSupplies = await Supply.deleteMany(filter);
    const resVols = await Volunteer.deleteMany(volFilter);
    const resLogs = await AuditLog.deleteMany({}); // Audit logs are usually global
    
    // We only clear Locations if it's a full wipe, as locations might be shared between projects
    let resLocs = { deletedCount: 0 };
    if (!projectName) {
      resLocs = await Location.deleteMany({});
    }

    console.log(`✅ Successfully cleared:
    - ${resEvents.deletedCount} Incidents
    - ${resBenes.deletedCount} Beneficiaries
    - ${resSupplies.deletedCount} Supply Records
    - ${resVols.deletedCount} Responders
    - ${resLocs.deletedCount} Global Locations`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

clearData();
