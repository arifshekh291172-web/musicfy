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
        type: String,
        required: true
    },

    audioUrl: {
        type: String,
        required: true
    },

    // OPTIONAL — Hindi/Jamendo songs me category nahi hoti
    category: {
        type: String,
        default: "other",
        lowercase: true,
        trim: true
    },

    plays: {
        type: Number,
        default: 0
    },

    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.Song || mongoose.model("Song", SongSchema);