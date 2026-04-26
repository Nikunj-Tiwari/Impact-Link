require('dotenv').config();
const mongoose = require('mongoose');
const BeneficiaryDataset = require('./models/BeneficiaryDataset');

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Resetting all dataset locks...');
  const result = await BeneficiaryDataset.collection.updateMany({}, { 
    $set: { 
      'processingStats.status': 'idle', 
      'processingStats.processedCount': 0, 
      'processingStats.geocodedCount': 0, 
      'processingStats.failedCount': 0 
    } 
  });
  console.log(`Cleared locks for ${result.modifiedCount} datasets.`);
  process.exit(0);
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});
