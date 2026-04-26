require('dotenv').config();
const mongoose = require('mongoose');
const BeneficiaryDataset = require('./models/BeneficiaryDataset');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- SYSTEM HEARTBEAT MONITOR ---');
  
  for (let i = 0; i < 10; i++) {
    const datasets = await BeneficiaryDataset.collection.find({ 'processingStats.status': 'processing' }).toArray();
    if (datasets.length === 0) {
      console.log('No active processes found.');
    } else {
      datasets.forEach(d => {
        console.log(`Dataset: ${d.name} (${d._id})`);
        console.log(`  Status: ${d.processingStats.status}`);
        console.log(`  Progress: ${d.processingStats.processedCount} / ${d.processingStats.totalRows}`);
      });
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  process.exit(0);
}

debug();
