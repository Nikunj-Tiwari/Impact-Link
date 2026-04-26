const mongoose = require('mongoose'); require('dotenv').config({path: '.env'});
const Beneficiary = require('./models/Beneficiary');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const b = await Beneficiary.collection.insertOne({ name: 'Test MongoDB Set Error' });
  const doc = await Beneficiary.findById(b.insertedId);
  
  try {
    const geoResult = { lat: 22, lng: 75 };
    await Beneficiary.collection.updateOne(
      { _id: doc._id },
      { $set: { geo: geoResult, 'geo.geocodedAt': new Date() } }
    );
    console.log('Update succeeded!');
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  
  await Beneficiary.collection.deleteOne({ _id: b.insertedId });
  process.exit(0);
});
