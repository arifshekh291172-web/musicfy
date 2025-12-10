const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");

const JAMENDO_CLIENT_ID = "ad0706b4";

// ----------------------------------------------------------
// API STATUS CHECK
// ----------------------------------------------------------
router.get("/", (req, res) => {
    res.json({ success: true, message: "Music API Active" });
});

// ----------------------------------------------------------
// FORMAT Jamendo Song
// ----------------------------------------------------------
function format(track) {
    return {
        _id: track.id,
        title: track.name,
        artist: track.artist_name,
        cover: track.album_image,
        audioUrl: track.audio,
        source: "jamendo"
    };
}

/* ==========================================================
   HINDI MUSIC (PUBLIC)
========================================================== */

// Hindi Search
router.get("/hindi", async (req, res) => {
    try {
        const q = req.query.q || "bollywood";

        const api = await axios.get(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}`);

        res.json({ success: true, songs: api.data.data.results || [] });

    } catch (err) {
        console.log("HINDI SEARCH ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

// Hindi Trending
router.get("/hindi/trending", async (req, res) => {
    try {
        const api = await axios.get("https://saavn.dev/api/modules?language=hindi");

        res.json({
            success: true,
            songs: api.data.data?.trending?.songs || []
        });

    } catch (err) {
        console.log("HINDI TRENDING ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

// Hindi Artist Songs
router.get("/hindi/artist/:name", async (req, res) => {
    try {
        const name = req.params.name;

        const api = await axios.get(
            `https://saavn.dev/api/search/songs?query=${encodeURIComponent(name)}`
        );

        res.json({ success: true, songs: api.data.data.results || [] });

    } catch (err) {
        console.log("HINDI ARTIST ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

/* ==========================================================
   JAMENDO (PUBLIC)
========================================================== */

// All Songs (Top)
router.get("/allsongs", async (req, res) => {
    try {
        const url =
            `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=100&audioformat=mp32&imagesize=300&order=popularity_total`;

        const api = await fetch(url).then(r => r.json());

        res.json({
            success: true,
            songs: api.results.map(format)
        });

    } catch (err) {
        console.log("ALL SONGS ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

// Jamendo Search
router.get("/search", async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.json({ success: true, songs: [] });

        const url =
            `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50&search=${encodeURIComponent(q)}` +
            `&audioformat=mp32&imagesize=300`;

        const api = await fetch(url).then(r => r.json());

        res.json({ success: true, songs: api.results.map(format) });

    } catch (err) {
        console.log("SEARCH ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

// Category Songs
router.get("/category/:name", async (req, res) => {
    try {
        const url =
            `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50&tags=${encodeURIComponent(req.params.name)}`;

        const api = await fetch(url).then(r => r.json());

        res.json({ success: true, songs: api.results.map(format) });

    } catch (err) {
        console.log("CATEGORY ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

// Trending Jamendo
router.get("/trending", async (req, res) => {
    try {
        const url =
            `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50&order=popularity_total`;

        const api = await fetch(url).then(r => r.json());

        res.json({ success: true, songs: api.results.map(format) });

    } catch (err) {
        console.log("TRENDING ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});

// Jamendo Artist
router.get("/artist/:name", async (req, res) => {
    try {
        const name = req.params.name;

        const url =
            `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
            `&format=json&limit=50&artist_name=${encodeURIComponent(name)}`;

        const api = await fetch(url).then(r => r.json());

        res.json({ success: true, songs: api.results.map(format) });

    } catch (err) {
        console.log("ARTIST ERROR:", err.message);
        res.json({ success: false, songs: [] });
    }
});
router.get("/suggest", async (req, res) => {
    try {
        const q = req.query.q || "";
        if (q.length < 1) return res.json({ success: true, suggestions: [] });

        // -------------------------
        // JioSaavn Song + Artist
        // -------------------------
        const hindi = await fetch(
            `https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}`
        ).then(r => r.json()).catch(() => null);

        let hindiSuggestions = [];
        if (hindi?.data?.results) {
            hindiSuggestions = hindi.data.results.slice(0, 5).map(s => ({
                name: s.name,
                type: "song",
                image: s.image?.[2]?.link || "",
            }));
        }

        // -------------------------
        // Jamendo Artist
        // -------------------------
        const jamURL =
            `https://api.jamendo.com/v3.0/artists/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=5&namesearch=${encodeURIComponent(q)}`;

        const jam = await fetch(jamURL).then(r => r.json()).catch(() => null);

        let jamSuggestions = [];
        if (jam?.results) {
            jamSuggestions = jam.results.map(a => ({
                name: a.name,
                type: "artist",
                image: a.image,
            }));
        }

        // FINAL MERGE
        const suggestions = [...hindiSuggestions, ...jamSuggestions];

        res.json({ success: true, suggestions });

    } catch (err) {
        console.log("SUGGEST ERROR:", err);
        res.json({ success: false, suggestions: [] });
    }
});

/* ==========================================================
   RECENTLY PLAYED (AUTH REQUIRED)
========================================================== */

// Add Recent Song
router.post("/recent/add", auth, async (req, res) => {
    try {
        const { songId } = req.body;
        if (!songId) return res.json({ success: false, message: "songId missing" });

        const user = await User.findById(req.user._id);

        user.recentPlayed = user.recentPlayed.filter(id => id !== songId);
        user.recentPlayed.unshift(songId);
        user.recentPlayed = user.recentPlayed.slice(0, 10);

        await user.save();

        res.json({ success: true });

    } catch (err) {
        console.log("RECENT ADD ERROR:", err.message);
        res.json({ success: false });
    }
});

// Get Recent Songs
router.get("/recent", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const recentSongs = [];

        for (let id of user.recentPlayed) {
            const url =
                `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
                `&format=json&id=${id}`;

            const api = await fetch(url).then(r => r.json());

            if (api.results?.length > 0)
                recentSongs.push(format(api.results[0]));
        }

        res.json({ success: true, recent: recentSongs });

    } catch (err) {
        console.log("RECENT FETCH ERROR:", err.message);
        res.json({ success: false });
    }
});

module.exports = router;
