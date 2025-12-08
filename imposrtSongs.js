const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Song = require("./models/Song");

require("dotenv").config();

const AUDIO_DIR = path.join(__dirname, "uploads/audio");
const COVER_DIR = path.join(__dirname, "uploads/covers");

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected"))
  .catch(err => console.log(err));

async function importSongs() {
  const files = fs.readdirSync(AUDIO_DIR);

  for (const file of files) {
    if (!file.endsWith(".mp3")) continue;

    const title = file.replace(".mp3", "");
    const audioUrl = "/uploads/audio/" + file;

    // automatically match cover
    const coverName = title + ".jpg";
    const coverPath = path.join(COVER_DIR, coverName);
    const coverUrl = fs.existsSync(coverPath)
      ? "/uploads/covers/" + coverName
      : "";

    await Song.create({
      title,
      artist: "Unknown",
      audioUrl,
      cover: coverUrl
    });

    console.log("Imported:", title);
  }

  console.log("DONE");
  process.exit();
}

importSongs();
