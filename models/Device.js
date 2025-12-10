const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Device", deviceSchema);
