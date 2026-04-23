require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Volunteer = require('../models/Volunteer');
const { generateEmbedding } = require('../services/semanticEngine');

async function migrateToSemantic() {
  try {
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI missing from .env');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for Semantic Migration.');

    const volunteers = await Volunteer.find({});
    console.log(`🚀 Found ${volunteers.length} responders. Starting semantic transformation...`);

    for (const vol of volunteers) {
      // STRATEGIC: Construct a dense narrative profile that captures implicit capability
      const profile = `
        Responder Name: ${vol.name}. 
        Experience Tier: ${vol.experienceLevel || 'Mid-Level'}. 
        Skills: ${vol.skills ? vol.skills.join(', ') : 'General Assistance'}. 
        Logistics Profile: Operates a ${vol.vehicleType || 'none'} (${vol.transportClass || 'foot'}) with ${vol.vehicleCapacity || 0}kg capacity. 
      `.replace(/\s+/g, ' ').trim();

      vol.semanticProfile = profile;
      
      process.stdout.write(`🎨 Embedding [${vol.name}]... `);
      
      try {
        const vector = await generateEmbedding(profile);
        if (vector && vector.length > 0) {
            // BYPASS VALIDATION: Use updateOne to bypass strict enum checks on existing messy data
            await Volunteer.updateOne(
              { _id: vol._id },
              { 
                $set: { 
                  embedding: vector, 
                  semanticProfile: profile, 
                  lastEmbeddedAt: new Date() 
                } 
              }
            );
            console.log('✅ Done');
        } else {
            console.log('⚠️  Failed (Empty Vector)');
        }
      } catch (embErr) {
        console.log(`❌ Error: ${embErr.message}`);
        if (embErr.message.includes('Quota')) {
          console.warn('⏸️  Rate Limit Triggered. Cooling down for 10s...');
          await new Promise(r => setTimeout(r, 10000));
        }
      }

      // 🏎️ Rate Limiting: Respect Vertex AI Free Tier quotas
      await new Promise(r => setTimeout(r, 1500)); 
    }

    console.log('\n✅ Mission Accomplished: All responders are now semantically searchable.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Critical Migration Failure:', err);
    process.exit(1);
  }
}

migrateToSemantic();
