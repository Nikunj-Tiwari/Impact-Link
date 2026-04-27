const mongoose = require('mongoose');
const Location = require('./models/Location');
const Volunteer = require('./models/Volunteer');
const Project = require('./models/Project');

async function check() {
  await mongoose.connect('mongodb+srv://advbk:YlOqAclF22hZf9Yh@cluster0.zll2n.mongodb.net/impactlink?retryWrites=true&w=majority');
  
  const locs = await Location.find({ 
    name: { $in: ['Guwahati Flood Response', 'Delhi NCR Hub'] } 
  });
  console.log('LOCATIONS:', JSON.stringify(locs, null, 2));

  const project = await Project.findOne({ name: 'test-4' });
  if (project) {
    console.log('PROJECT ID:', project._id);
    const volunteers = await Volunteer.find({ projectIds: project._id }).populate('locationId');
    console.log('VOLUNTEERS:', JSON.stringify(volunteers.map(v => ({
      name: v.name,
      locationName: v.locationId?.name,
      coords: { lat: v.locationId?.lat, lng: v.locationId?.lng },
      liveLocation: v.liveLocation
    })), null, 2));
  }

  process.exit(0);
}

check();
