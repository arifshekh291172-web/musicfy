const express = require("express");
const router = express.Router();

const Playlist = require("../models/Playlist");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const JAMENDO_CLIENT_ID = "ad0706b4";


// ----------------------------------------------------------
// CHECK API STATUS
// ----------------------------------------------------------
router.get("/", (req, res) => {
    res.json({ ok: true, message: "Music API Live (Jamendo Mode)" });
});


// ----------------------------------------------------------
// FORMAT SONG OBJECT
// ----------------------------------------------------------
function format(track) {
    return {
        _id: track.id,
        title: track.name,
        artist: track.artist_name,
        cover: track.album_image,
        audioUrl: track.audio
    };
}



// ----------------------------------------------------------
// 1) ALL SONGS — Jamendo top 100
// ----------------------------------------------------------
router.get("/allsongs", async (req, res) => {
    try {
        const url =
            `https://api.jamendo.com/v3.0/tracks/` +
            `?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=100&audioformat=mp32&imagesize=300&order=popularity_total`;

        const api = await fetch(url).then(r => r.json());

        return res.json({
            success: true,
            songs: api.results.map(format)
        });

    } catch (err) {
        console.log("ALL SONGS ERROR:", err);
        res.json({ success: false, message: "Server Error" });
    }
});



// ----------------------------------------------------------
// 2) SEARCH SONGS
// ----------------------------------------------------------
router.get("/search", async (req, res) => {
    try {
        const q = req.query.q || "";

        if (!q) return res.json({ success: true, songs: [] });

        const url =
            `https://api.jamendo.com/v3.0/tracks/` +
            `?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50` +
            `&search=${encodeURIComponent(q)}` +
            `&audioformat=mp32&imagesize=300`;

        const api = await fetch(url).then(r => r.json());

        return res.json({
            success: true,
            songs: api.results.map(format)
        });

    } catch (err) {
        console.log("SEARCH ERROR:", err);
        res.json({ success: false, message: "Server Error" });
    }
});



// ----------------------------------------------------------
// 3) CATEGORY SONGS
// ----------------------------------------------------------
router.get("/category/:name", async (req, res) => {
    try {
        const category = req.params.name;

        const url =
            `https://api.jamendo.com/v3.0/tracks/` +
            `?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50` +
            `&tags=${encodeURIComponent(category)}`;

        const api = await fetch(url).then(r => r.json());

        return res.json({
            success: true,
            songs: api.results.map(format)
        });

    } catch (err) {
        console.log("CATEGORY ERROR:", err);
        res.json({ success: false, message: "Server Error" });
    }
});



// ----------------------------------------------------------
// 4) TRENDING SONGS
// ----------------------------------------------------------
router.get("/trending", async (req, res) => {
    try {
        const url =
            `https://api.jamendo.com/v3.0/tracks/` +
            `?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50&order=popularity_total`;

        const api = await fetch(url).then(r => r.json());

        return res.json({
            success: true,
            songs: api.results.map(format)
        });

    } catch (err) {
        console.log("TRENDING ERROR:", err);
        res.json({ success: false, message: "Server Error" });
    }
});



// ----------------------------------------------------------
// 5) ARTIST SONGS
// ----------------------------------------------------------
router.get("/artist/:name", async (req, res) => {
    try {
        const name = req.params.name;

        const url =
            `https://api.jamendo.com/v3.0/tracks/` +
            `?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50` +
            `&artist_name=${encodeURIComponent(name)}`;

        const api = await fetch(url).then(r => r.json());

        return res.json({
            success: true,
            songs: api.results.map(format)
        });

    } catch (err) {
        console.log("ARTIST ERROR:", err);
        res.json({ success: false });
    }
});



// ----------------------------------------------------------
// 6) PLAYLIST — CREATE
// ----------------------------------------------------------
router.post("/playlist/create", auth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name)
            return res.json({ success: false, message: "Name required" });

        const playlist = await Playlist.create({
            name,
            userId: req.user._id,
            songs: []
        });

        res.json({ success: true, playlist });

    } catch (err) {
        console.log("CREATE PLAYLIST ERROR:", err);
        res.json({ success: false });
    }
});



// ----------------------------------------------------------
// 7) GET MY PLAYLISTS
// ----------------------------------------------------------
router.get("/playlist/my", auth, async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.user._id });

        res.json({ success: true, playlists });

    } catch (err) {
        console.log("MY PLAYLIST ERROR:", err);
        res.json({ success: false });
    }
});



// ----------------------------------------------------------
// 8) ADD SONG TO PLAYLIST
// ----------------------------------------------------------
router.post("/playlist/add", auth, async (req, res) => {
    try {
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findById(playlistId);
        if (!playlist)
            return res.json({ success: false, message: "Playlist not found" });

        if (!playlist.songs.includes(songId))
            playlist.songs.push(songId);

        await playlist.save();

        res.json({ success: true, playlist });

    } catch (err) {
        console.log("ADD SONG PLAYLIST ERROR:", err);
        res.json({ success: false });
    }
});



// ----------------------------------------------------------
// 9) SAVE RECENTLY PLAYED
// ----------------------------------------------------------
router.post("/recent/add", auth, async (req, res) => {
    try {
        const { songId } = req.body;

        const user = await User.findById(req.user._id);

        // Remove old duplicate
        user.recentPlayed = user.recentPlayed.filter(id => id !== songId);

        // Push new on top
        user.recentPlayed.unshift(songId);

        // Keep max 10
        user.recentPlayed = user.recentPlayed.slice(0, 10);

        await user.save();

        return res.json({ success: true });

    } catch (err) {
        console.log("RECENT ADD ERROR:", err);
        res.json({ success: false });
    }
});



// ----------------------------------------------------------
// 10) RETURN RECENT WITH FULL DETAILS
// ----------------------------------------------------------
router.get("/recent", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const recentSongs = [];

        for (let id of user.recentPlayed) {
            const url =
                `https://api.jamendo.com/v3.0/tracks/` +
                `?client_id=${JAMENDO_CLIENT_ID}` +
                `&format=json&id=${id}`;

            const api = await fetch(url).then(r => r.json());

            if (api.results.length > 0) {
                recentSongs.push(format(api.results[0]));
            }
        }

        return res.json({
            success: true,
            recent: recentSongs
        });

    } catch (err) {
        console.log("RECENT FETCH ERROR:", err);
        res.json({ success: false });
    }
});




module.exports = router;
