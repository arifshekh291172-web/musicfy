const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Song = require("../models/Song");


// -------------------------------------------------------
// GET LYRICS OF SONG (Premium-only)
// -------------------------------------------------------
router.get("/:songId", auth, async (req, res) => {
    try {
        const song = await Song.findById(req.params.songId);

        if (!song) {
            return res.json({ success: false, message: "Song not found" });
        }

        if (!song.lyrics || song.lyrics.trim().length === 0) {
            return res.json({
                success: false,
                message: "Lyrics not available"
            });
        }

        return res.json({
            success: true,
            lyrics: song.lyrics
        });

    } catch (err) {
        console.log("Lyrics Fetch Error:", err);
        return res.json({ success: false });
    }
});


module.exports = router;
