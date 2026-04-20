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
      console.log('Usage: node seed_project.js "Your Project Name"');
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

    if (!project.regions || project.regions.length === 0) {
      console.error(`❌ Error: Project "${projectName}" has no operational regions defined.`);
      console.log('Please define at least one region in the Geographical Intelligence stage of the Project Wizard.');
      process.exit(1);
    }

    console.log(`🚀 Found Project: ${project.name} (${project._id})`);
    console.log(`📍 Operating across ${project.regions.length} regional zones.`);
    
    // Wipe existing dummy data FOR THIS PROJECT ONLY
    await Event.deleteMany({ projectId: project._id });
    await Beneficiary.deleteMany({ projectId: project._id });
    await Supply.deleteMany({ projectId: project._id });
    
    // We UNLINK volunteers from this project instead of deleting them, 
    // to preserve the "Single Source of Truth" global registry.
    await Volunteer.updateMany(
      { projectIds: project._id },
      { $pull: { projectIds: project._id } }
    );
    
    console.log(`🧹 Mission data cleared for ${project.name}. Global Volunteer Pool preserved.`);

    const KM_TO_DEG = 0.009; 
    const eventTypes = ['Food Shortage', 'Medical Crisis', 'Infrastructure Damage', 'Water Supply', 'Evacuation Alert'];
    const generatedEvents = [];
    const regionalLocations = [];

    // 2. Generate Data per Region
    for (const region of project.regions) {
      console.log(`🏗️ Processing Region: ${region.name || 'Untitled Area'}`);
      
      const loc = await Location.create({ 
        name: `${region.name || 'Zone'} - Base Hub`, 
        type: 'District', 
        lat: region.center.lat, 
        lng: region.center.lng 
      });
      regionalLocations.push(loc);

      // Generate incidents
      const incidentCount = Math.floor(Math.random() * 50) + 30;
      for (let i = 0; i < incidentCount; i++) {
        const latOffset = (Math.random() - 0.5) * (region.radius * 2 * KM_TO_DEG);
        const lngOffset = (Math.random() - 0.5) * (region.radius * 2 * KM_TO_DEG);
        
        generatedEvents.push({
          projectId: project._id,
          locationId: loc._id,
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          severity: Math.floor(Math.random() * 10) + 1,
          resourceGap: Math.floor(Math.random() * 10) + 1,
          frequency: Math.floor(Math.random() * 10) + 1,
          timeSensitivity: Math.floor(Math.random() * 10) + 1,
          lat: region.center.lat + latOffset,
          lng: region.center.lng + lngOffset,
          notes: `Simulated Incident - ${region.name} zone.`
        });
      }

      // Link existing volunteers from the Global Pool to this project
      // We pick a few volunteers who are "Active" and not currently overloaded
      const potentialResponders = await Volunteer.find({ status: 'Active' }).limit(5);
      if (potentialResponders.length > 0) {
        await Volunteer.updateMany(
          { _id: { $in: potentialResponders.map(v => v._id) } },
          { $addToSet: { projectIds: project._id } }
        );
        console.log(`🔗 Linked ${potentialResponders.length} elite responders from the Global Pool to ${region.name}.`);
      } else {
        // Fallback: Create new global volunteers if the registry is thin
        await Volunteer.create({ 
          projectIds: [project._id], 
          name: `New Recruit (${region.name || 'Zone'})`, 
          status: 'Active', 
          locationId: loc._id, 
          contactPhone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`, 
          skills: ['General Response'] 
        });
      }

      // Create region-specific beneficiaries
      await Beneficiary.create({ 
        projectId: project._id, 
        locationId: loc._id, 
        firstName: 'Regional', 
        lastName: 'Resident', 
        age: Math.floor(Math.random() * 50) + 18, 
        gender: Math.random() > 0.5 ? 'M' : 'F', 
        aadharMasked: Math.floor(1000 + Math.random() * 9000).toString(),
        consentRecord: true 
      });
    }

    await Event.insertMany(generatedEvents);
    console.log(`🎮 Mission Space established with ${generatedEvents.length} incidents.`);

    // 3. Create initial supplies based on hierarchical schema
    if (project.hierarchicalSupplies && project.hierarchicalSupplies.length > 0) {
      const suppliesToCreate = [];
      project.hierarchicalSupplies.forEach(cat => {
        cat.items.forEach(item => {
          suppliesToCreate.push({
            projectId: project._id,
            type: `${cat.category}: ${item.type}`,
            quantity: Math.floor(item.targetQuantity * 0.4), // Start with 40% stock
            location: 'Central Logistics'
          });
        });
      });
      
      if (suppliesToCreate.length > 0) {
        await Supply.insertMany(suppliesToCreate);
        console.log(`📦 Seeded ${suppliesToCreate.length} supply records derived from project's hierarchical architecture.`);
      }
    }

    console.log(`🎉 Project "${project.name}" has been successfully calibrated and synchronized with live test data.`);
    console.log('You can now verify the spatial clustering on the Mission Dashboard.');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedCustomProject();
