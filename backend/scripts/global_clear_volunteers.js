require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Volunteer = require('../models/Volunteer');

async function clearGlobalVolunteers() {
  try {
    const args = process.argv.slice(2);
    const force = args.includes('--force');

    if (!force) {
      console.log('⚠️ WARNING: This will permanently delete ALL volunteers from the global database.');
      console.log('To confirm, run: node global_clear_volunteers.js --force');
      process.exit(0);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('🧹 Wiping Global Volunteer Registry...');
    const result = await Volunteer.deleteMany({});

    console.log(`\n🎉 Successfully deleted ${result.deletedCount} volunteers. The registry is now empty.`);
  } catch (error) {
    console.error('❌ Clearance failed:', error);
  } finally {
    process.exit(0);
  }
}

clearGlobalVolunteers();
