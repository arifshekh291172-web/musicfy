const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const multer = require("multer");

const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const Device = require("../models/Device");


// ===============================
// STORAGE FOR PROFILE PHOTO
// ===============================
const storage = multer.diskStorage({
    destination: "uploads/profile/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });


// ===============================
// GET LOGGED-IN USER DETAILS
// /api/user/me
// ===============================
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// ===============================
// UPDATE PROFILE
// /api/user/update-profile
// ===============================
router.put("/update-profile", auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, req.body);
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


// ===============================
// UPLOAD PROFILE PHOTO
// /api/user/upload-photo
// ===============================
router.post("/upload-photo", auth, upload.single("photo"), async (req, res) => {
    try {
        const filePath = "/uploads/profile/" + req.file.filename;
        await User.findByIdAndUpdate(req.user._id, { photo: filePath });

        res.json({
            success: true,
            message: "Photo uploaded successfully",
            photo: filePath
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


// ===============================
// CHANGE PASSWORD
// /api/user/change-password
// ===============================
router.post("/change-password", auth, async (req, res) => {
    try {
        const { oldPass, newPass } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect old password" });
        }

        user.password = await bcrypt.hash(newPass, 10);
        await user.save();

        res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


// ===============================
// SECURITY INFO + 2FA
// ===============================
router.get("/security-info", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            twoFAEnabled: user.twoFAEnabled || false,
            lastLogin: user.lastLogin || null
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

router.post("/twofa", auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { twoFAEnabled: req.body.enabled });

        res.json({ success: true, message: "2FA updated successfully" });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


// ===============================
// USER MUSIC PREFERENCES
// /api/user/preferences
// ===============================
router.get("/preferences", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
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
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

router.put("/preferences", auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, req.body);
        res.json({ success: true, message: "Preferences updated successfully" });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


// ===============================
// REGIONAL SETTINGS
// /api/user/regional
// ===============================
router.get("/regional", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            language: user.language || "en",
            country: user.country || "India"
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

router.put("/regional", auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, req.body);
        res.json({ success: true, message: "Regional settings saved" });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});


// ===============================
// CONNECTED DEVICES
// /api/user/devices
// ===============================
router.get("/devices", auth, async (req, res) => {
    try {
        const devices = await Device.find({ userId: req.user._id });
        res.json({ success: true, devices });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

router.post("/devices/logout", auth, async (req, res) => {
    try {
        await Device.findByIdAndDelete(req.body.deviceId);
        res.json({ success: true, message: "Device logged out" });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

module.exports = router;
