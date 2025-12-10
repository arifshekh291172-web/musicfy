const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");

/* ==========================================================
   GET PREMIUM STATUS  →  /api/premium/check
========================================================== */
router.get("/check", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.isPremium || !user.premiumExpiry) {
            return res.json({
                isPremium: false,
                premiumExpiry: null,
                autoRenew: false
            });
        }

        const now = new Date();

        // If expired, remove premium
        if (user.premiumExpiry < now) {
            user.isPremium = false;
            user.premiumPlan = null;
            user.premiumExpiry = null;

            await user.save();

            return res.json({
                isPremium: false,
                premiumExpiry: null,
                autoRenew: false
            });
        }

        // Active Premium
        return res.json({
            isPremium: true,
            premiumExpiry: user.premiumExpiry,
            autoRenew: user.autoRenew || false
        });

    } catch (err) {
        console.log("Premium Status Error:", err);
        return res.json({
            isPremium: false,
            premiumExpiry: null,
            autoRenew: false
        });
    }
});

/* ==========================================================
   CANCEL PREMIUM → /api/premium/cancel
========================================================== */
router.post("/cancel", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.isPremium) {
            return res.json({
                success: false,
                message: "User is not premium"
            });
        }

        user.isPremium = false;
        user.premiumPlan = null;
        user.premiumExpiry = null;
        user.autoRenew = false;

        await user.save();

        return res.json({
            success: true,
            message: "Premium cancelled successfully"
        });

    } catch (err) {
        console.log("Cancel Premium Error:", err);
        return res.json({ 
            success: false, 
            message: "Server error" 
        });
    }
});

module.exports = router;
