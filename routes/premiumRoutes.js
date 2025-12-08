const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

// -------------------------------------------
// GET PREMIUM STATUS (Handles expiry)
// -------------------------------------------
router.get("/status", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Not premium
        if (!user.isPremium || !user.premiumExpiry) {
            return res.json({ premium: false });
        }

        // Check expiry
        const now = new Date();
        if (user.premiumExpiry < now) {
            user.isPremium = false;
            user.premiumPlan = null;
            user.premiumExpiry = null;
            await user.save();

            return res.json({ premium: false });
        }

        // Active Premium
        return res.json({
            premium: true,
            plan: user.premiumPlan,
            expiry: user.premiumExpiry
        });

    } catch (err) {
        console.log("Premium Status Error:", err);
        return res.json({ premium: false });
    }
});

// -------------------------------------------
// MANUALLY CANCEL PREMIUM
// -------------------------------------------
router.post("/cancel", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.isPremium) {
            return res.json({ success: false, message: "User is not premium" });
        }

        user.isPremium = false;
        user.premiumPlan = null;
        user.premiumExpiry = null;

        await user.save();

        return res.json({
            success: true,
            message: "Premium cancelled successfully"
        });

    } catch (err) {
        console.log("Cancel Premium Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;
