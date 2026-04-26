const mongoose = require('mongoose'); require('dotenv').config({path: '.env'});
const Beneficiary = require('./models/Beneficiary');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  let geo = undefined;
  const latVal = 22.7196;
  const lngVal = 75.8577;
  
  if (latVal !== null && lngVal !== null) {
    geo = {
      lat: latVal,
      lng: lngVal,
      geocodeMethod: 'direct_coordinates',
      confidenceScore: 1.0,
      geocodedAt: new Date()
    };
  }

  const rowToInsert = {
    name: 'Kavita Test',
    geo,
    zoneAssignment: { status: 'matched' }
  };
  
  console.log('Inserting:', rowToInsert);
  
  const b = await Beneficiary.collection.insertMany([rowToInsert], { ordered: false });
  
  const foundNative = await Beneficiary.collection.findOne({ _id: b.insertedIds[0] });
  console.log('Found Native:', foundNative);
  
  const foundMongoose = await Beneficiary.findById(b.insertedIds[0]);
  console.log('Found Mongoose:', foundMongoose.toObject());
  
  await Beneficiary.collection.deleteOne({ _id: b.insertedIds[0] });
  process.exit(0);
});
