// ------------------------------
// Load Environment Variables
// ------------------------------
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// DB Connection
const connectDB = require("./config/db");

// Initialize Express
const app = express();

// ------------------------------
// Middleware
// ------------------------------
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// ------------------------------
// Routes Import
// ------------------------------
const musicRoutes = require("./routes/musicRoutes");
const authRoutes = require("./routes/authRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");
const userRoutes  = require("./routes/userRoutes.js");
// ------------------------------
// Route Mapping (Correct Order)
// ------------------------------
// ------------------------------
// ROUTE MAPPING (DO NOT CHANGE ORDER)
// ------------------------------

// Auth → Login / Register
app.use("/api", authRoutes);

// Premium System
app.use("/api/premium", premiumRoutes);

// User Routes
app.use("/api/user", userRoutes);

// Music + Search + Hindi + English
app.use("/api/music", musicRoutes);

// Playlist Routes
app.use("/api/music/playlist", playlistRoutes);

// Lyrics
app.use("/api/lyrics", lyricsRoutes);

// Payment
app.use("/api/payment", paymentRoutes);

// Forgot Password
app.use("/api/auth/forgot", require("./routes/forgot"));


// ------------------------------
// Default Route (API Test)
// ------------------------------
app.get("/", (req, res) => {
  res.send("Musicfy Backend Running Successfully!");
});

// ------------------------------
// SERVER START
// ------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SERVER ACTIVE ON PORT ${PORT}`));
