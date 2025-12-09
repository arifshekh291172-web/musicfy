const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // MongoDB auto delete after 5 mins
  }
});

module.exports = mongoose.model("OTP", OTPSchema);
