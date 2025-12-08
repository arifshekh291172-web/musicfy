const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 min
  }
});

module.exports = mongoose.model("OTP", OTPSchema);
