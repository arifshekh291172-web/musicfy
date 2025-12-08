const axios = require("axios");
require("dotenv").config();

let cachedToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
    const currentTime = Math.floor(Date.now() / 1000);

    // If token still valid, re-use it
    if (cachedToken && currentTime < tokenExpiry) {
        return cachedToken;
    }

    // Else request a new token
    const tokenUrl = "https://accounts.spotify.com/api/token";

    const credentials = Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
    ).toString("base64");

    const response = await axios.post(
        tokenUrl,
        "grant_type=client_credentials",
        {
            headers: {
                Authorization: "Basic " + credentials,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    // save new token
    cachedToken = response.data.access_token;
    tokenExpiry = Math.floor(Date.now() / 1000) + response.data.expires_in - 60;

    return cachedToken;
}

module.exports = getSpotifyToken;
