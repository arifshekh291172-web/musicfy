const express = require("express");
const router = express.Router();
const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

// =======================================
// SEND OTP (Username OR Email)
// =======================================
router.post("/send-otp", async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier)
            return res.json({ success: false, message: "Enter username or email" });

        let user;

        // Check username OR email
        if (identifier.includes("@")) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ username: identifier });
        }

        if (!user)
            return res.json({ success: false, message: "User not registered" });

        const email = user.email;

        // Create OTP
        const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

        // Remove old OTP
        await OTP.deleteMany({ email });

        // Save new OTP
        await OTP.create({
            email,
            otp: otpValue,
            createdAt: Date.now()
        });

        // Send Email
        await sendEmail(
            email,
            "Musicfy Password Reset OTP",
            `<h2>Your OTP:</h2><h1>${otpValue}</h1>`
        );

        return res.json({
            success: true,
            message: "OTP sent successfully",
            email
        });

    } catch (err) {
        console.log("SEND OTP ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

// =======================================
// VERIFY OTP
// =======================================
router.post("/verify-otp", async (req, res) => {
    try {
        const { identifier, otp } = req.body;

        if (!identifier || !otp)
            return res.json({ success: false, message: "Missing fields" });

        let user;
        if (identifier.includes("@")) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ username: identifier });
        }

        if (!user)
            return res.json({ success: false, message: "User not registered" });

        const otpData = await OTP.findOne({ email: user.email });

        if (!otpData)
            return res.json({ success: false, message: "OTP not found" });

        if (otpData.otp !== otp)
            return res.json({ success: false, message: "Incorrect OTP" });

        return res.json({ success: true, message: "OTP verified" });

    } catch (err) {
        console.log("VERIFY OTP ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

// =======================================
// RESET PASSWORD
// =======================================
router.post("/reset-password", async (req, res) => {
    try {
        const { identifier, newPassword } = req.body;

        if (!identifier || !newPassword)
            return res.json({ success: false, message: "Missing fields" });

        let user;
        if (identifier.includes("@")) {
            user = await User.findOne({ email: identifier });
        } else {
            user = await User.findOne({ username: identifier });
        }

        if (!user)
            return res.json({ success: false, message: "User not found" });

        const hashed = await bcrypt.hash(newPassword, 10);

        user.password = hashed;
        await user.save();

        await OTP.deleteMany({ email: user.email });

        return res.json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (err) {
        console.log("RESET PASSWORD ERROR:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;
