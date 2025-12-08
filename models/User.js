const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },   // <<< IMPORTANT
  isPremium: { type: Boolean, default: false },
  premiumPlan: { type: String, default: null },
  premiumExpiry: { type: Date, default: null },
  recentPlayed: { type: [String], default: [] }
});

module.exports = mongoose.model("User", userSchema);
