//---------------------------------------------
// HINDI SONGS SYSTEM (JioSaavn API)
//---------------------------------------------

// MAIN FUNCTION: Load Hindi Songs
function loadHindiSongs(query = "bollywood") {
    const songsDiv = document.getElementById("songsContainer");
    if (!songsDiv) return;

    songsDiv.innerHTML = `<p style="color:#ccc;">Loading Hindi songs...</p>`;

    fetch(`https://musicfy-jkhs.onrender.com/api/music/hindi?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.songs) {
                songsDiv.innerHTML = `<p style="color:red;">No Hindi songs found.</p>`;
                return;
            }

            songsDiv.innerHTML = "";

            // BUILD SONG QUEUE
            songQueue = data.songs.map(song => ({
                _id: song.id || song._id,
                title: song.name,
                artist: song.primaryArtists,
                cover: song.image?.[2]?.url,
                audioUrl: getBestAudio(song.downloadUrl),   // auto audio quality
                source: "hindi"
            }));

            data.songs.forEach((song, index) => {
                const mapped = {
                    _id: song.id,
                    title: song.name,
                    artist: song.primaryArtists,
                    cover: song.image?.[2]?.url
                };

                songsDiv.innerHTML += createSongCardHTML(mapped, index);
            });
        })
        .catch(err => {
            console.error("Hindi Load Error:", err);
            songsDiv.innerHTML = `<p style="color:red;">Hindi songs failed to load.</p>`;
        });
}



//---------------------------------------------
// GET BEST AUDIO QUALITY URL
//---------------------------------------------
function getBestAudio(downloadList) {
    if (!downloadList || downloadList.length === 0) return "";

    // Prefer 160kbps or 320kbps if available
    const quality320 = downloadList.find(item => item.quality === "320kbps");
    const quality160 = downloadList.find(item => item.quality === "160kbps");

    if (quality320) return quality320.url;
    if (quality160) return quality160.url;

    return downloadList[0].url;
}



//---------------------------------------------
// LOAD TRENDING HINDI SONGS
//---------------------------------------------
function loadHindiTrending() {
    const songsDiv = document.getElementById("songsContainer");
    if (!songsDiv) return;

    songsDiv.innerHTML = `<p style="color:#ccc;">Loading Hindi Trending...</p>`;

    fetch(`https://musicfy-jkhs.onrender.com/api/music/hindi/trending`)
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.songs) {
                songsDiv.innerHTML = `<p style="color:red;">No trending Hindi songs.</p>`;
                return;
            }

            songsDiv.innerHTML = "";

            songQueue = data.songs.map(song => ({
                _id: song.id,
                title: song.name,
                artist: song.primaryArtists,
                cover: song.image?.[2]?.url,
                audioUrl: getBestAudio(song.downloadUrl),
                source: "hindi"
            }));

            data.songs.forEach((song, index) => {
                const mapped = {
                    _id: song.id,
                    title: song.name,
                    artist: song.primaryArtists,
                    cover: song.image?.[2]?.url
                };

                songsDiv.innerHTML += createSongCardHTML(mapped, index);
            });

        })
        .catch(err => {
            console.error("Hindi Trending Error:", err);
            songsDiv.innerHTML = `<p style="color:red;">Error loading Hindi trending.</p>`;
        });
}



//---------------------------------------------
// LOAD ARTIST SONGS (HINDI)
//---------------------------------------------
function loadHindiArtist(name) {
    const songsDiv = document.getElementById("songsContainer");
    if (!songsDiv) return;

    songsDiv.innerHTML = `<p style="color:#ccc;">Loading ${name} songs...</p>`;

    fetch(`https://musicfy-jkhs.onrender.com/api/music/hindi/artist/${encodeURIComponent(name)}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.songs) {
                songsDiv.innerHTML = `<p style="color:red;">No songs found for ${name}.</p>`;
                return;
            }

            songsDiv.innerHTML = "";

            songQueue = data.songs.map(song => ({
                _id: song.id,
                title: song.name,
                artist: song.primaryArtists,
                cover: song.image?.[2]?.url,
                audioUrl: getBestAudio(song.downloadUrl),
                source: "hindi"
            }));

            data.songs.forEach((song, index) => {
                const mapped = {
                    _id: song.id,
                    title: song.name,
                    artist: song.primaryArtists,
                    cover: song.image?.[2]?.url
                };

                songsDiv.innerHTML += createSongCardHTML(mapped, index);
            });

        })
        .catch(err => {
            console.error("Hindi Artist Error:", err);
            songsDiv.innerHTML = `<p style="color:red;">Error loading ${name} songs.</p>`;
        });
}



//---------------------------------------------
// AUTO-DETECT HINDI SEARCH KEYWORDS
//---------------------------------------------
function isHindiSearch(q) {
    const keywords = [
        "arijit", "arman", "arjit", "atif",
        "jubin", "kishore", "shreya", "sonu",
        "armaan", "bollywood", "hindi", "punjabi",
        "rahman", "udit", "kumar", "diljit"
    ];

    return keywords.some(word => q.toLowerCase().includes(word));
}
