const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");  // FIXED: small s

// -------------------------------------------------------
// GET FULL PLAYLIST BY ID  (Used for offline download)
// -------------------------------------------------------
router.get("/:id", auth, async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate("songs");  // full song doc

        if (!playlist) {
            return res.json({ success: false, message: "Playlist not found" });
        }

        return res.json({
            success: true,
            playlist
        });

    } catch (err) {
        console.log("Playlist Fetch Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;
