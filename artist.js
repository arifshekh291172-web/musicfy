const BACKEND_URL = "https://musicfy-jkhs.onrender.com";

// URL se artist naam
const params = new URLSearchParams(window.location.search);
const artistName = params.get("artist");

if (!artistName) {
    alert("Artist missing");
}

// DOM
const artistHeader = document.getElementById("artistHeader");
const songList = document.getElementById("songList");
const albumRow = document.getElementById("albumRow");
const playlistRow = document.getElementById("playlistRow");

// START
loadArtistData(artistName);


// -----------------------------------------------------------
// LOAD ARTIST SONGS (Hindi + English Mix)
// -----------------------------------------------------------
async function loadArtistData(name) {
    try {
        const [hindiRes, engRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/music/hindi/artist/${encodeURIComponent(name)}`).then(r => r.json()),
            fetch(`${BACKEND_URL}/api/music/artist/${encodeURIComponent(name)}`).then(r => r.json())
        ]);

        // map hindi
        const hindiSongs = (hindiRes.songs || []).map(s => ({
            title: s.name,
            artist: s.primaryArtists,
            cover: s.image?.[2]?.link,
            audioUrl: getHindiAudio(s.downloadUrl),
            source: "hindi"
        }));

        // map english
        const engSongs = (engRes.songs || []).map(s => ({
            title: s.title,
            artist: s.artist,
            cover: s.cover,
            audioUrl: s.audioUrl,
            source: "jamendo"
        }));

        const all = [...hindiSongs, ...engSongs];

        if (!all.length) {
            artistHeader.innerHTML = `<h1 style="padding:40px;">No Results</h1>`;
            return;
        }

        renderArtistHeader(all[0], name);
        renderSongs(all);
        renderAlbums(all);
        renderPlaylists(all);

        // Store global list for play
        window.artistSongs = all;

    } catch (err) {
        console.log("ARTIST ERROR:", err);
        alert("Error loading artist.");
    }
}


// -----------------------------------------------------------
// RENDER HEADER (Image + Name)
// -----------------------------------------------------------
function renderArtistHeader(song, name) {
    artistHeader.innerHTML = `
        <div class="artist-header">
            <img src="${song.cover}">
            <div class="artist-info">
                <h1>${name}</h1>
                <p>${song.artist}</p>
            </div>
        </div>
    `;
}


// -----------------------------------------------------------
// RENDER SONG LIST
// -----------------------------------------------------------
function renderSongs(list) {
    songList.innerHTML = "";

    list.forEach((s, index) => {
        songList.innerHTML += `
            <div class="song-item" onclick="playArtistSong(${index})">
                <img src="${s.cover}">
                <div>
                    <p><b>${s.title}</b></p>
                    <p class="small">${s.artist}</p>
                </div>
            </div>
        `;
    });
}


// -----------------------------------------------------------
// AUTO ALBUMS (Artist Mixes)
// -----------------------------------------------------------
function renderAlbums(list) {
    const grouped = groupBy(list, s => s.artist);

    albumRow.innerHTML = "";

    Object.keys(grouped).slice(0, 10).forEach(artist => {
        const first = grouped[artist][0];

        albumRow.innerHTML += `
            <div class="album-card">
                <img src="${first.cover}">
                <p><b>${artist} Mix</b></p>
                <p class="small">${artist}</p>
            </div>
        `;
    });
}


// -----------------------------------------------------------
// AUTO PLAYLISTS BASED ON ARTIST (Spotify Style)
// -----------------------------------------------------------
function renderPlaylists(list) {
    playlistRow.innerHTML = "";

    const cover = list[0].cover;

    playlistRow.innerHTML += `
        <div class="playlist-card">
            <img src="${cover}">
            <p><b>${artistName} Essentials</b></p>
            <p class="small">Best of ${artistName}</p>
        </div>
    `;

    const hindiSong = list.find(s => s.source === "hindi");
    if (hindiSong) {
        playlistRow.innerHTML += `
            <div class="playlist-card">
                <img src="${hindiSong.cover}">
                <p><b>Desi Hits – ${artistName}</b></p>
                <p class="small">Top Hindi Tracks</p>
            </div>
        `;
    }
}


// -----------------------------------------------------------
// PLAY SONG → REDIRECT TO index.html PLAYER
// -----------------------------------------------------------
window.playArtistSong = function (index) {
    const s = window.artistSongs[index];

    localStorage.setItem("play_now_song", JSON.stringify(s));

    alert(`"${s.title}" will play on home page.`);
    window.location.href = "index.html";
};


// -----------------------------------------------------------
// HELPER – BEST AUDIO FROM SAAVN
// -----------------------------------------------------------
function getHindiAudio(list) {
    if (!list) return "";
    const q320 = list.find(x => x.quality === "320kbps");
    const q160 = list.find(x => x.quality === "160kbps");
    return (q320?.url || q160?.url || list[0]?.url || "");
}


// -----------------------------------------------------------
// GROUP BY FUNCTION
// -----------------------------------------------------------
function groupBy(arr, fn) {
    return arr.reduce((acc, item) => {
        const key = fn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
}
