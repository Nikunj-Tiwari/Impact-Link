const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Ward', 'Sector', 'Village', 'District'], default: 'Ward' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  censusCode: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model('Location', locationSchema);
