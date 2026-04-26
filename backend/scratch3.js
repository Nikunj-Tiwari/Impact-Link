require('dotenv').config();
const mongoose = require('mongoose');
const Volunteer = require('./models/Volunteer');

async function updateVolunteers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const volunteers = await Volunteer.find({ email: { $exists: false } });
  console.log(`Found ${volunteers.length} volunteers without emails.`);
  
  for (const v of volunteers) {
    const email = v.name.toLowerCase().replace(/ /g, '.') + '@impactlink.dev';
    v.email = email;
    // Bypass validation because existing data might have legacy capitalized skills
    await v.save({ validateBeforeSave: false });
    console.log(`Updated ${v.name} with email ${email}`);
  }
  
  process.exit(0);
}

updateVolunteers();
