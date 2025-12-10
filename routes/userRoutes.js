const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");

const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Device = require("../models/Device");

// ===============================
// PROFILE PHOTO UPLOAD
// ===============================
const storage = multer.diskStorage({
    destination: "uploads/profile/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// ===============================
// GET USER DETAILS
// ===============================
router.get("/me", auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json(user);
});

// ===============================
// UPDATE PROFILE
// ===============================
router.put("/update-profile", auth, async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, req.body);
    res.json({ message: "Profile updated successfully" });
});

// ===============================
// UPLOAD PHOTO
// ===============================
router.post("/upload-photo", auth, upload.single("photo"), async (req, res) => {
    const filePath = "/uploads/profile/" + req.file.filename;
    await User.findByIdAndUpdate(req.user._id, { photo: filePath });
    res.json({ message: "Photo updated", photo: filePath });
});

// ===============================
// CHANGE PASSWORD
// ===============================
router.post("/change-password", auth, async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!await bcrypt.compare(req.body.oldPass, user.password)) {
        return res.status(400).json({ message: "Incorrect old password" });
    }

    user.password = await bcrypt.hash(req.body.newPass, 10);
    await user.save();

    res.json({ message: "Password updated" });
});

// ===============================
// SECURITY INFO
// ===============================
router.get("/security-info", auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        twoFAEnabled: user.twoFAEnabled,
        lastLogin: user.lastLogin
    });
});

// ENABLE / DISABLE 2FA
router.post("/twofa", auth, async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { twoFAEnabled: req.body.enabled });
    res.json({ message: "2FA updated" });
});

// ===============================
// GET USER PREFERENCES
// ===============================
router.get("/preferences", auth, async (req, res) => {
    const user = await User.findById(req.user._id);

    res.json({
        genres: user.genres || [],
        blockExplicit: user.blockExplicit || false,
        playQuality: user.playQuality || "auto",
        downloadQuality: user.downloadQuality || "medium",
        crossfade: user.crossfade || 0,
        gapless: user.gapless || false,
        autoplay: user.autoplay || false,
        dataSaver: user.dataSaver || false,
        animations: user.animations !== false
    });
});

// ===============================
// UPDATE USER PREFERENCES
// ===============================
router.put("/preferences", auth, async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, req.body);
    res.json({ message: "Preferences saved" });
});

// ===============================
// REGIONAL SETTINGS
// ===============================
router.get("/regional", auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({
        language: user.language || "en",
        country: user.country || "India"
    });
});

router.put("/regional", auth, async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, req.body);
    res.json({ message: "Regional settings saved" });
});

// ===============================
// CONNECTED DEVICES
// ===============================
router.get("/devices", auth, async (req, res) => {
    const devices = await Device.find({ userId: req.user._id });
    res.json({ devices });
});

router.post("/devices/logout", auth, async (req, res) => {
    await Device.findByIdAndDelete(req.body.deviceId);
    res.json({ message: "Device logged out" });
});

module.exports = router;
