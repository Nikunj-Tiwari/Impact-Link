require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const Beneficiary = require('../models/Beneficiary');
const Supply = require('../models/Supply');

async function clearProjectData() {
  try {
    const args = process.argv.slice(2);
    const projectName = args.join(' ');

    if (!projectName) {
      console.error('❌ Error: Please provide a project name.');
      console.log('Usage: node clear_project.js "Your Project Name"');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Find the parent project
    const project = await Project.findOne({ name: projectName });
    
    if (!project) {
      console.error(`❌ Error: Project "${projectName}" not found.`);
      process.exit(1);
    }

    console.log(`🧹 Clearing all mission data for: [${project.name}] (${project._id})`);

    // 2. Perform Cascading Delete for this Project ID only
    const results = await Promise.all([
      Event.deleteMany({ projectId: project._id }),
      Beneficiary.deleteMany({ projectId: project._id }),
      // IMPORTANT: We UNLINK volunteers, we don't DELETE them.
      // This preserves the "Single Source of Truth" global registry.
      Volunteer.updateMany(
        { projectIds: project._id },
        { $pull: { projectIds: project._id } }
      ),
      Supply.deleteMany({ projectId: project._id })
    ]);

    console.log(`✅ Incidents Cleared: ${results[0].deletedCount}`);
    console.log(`✅ Beneficiaries Cleared: ${results[1].deletedCount}`);
    console.log(`✅ Volunteers Unlinked from Mission: ${results[2].modifiedCount}`);
    console.log(`✅ Supplies Cleared: ${results[3].deletedCount}`);

    console.log(`\n🎉 Project environment "${project.name}" is now clean.`);

  } catch (error) {
    console.error('❌ Clearance failed:', error);
  } finally {
    process.exit(0);
  }
}

clearProjectData();
