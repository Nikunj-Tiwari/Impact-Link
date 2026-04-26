const mongoose = require('mongoose'); require('dotenv').config({path: '.env'});
const Beneficiary = require('./models/Beneficiary');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Try creating a beneficiary exactly like native driver
  const b = await Beneficiary.collection.insertOne({
    name: 'Test Native', datasetId: new mongoose.Types.ObjectId(), geo: { lat: 22, lng: 75 }
  });
  
  // Find it using Mongoose
  const doc = await Beneficiary.findById(b.insertedId);
  console.log('Doc geo:', doc.geo);
  console.log('Is function toObject?', typeof doc.geo.toObject);
  
  try {
    const geoResult = { ...doc.geo.toObject(), geocodeMethod: 'direct_coordinates', confidenceScore: 1.0 };
    console.log('GeoResult:', geoResult);
    
    // Update using collection.updateOne exactly like the pipeline
    await Beneficiary.collection.updateOne(
      { _id: doc._id },
      { $set: { geo: geoResult, zoneAssignment: { status: 'matched' } } }
    );
    
    // Read back
    const readBack = await Beneficiary.findById(doc._id);
    console.log('Read back geo:', readBack.geo);
    
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  
  await Beneficiary.collection.deleteOne({ _id: b.insertedId });
  process.exit(0);
});
