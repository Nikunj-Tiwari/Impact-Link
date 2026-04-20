require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Volunteer = require('../models/Volunteer');
const Location = require('../models/Location');
const Project = require('../models/Project');

const NAMES = [
  'Rahul Sharma', 'Priya Singh', 'Amit Patel', 'Sneha Gupta', 'Vikram Mehta',
  'Anjali Verma', 'Karan Johar', 'Deepa Reddy', 'Siddharth Iyer', 'Priyanka Nair',
  'Rohan Mehra', 'Ishani Roy', 'Vivek Das', 'Sanya Mishra', 'Arjun Kapoor',
  'Meera Joshi', 'Sahil Khan', 'Tanya Bhatia', 'Varun Gill', 'Riya Bansal'
];

const SKILLS_POOL = [
  'First Aid', 'Logistics', 'Medical (Doctor)', 'Search & Rescue', 
  'Technical Support', 'Counseling', 'Language Translation', 
  'Driving (Heavy Vehicles)', 'Water Sanitation', 'Community Outreach'
];

const HUBS = [
  { name: 'Delhi NCR Hub', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai Slum Response', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore Tech Logistics', lat: 12.9716, lng: 77.5946 },
  { name: 'Wayanad Relief Center', lat: 11.6050, lng: 76.0828 },
  { name: 'Guwahati Flood Response', lat: 26.1445, lng: 91.7362 }
];

async function feedGlobalVolunteers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    await Volunteer.deleteMany({});
    console.log('🗑️ Cleared existing responders.');

    const globalProject = await Project.findOne({ scope: 'Global' });
    const projectIds = globalProject ? [globalProject._id] : [];

    console.log('🚀 Procedurally Generating GLOBAL Volunteer Force (50 Responders)...');

    const volunteerDocs = [];
    
    // Create Hub Locations if they don't exist
    const locationIds = [];
    for (const hub of HUBS) {
      let loc = await Location.findOne({ name: hub.name });
      if (!loc) {
        loc = await Location.create({ ...hub, type: 'District' });
      }
      locationIds.push(loc._id);
    }

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const SLOTS = ['Morning', 'Afternoon', 'Night'];
    const VEHICLES = ['None', 'Bike', 'Car', 'Truck'];
    const VEHICLE_CAPS = { 'None': 0, 'Bike': 15, 'Car': 150, 'Truck': 1200 };

    for (let i = 0; i < 50; i++) {
      const name = NAMES[i % NAMES.length] + ` ${Math.floor(i / NAMES.length) + 1}`;
      const randomHubId = locationIds[Math.floor(Math.random() * locationIds.length)];
      
      // Select 1-3 random skills
      const numSkills = Math.floor(Math.random() * 3) + 1;
      const skills = [...SKILLS_POOL]
        .sort(() => 0.5 - Math.random())
        .slice(0, numSkills);

      const vehicle = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];

      volunteerDocs.push({
        name,
        status: ['Active', 'Deployed', 'Active'][Math.floor(Math.random() * 3)],
        locationId: randomHubId,
        skills,
        contactPhone: `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`,
        projectIds: projectIds,
        lastActive: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
        
        // Seeding Performance Data
        performanceScore: Math.floor(75 + Math.random() * 24),
        missionsCompleted: Math.floor(Math.random() * 30),
        completionRate: Math.floor(85 + Math.random() * 15),
        noShowCount: Math.floor(Math.random() * Math.random() * 4), // Weighted towards 0
        experienceLevel: ['Junior', 'Mid-Level', 'Senior', 'Elite'][Math.floor(Math.random() * 4)],

        // Mobility
        travelRadius: [20, 50, 100, 250, 500][Math.floor(Math.random() * 5)],

        // Availability
        availability: {
          days: DAYS.filter(() => Math.random() > 0.3),
          timeSlots: SLOTS.filter(() => Math.random() > 0.4),
          projectDuration: ['Short-term', 'Medium-term', 'Long-term'][Math.floor(Math.random() * 3)]
        },

        // Logistics
        logistics: {
          vehicle: vehicle,
          supplyCapacity: VEHICLE_CAPS[vehicle] + Math.floor(Math.random() * 20)
        }
      });
    }

    await Volunteer.insertMany(volunteerDocs);
    console.log(`\n🎉 Successfully commissioned 50 elite responders across ${HUBS.length} national hubs.`);
  } catch (error) {
    console.error('❌ Feeding failed:', error);
  } finally {
    process.exit(0);
  }
}

feedGlobalVolunteers();
