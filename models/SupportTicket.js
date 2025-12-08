const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema({
    email: { type: String, required: true },
    topic: { type: String, required: true },
    message: { type: String, required: true },

    // NEW: priority & premium flag
    isPremium: { type: Boolean, default: false },         // premium user hai?
    priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal"
    },

    status: {
        type: String,
        enum: ["open", "in-progress", "resolved"],
        default: "open"
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SupportTicket", TicketSchema);
