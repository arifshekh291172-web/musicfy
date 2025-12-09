const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song"); // Optional — keep if needed

// -------------------------------------------------------
// GET FULL PLAYLIST BY ID
// -------------------------------------------------------
router.get("/:id", auth, async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate("songs");

        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        return res.json({ success: true, playlist });

    } catch (err) {
        console.log("Playlist Fetch Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

// -------------------------------------------------------
// ADD SONG TO PLAYLIST
// -------------------------------------------------------
router.post("/add", auth, async (req, res) => {
    try {
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findOne({
            _id: playlistId,
            userId: req.user._id
        });

        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
        }

        await playlist.save();

        return res.json({ success: true, message: "Song added to playlist" });

    } catch (err) {
        console.log("Add Song Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

// -------------------------------------------------------
// REMOVE SONG FROM PLAYLIST
// -------------------------------------------------------
router.post("/remove", auth, async (req, res) => {
    try {
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findOne({
            _id: playlistId,
            userId: req.user._id
        });

        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        playlist.songs = playlist.songs.filter(id => id.toString() !== songId.toString());
        await playlist.save();

        return res.json({ success: true, message: "Song removed from playlist" });

    } catch (err) {
        console.log("Remove Song Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;
