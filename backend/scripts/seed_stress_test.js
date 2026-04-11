const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Event = require('../models/Event');
const Location = require('../models/Location');
const Beneficiary = require('../models/Beneficiary');

dotenv.config({ path: path.join(__dirname, '../.env') });

const FIRST_NAMES = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Ishaan', 'Ananya', 'Diya', 'Saanvi', 'Myra', 'Krishna', 'Abhimanyu', 'Rudra', 'Isha', 'Riya'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Reddy', 'Patel', 'Singh', 'Khan', 'Iyer', 'Chatterjee', 'Nair'];

const EPICENTERS = [
  { name: 'Indore Central', lat: 22.7196, lng: 75.8577, bias: 'none', count: 200 },
  { name: 'Delhi Cluster 1', lat: 28.6600, lng: 77.2300, bias: 'none', count: 180 },
  { name: 'New Delhi Corridor', lat: 28.5800, lng: 77.1800, bias: 'none', count: 180 },
  { name: 'Mumbai Coast', lat: 19.0760, lng: 72.8777, bias: 'east', count: 120 },
  { name: 'Hyderabad Heights', lat: 17.3850, lng: 78.4867, bias: 'none', count: 120 }
];

async function seedStressTest() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Targeted Hub Seeding...');

    // Clear existing data for strict targeted demo
    await Event.deleteMany({});
    await Beneficiary.deleteMany({});
    await Location.deleteMany({});
    console.log('Cleared existing events, beneficiaries, and locations.');

    const eventRecords = [];
    const beneficiaryRecords = [];

    // Helper to generate a random beneficiary object
    const generateBeneficiary = (locId) => ({
      _id: new mongoose.Types.ObjectId(),
      firstName: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
      lastName: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)],
      age: Math.floor(Math.random() * 60) + 18,
      gender: ['M', 'F', 'O'][Math.floor(Math.random() * 3)],
      contactPhone: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      aadharMasked: Math.floor(Math.random() * 9000 + 1000).toString(),
      locationId: locId,
      consentRecord: true,
      registeredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });

    // Generate Targeted Clustered Data
    for (const epi of EPICENTERS) {
      // Create a specific Location for this hub
      const hubLoc = await Location.create({
        name: `${epi.name} Command Hub`,
        type: 'Sector',
        lat: epi.lat,
        lng: epi.lng
      });

      console.log(`Generating ${epi.count} cases for ${epi.name}...`);

      for (let i = 0; i < epi.count; i++) {
        const beneficiary = generateBeneficiary(hubLoc._id);
        beneficiaryRecords.push(beneficiary);

        // Calculate spread with inland bias
        let latOff = (Math.random() - 0.5) * 0.7; // Tighter spread for better density visualization
        let lngOff = (Math.random() - 0.5) * 0.7;

        if (epi.bias === 'east') lngOff = Math.random() * 0.6; 
        if (epi.bias === 'west') lngOff = -Math.random() * 0.6;

        eventRecords.push({
          beneficiaryId: beneficiary._id,
          locationId: hubLoc._id,
          eventType: ['Medical Shortage', 'Food Insecurity', 'Water Crisis', 'Infrastructure Damage'][Math.floor(Math.random() * 4)],
          severity: Math.floor(Math.random() * 6) + 4, // 4-10
          resourceGap: Math.floor(Math.random() * 10) + 1,
          frequency: Math.floor(Math.random() * 10) + 1,
          timeSensitivity: Math.floor(Math.random() * 10) + 1,
          lat: epi.lat + latOff,
          lng: epi.lng + lngOff,
          eventTime: beneficiary.registeredAt
        });
      }
    }

    // Insert to DB
    await Beneficiary.insertMany(beneficiaryRecords);
    await Event.insertMany(eventRecords);
    
    console.log(`Success: Seeded ${eventRecords.length} Targeted Cases across ${EPICENTERS.length} Densities.`);
    console.log('Focal Points: Indore, Delhi (Double Cluster), Mumbai, Hyderabad.');
    process.exit(0);
  } catch (error) {
    console.error('Targeted seeding failed:', error);
    process.exit(1);
  }
}

seedStressTest();
