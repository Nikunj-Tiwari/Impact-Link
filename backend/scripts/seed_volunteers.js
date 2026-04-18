const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Volunteer = require('../models/Volunteer');
const Location = require('../models/Location');

dotenv.config({ path: path.join(__dirname, '../.env') });

const NAMES = [
  'Rahul Sharma', 'Siddharth Iyer', 'Priyanka Nair', 'Amit Patel', 'Sneha Gupta',
  'Vikram Singh', 'Anjali Verma', 'Karan Malhotra', 'Deepa Reddy', 'Arjun Kapoor',
  'Meera Joshi', 'Rohan Das', 'Ishani Chatterjee', 'Vivek Menon', 'Sanya Agarwal'
];

const SKILLS = [
  'First Aid', 'Search & Rescue', 'Logistics', 'Medical (Doctor)', 'Technical Support',
  'Language Translation', 'Counseling', 'Driving (Heavy Vehicles)', 'Water Sanitation'
];

const HUBS = [
  { name: 'Delhi NCR Hub', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai Slum Response', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore Tech Logistics', lat: 12.9716, lng: 77.5946 },
  { name: 'Wayanad Relief Center', lat: 11.6050, lng: 76.0828 },
  { name: 'Guwahati Flood Response', lat: 26.1445, lng: 91.7362 }
];

async function seedVolunteers() {
  try {
    if (!process.env.MONGODB_URI) {
       console.error('Error: MONGODB_URI not found in env');
       process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB. Seeding volunteers...');

    // 1. Clear existing volunteers
    await Volunteer.deleteMany({});
    console.log('Cleared existing volunteers.');

    // 2. Ensure we have locations to link to
    const locationRecords = [];
    for (const hub of HUBS) {
      let loc = await Location.findOne({ name: hub.name });
      if (!loc) {
        loc = await Location.create(hub);
        console.log(`Created new location: ${hub.name}`);
      }
      locationRecords.push(loc);
    }

    const volunteerRecords = [];
    
    // 3. Generate 50 volunteers
    for (let i = 0; i < 50; i++) {
      const randomLoc = locationRecords[Math.floor(Math.random() * locationRecords.length)];
      const name = NAMES[Math.floor(Math.random() * NAMES.length)] + ' ' + (i + 1);
      
      // Randomly pick 1-3 skills
      const numSkills = Math.floor(Math.random() * 3) + 1;
      const shuffledSkills = [...SKILLS].sort(() => 0.5 - Math.random());
      const selectedSkills = shuffledSkills.slice(0, numSkills);

      volunteerRecords.push({
        name,
        status: ['Active', 'Deployed', 'Inactive'][Math.floor(Math.random() * 3 * 0.8)], // Bias towards Active/Deployed
        locationId: randomLoc._id,
        skills: selectedSkills,
        contactPhone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    await Volunteer.insertMany(volunteerRecords);
    console.log(`Successfully seeded ${volunteerRecords.length} volunteers across ${locationRecords.length} locations.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedVolunteers();
