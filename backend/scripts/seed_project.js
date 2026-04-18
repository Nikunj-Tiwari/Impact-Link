require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Location = require('../models/Location');
const Event = require('../models/Event');
const Volunteer = require('../models/Volunteer');
const Beneficiary = require('../models/Beneficiary');
const Supply = require('../models/Supply');

async function seedCustomProject() {
  try {
    const args = process.argv.slice(2);
    const projectName = args.join(' ');

    if (!projectName) {
      console.error('❌ Error: Please provide a project name.');
      console.log('Usage: node seed_custom_project.js "Your Project Name"');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Find the parent project
    const project = await Project.findOne({ name: projectName });
    
    if (!project) {
      console.error(`❌ Error: Project "${projectName}" not found.`);
      console.log('Have you created it in the ImpactLink dashboard yet?');
      process.exit(1);
    }

    console.log(`🚀 Found Project: ${project.name} (${project._id})`);
    
    // We wipe existing dummy data FOR THIS PROJECT ONLY to prevent duplicate bloat during multiple tests.
    // Notice how we scope wiping precisely to project._id
    await Event.deleteMany({ projectId: project._id });
    await Beneficiary.deleteMany({ projectId: project._id });
    // Volunteers are an array, so we must safely pull or delete
    await Volunteer.deleteMany({ projectIds: project._id }); 
    await Supply.deleteMany({ projectId: project._id });
    
    console.log(`🧹 Cleared any previous test data scoped specifically to ${project.name}.`);

    // 2. We need some Locations! We'll just create a few random ones near central India / generic spots,
    // or if the user is testing local maps, let's create a cluster in Mumbai/Pune as a sample.
    const loc1 = await Location.create({ 
      name: `Camp Alpha (${project.name})`, type: 'Sector', lat: 18.5204, lng: 73.8567
    });
    const loc2 = await Location.create({ 
      name: `Medical Hub (${project.name})`, type: 'Ward', lat: 18.5314, lng: 73.8446
    });

    // 3. Procedurally generate ~220 Events with varying spatial densities
    const baseLat = 18.5204 + (Math.random() - 0.5) * 0.1; // Shift epicenter slightly each run
    const baseLng = 73.8567 + (Math.random() - 0.5) * 0.1;

    const eventTypes = ['Food Shortage', 'Medical Crisis', 'Infrastructure Damage', 'Water Supply', 'Evacuation Alert'];
    const generatedEvents = [];

    // Helper to generate events
    const generateCluster = (count, radius, densityName) => {
      for (let i = 0; i < count; i++) {
        // Random offset based on radius
        const latOffset = (Math.random() - 0.5) * radius * 2;
        const lngOffset = (Math.random() - 0.5) * radius * 2;
        
        generatedEvents.push({
          projectId: project._id,
          locationId: Math.random() > 0.5 ? loc1._id : loc2._id,
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          severity: Math.floor(Math.random() * 10) + 1,
          resourceGap: Math.floor(Math.random() * 10) + 1,
          frequency: Math.floor(Math.random() * 10) + 1,
          timeSensitivity: Math.floor(Math.random() * 10) + 1,
          lat: baseLat + latOffset,
          lng: baseLng + lngOffset,
          notes: `Simulated Incident - ${densityName} area.`
        });
      }
    };

    // High Density Cluster (120 cases in a very tight 0.04 coordinate radius)
    generateCluster(120, 0.04, "High Density");
    // Medium Density Area (60 cases in a 0.15 radius)
    generateCluster(60, 0.15, "Medium Density");
    // Scattered / Low Density (40 cases spread across a wide 0.5 radius)
    generateCluster(40, 0.5, "Low Density Outliers");

    await Event.insertMany(generatedEvents);
    console.log(`🗺️ Procedurally mapped ${generatedEvents.length} incidents into dynamically generated spatial clusters.`);

    // 4. Create Volunteers scoped to project
    await Volunteer.create([
      { projectIds: [project._id], name: 'Amit Desai', status: 'Deployed', locationId: loc1._id, contactPhone: '+91 9999999991', skills: ['Logistics', 'Crowd Control'] },
      { projectIds: [project._id], name: 'Dr. Sneha Patil', status: 'Active', locationId: loc2._id, contactPhone: '+91 9999999992', skills: ['Medical', 'Emergency Response'] }
    ]);

    // 5. Create Beneficiaries scoped to project
    await Beneficiary.create([
      { 
        projectId: project._id, 
        locationId: loc1._id, 
        firstName: 'Amit', 
        lastName: 'Patel', 
        age: 42, 
        gender: 'M', 
        aadharMasked: '5566',
        consentRecord: true 
      },
      { 
        projectId: project._id, 
        locationId: loc2._id, 
        firstName: 'Sita', 
        lastName: 'Devi', 
        age: 38, 
        gender: 'F', 
        aadharMasked: '1122',
        consentRecord: true 
      }
    ]);

    // 6. Create initial supplies based on schema (fallback if project lacks one)
    if (project.supplySchema && project.supplySchema.length > 0) {
      const suppliesToCreate = project.supplySchema.map(schema => ({
        projectId: project._id,
        type: schema.type,
        quantity: Math.floor(Math.random() * 500) + 50,
        location: 'Base Camp'
      }));
      await Supply.create(suppliesToCreate);
      console.log(`📦 Seeded project-specific supplies derived from ${project.name}'s custom schema.`);
    }

    console.log(`🎉 Successfully seeded test data exclusively into project environment: [${project.name}]!`);
    console.log('You can now switch to this project in the dashboard and see the isolated data flow.');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedCustomProject();
