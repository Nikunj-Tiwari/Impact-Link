require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');
const Supply = require('./models/Supply');

async function syncAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clear all supplies to do a clean sync
  await Supply.deleteMany({});
  
  const projects = await Project.find();
  for (const proj of projects) {
    if (proj.hierarchicalSupplies && proj.hierarchicalSupplies.length > 0) {
      const suppliesToCreate = [];
      proj.hierarchicalSupplies.forEach(category => {
        if (category.items) {
          category.items.forEach(item => {
            suppliesToCreate.push({
              projectId: proj._id,
              type: item.type,
              quantity: item.targetQuantity || 0,
              location: 'Central Node'
            });
          });
        }
      });
      if (suppliesToCreate.length > 0) {
        await Supply.insertMany(suppliesToCreate);
        console.log(`Synced ${suppliesToCreate.length} supplies for ${proj.name}`);
      }
    }
  }
  
  process.exit(0);
}

syncAll();
