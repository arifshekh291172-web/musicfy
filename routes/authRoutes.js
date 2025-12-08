const express = require("express");
const router = express.Router();
const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const auth = require("../middleware/authMiddleware");


// ======================================================
// 1) SEND OTP (STEP 1)
// ======================================================
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.json({ success: false, message: "Email is required" });

    // Check if already registered
    const exists = await User.findOne({ email });
    if (exists)
      return res.json({ success: false, message: "Email already registered" });

    // Generate OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: otpValue,
      expiry: Date.now() + 10 * 60 * 1000
    });

    await sendEmail(
      email,
      "Musicfy Email Verification",
      `<h2>Your OTP Code:</h2><h1>${otpValue}</h1>`
    );

    return res.json({
      success: true,
      message: "OTP sent successfully!"
    });

  } catch (err) {
    console.log("SEND OTP ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});



// ======================================================
// 2) VERIFY OTP (STEP 2)
// ======================================================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpData = await OTP.findOne({ email });

    if (!otpData)
      return res.json({ success: false, message: "OTP not found" });

    if (otpData.expiry < Date.now())
      return res.json({ success: false, message: "OTP expired" });

    if (otpData.otp !== otp)
      return res.json({ success: false, message: "Incorrect OTP" });

    await OTP.deleteMany({ email });

    return res.json({
      success: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});



// ======================================================
// 3) FINAL REGISTER (STEP 3)
// ======================================================
router.post("/register-final", async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password)
      return res.json({ success: false, message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.json({ success: false, message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      username,
      password: hashed,
      verified: true
    });

    return res.json({
      success: true,
      message: "Account created successfully!"
    });

  } catch (err) {
    console.log("REGISTER FINAL ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});



// ======================================================
// 4) RESEND OTP
// ======================================================
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp: otpValue,
      expiry: Date.now() + 10 * 60 * 1000
    });

    await sendEmail(
      email,
      "Your New OTP Verification Code",
      `<h2>Your new OTP:</h1><h1>${otpValue}</h1>`
    );

    return res.json({ success: true, message: "New OTP sent!" });

  } catch (err) {
    console.log("RESEND OTP ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});



// ======================================================
// 5) LOGIN — EMAIL OR USERNAME
// ======================================================
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password)
      return res.json({ success: false, message: "All fields required" });

    // LOGIN WITH EMAIL OR USERNAME
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });

    if (!user)
      return res.json({ success: false, message: "User not found" });

    if (!user.verified)
      return res.json({ success: false, message: "Email not verified" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        fullName: user.fullName,
        email: user.email,
        username: user.username
      }
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});



// ======================================================
// 6) GET CURRENT USER
// ======================================================
router.get("/me", auth, (req, res) => {
  return res.json({
    success: true,
    user: {
      fullName: req.user.fullName,
      email: req.user.email,
      username: req.user.username
    }
  });
});



// ======================================================
// 7) LOGOUT
// ======================================================
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.token = "";
    await req.user.save();

    res.json({ success: true, message: "Logged out successfully" });

  } catch (err) {
    console.log("LOGOUT ERROR:", err);
    return res.json({ success: false, message: "Server error" });
  }
});


module.exports = router;
