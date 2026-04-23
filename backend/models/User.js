const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  displayName: { type: String },
  role: {
    type: String,
    enum: ['Volunteer', 'Administrator'],
    default: null   // null = not yet selected (triggers onboarding modal)
  },
  linkedVolunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    default: null
  },
  onboardingComplete: { type: Boolean, default: false },
  lastActiveAt: { type: Date },
  fcmToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
