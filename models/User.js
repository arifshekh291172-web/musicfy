const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    verified: { type: Boolean, default: false },

    // ======================
    // PREMIUM SYSTEM
    // ======================
    isPremium: { type: Boolean, default: false },
    premiumPlan: { type: String, default: null },
    premiumExpiry: { type: Date, default: null },

    // ======================
    // PROFILE SETTINGS
    // ======================
    photo: { type: String, default: null },
    theme: { type: String, default: "dark" },
    language: { type: String, default: "en" },
    country: { type: String, default: "India" },

    // ======================
    // MUSIC PREFERENCES
    // ======================
    genres: { type: [String], default: [] },
    blockExplicit: { type: Boolean, default: false },
    playQuality: { type: String, default: "auto" },
    downloadQuality: { type: String, default: "medium" },
    crossfade: { type: Number, default: 0 },
    gapless: { type: Boolean, default: false },
    autoplay: { type: Boolean, default: true },
    dataSaver: { type: Boolean, default: false },
    animations: { type: Boolean, default: true },

    // ======================
    // SECURITY SETTINGS
    // ======================
    twoFAEnabled: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

    // ======================
    // RECENT ACTIVITY
    // ======================
    recentPlayed: { type: [String], default: [] }
});

module.exports = mongoose.model("User", userSchema);
