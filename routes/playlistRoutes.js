const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

/* ==========================================================
   CREATE PLAYLIST
========================================================== */
router.post("/create", auth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name)
            return res.json({ success: false, message: "Playlist name required" });

        const exists = await Playlist.findOne({
            name,
            userId: req.user._id
        });

        if (exists)
            return res.json({ success: false, message: "Playlist already exists" });

        const playlist = await Playlist.create({
            name,
            userId: req.user._id,
            songs: []
        });

        return res.json({ success: true, playlist });

    } catch (err) {
        console.log("Create Playlist Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


/* ==========================================================
   GET ALL USER PLAYLISTS
========================================================== */
router.get("/my", auth, async (req, res) => {
    try {
        const playlists = await Playlist.find({
            userId: req.user._id
        }).populate("songs");

        return res.json({ success: true, playlists });

    } catch (err) {
        console.log("My Playlist Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


/* ==========================================================
   GET SINGLE PLAYLIST
========================================================== */
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


/* ==========================================================
   ADD SONG TO PLAYLIST
========================================================== */
router.post("/add", auth, async (req, res) => {
    try {
        const { playlistId, songId, songData } = req.body;

        const playlist = await Playlist.findOne({
            _id: playlistId,
            userId: req.user._id
        });

        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        let mongoSongId = songId;

        let existingSong = await Song.findById(songId);

        if (!existingSong) {
            if (!songData)
                return res.json({ success: false, message: "Song data missing" });

            const newSong = await Song.create({
                title: songData.title,
                artist: songData.artist,
                cover: songData.cover,
                audioUrl: songData.audioUrl,
                category: songData.category || "other"
            });

            mongoSongId = newSong._id;
        }

        if (!playlist.songs.includes(mongoSongId)) {
            playlist.songs.push(mongoSongId);
            await playlist.save();
        }

        return res.json({ success: true, message: "Song added", playlist });

    } catch (err) {
        console.log("Add Song Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


/* ==========================================================
   REMOVE SONG
========================================================== */
router.post("/remove", auth, async (req, res) => {
    try {
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findOne({
            _id: playlistId,
            userId: req.user._id
        });

        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        playlist.songs = playlist.songs.filter(
            id => id.toString() !== songId.toString()
        );

        await playlist.save();

        return res.json({ success: true, message: "Song removed" });

    } catch (err) {
        console.log("Remove Song Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});


/* ==========================================================
   DELETE PLAYLIST
========================================================== */
router.post("/delete", auth, async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            _id: req.body.playlistId,
            userId: req.user._id
        });

        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        await playlist.deleteOne();

        return res.json({ success: true, message: "Playlist deleted" });

    } catch (err) {
        console.log("Delete Playlist Error:", err);
        return res.json({ success: false, message: "Server error" });
    }
});

module.exports = router;
