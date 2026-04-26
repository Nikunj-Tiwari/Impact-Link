const fs = require('fs');
const mongoose = require('mongoose'); require('dotenv').config({path: '.env'});

const req = {
  params: { id: '69ede1be9001d9638bc6e736' },
  body: {
    columnMapping: {
      name: 'Name',
      lat: 'Latitude',
      lng: 'Longitude'
    },
    projectId: '69ede2769001d9638bc6e742',
    zoneId: '0'
  }
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const BeneficiaryDataset = require('./models/BeneficiaryDataset');
  const Beneficiary = require('./models/Beneficiary');
  
  // Clear old
  await Beneficiary.deleteMany({ datasetId: req.params.id });
  await BeneficiaryDataset.updateOne({ _id: req.params.id }, { $set: { 'processingStats.status': 'pending' } });
  
  console.log('Sending request...');
  
  // Fake response object
  const res = {
    status: (code) => ({ json: (data) => console.log('Response:', code, data) }),
    json: (data) => console.log('Response:', data)
  };
  
  // Just require the router and manually call the handler
  const router = require('./routes/beneficiaryDatasets');
  const route = router.stack.find(l => l.route && l.route.path === '/:id/v2/process');
  
  await route.route.stack[0].handle(req, res, () => {});
  
  setTimeout(() => process.exit(0), 5000); // wait for pipeline
});
