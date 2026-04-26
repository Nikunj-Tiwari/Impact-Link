require('dotenv').config();
const mongoose = require('mongoose');
const Beneficiary = require('./models/Beneficiary');
const BeneficiaryDataset = require('./models/BeneficiaryDataset');
const Project = require('./models/Project');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- DB DIAGNOSTIC ---');
  
  const datasets = await BeneficiaryDataset.find();
  console.log('Found', datasets.length, 'datasets');
  for (const d of datasets) {
    const count = await Beneficiary.countDocuments({ datasetId: d._id });
    console.log(`Dataset: ${d.name} (${d._id}) -> ${count} beneficiaries`);
  }

  const orphans = await Beneficiary.countDocuments({ datasetId: { $nin: datasets.map(d => d._id) } });
  console.log('Orphan beneficiaries:', orphans);

  const projects = await Project.find();
  console.log('Found', projects.length, 'projects');
  for (const p of projects) {
    console.log(`Project: ${p.name} (${p._id})`);
    console.log('  Summary:', JSON.stringify(p.beneficiarySummary, null, 2));
    const linkedBens = await Beneficiary.countDocuments({ projectId: p._id });
    console.log(`  Linked beneficiaries in DB: ${linkedBens}`);
  }

  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
