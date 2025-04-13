const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  orgId: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, default: "" },
  rank: { type: String, enum: ['officer', 'deputy', 'sergeant', 'lieutenant', 'captain', 'chief', 'admin', 'supervisor', 'dispatcher'], default: "officer" },
  role: { type: String, enum: ['officer', 'admin', 'supervisor', 'dispatcher'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
