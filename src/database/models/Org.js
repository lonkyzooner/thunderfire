const mongoose = require('mongoose');

const OrgSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  inviteCode: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Org', OrgSchema);