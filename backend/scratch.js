const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  
  const { runGeocodingPipeline } = require('./services/geocodingPipeline');
  const BeneficiaryDataset = require('./models/BeneficiaryDataset');
  const Project = require('./models/Project');
  
  const projectId = '69ee36bc764dadf210871a0a'; // Project from Kavita's record
  const datasetId = '69ede1ea9001d9638bc6e741'; // Dataset ID

  const project = await Project.findById(projectId);
  const zones = project.regions.map(r => ({
    center: r.center,
    radius: r.radius,
    name: r.name
  }));

  // Reset the stats so the pipeline will process it
  await BeneficiaryDataset.updateOne({ _id: datasetId }, {
    $set: {
       'processingStats.status': 'idle',
       'processingStats.processedCount': 0,
       'processingStats.geocodedCount': 0,
       'processingStats.failedCount': 0
    }
  });

  console.log("Triggering geocoding pipeline...");
  await runGeocodingPipeline(datasetId, zones, projectId, 0);
  console.log("Pipeline finished!");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
