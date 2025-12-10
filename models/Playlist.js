const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    songs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Song"
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports =
    mongoose.models.Playlist || mongoose.model("Playlist", PlaylistSchema);
