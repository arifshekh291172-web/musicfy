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
const authRoutes = require("./routes/authRoutes");
const musicRoutes = require("./routes/musicRoutes");
const premiumRoutes = require("./routes/premiumRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const lyricsRoutes = require("./routes/lyricsRoutes");

// ------------------------------
// Route Mapping
// ------------------------------
app.use("/api", authRoutes);                     // Auth + OTP + Login
app.use("/api/music", musicRoutes);              // Jamendo + All Music APIs
app.use("/api/music", playlistRoutes);           // Playlist routes
app.use("/api/music", lyricsRoutes);             // Lyrics routes
app.use("/api/premium", premiumRoutes);          // Premium check
app.use("/api/payment", paymentRoutes);          // Razorpay payments
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
