const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    artist: {
        type: String,
        required: true,
        trim: true
    },
    cover: {
        type: String,       // image URL (CDN / local path)
        required: true
    },
    audioUrl: {
        type: String,       // mp3 / stream URL
        required: true
    },
    category: {
        type: String,       // "punjabi", "bollywood", "english", "sad", "lofi", "workout" etc.
        required: true,
        lowercase: true,
        trim: true
    },
    plays: {
        type: Number,
        default: 0          // trending ke liye
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.Song || mongoose.model("Song", SongSchema);
