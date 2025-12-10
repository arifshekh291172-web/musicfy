const BACKEND_URL = "https://musicfy-jkhs.onrender.com";

/* ==========================================================
   DOM REFERENCES (Null-safe)
========================================================== */
const searchBox = document.getElementById("searchBox");
const topResultSection = document.getElementById("topResultSection");
const topResultDiv = document.getElementById("topResult");

const artistSectionWrapper = document.getElementById("artistSectionWrapper");
const artistSection = document.getElementById("artistSection");

const albumSectionWrapper = document.getElementById("albumSectionWrapper");
const albumSection = document.getElementById("albumSection");

const songSectionWrapper = document.getElementById("songSectionWrapper");
const songSection = document.getElementById("songSection");

const playlistSectionWrapper = document.getElementById("playlistSectionWrapper");
const playlistSection = document.getElementById("playlistSection");

const emptyMsg = document.getElementById("emptyMsg");

let combinedSongs = [];

/* ==========================================================
   GET QUERY FROM URL
========================================================== */
const params = new URLSearchParams(window.location.search);
const initialQ = params.get("q") || "";

if (initialQ && searchBox) {
    searchBox.value = initialQ;
    runFullSearch(initialQ);
}

/* ==========================================================
   SEARCH ON ENTER
========================================================== */
if (searchBox) {
    searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = searchBox.value.trim();
            if (q) runFullSearch(q);
        }
    });
}

/* ==========================================================
   MAIN SEARCH
========================================================== */
async function runFullSearch(query) {
    if (emptyMsg) {
        emptyMsg.style.display = "block";
        emptyMsg.innerText = "Searching...";
    }

    clearAllSections();

    try {
        const [jamRes, hindiRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/music/search?q=${encodeURIComponent(query)}`).then(r => r.json()),
            fetch(`${BACKEND_URL}/api/music/hindi?q=${encodeURIComponent(query)}`).then(r => r.json())
        ]);

        // -------------------------------
        // MAP JAMENDO SONGS
        // -------------------------------
        const jamSongs = (jamRes.songs || []).map(s => ({
            title: s.title,
            artist: s.artist,
            cover: s.cover || "playlist.jpg",
            audioUrl: s.audioUrl,
            source: "jamendo"
        }));

        // -------------------------------
        // MAP HINDI SONGS (Saavn)
        // -------------------------------
        const hindiSongs = (hindiRes.songs || []).map(s => ({
            title: s.name,
            artist: s.primaryArtists,
            cover: s.image?.[2]?.url || "playlist.jpg",
            audioUrl: getBestHindiAudio(s.downloadUrl),
            source: "hindi"
        }));

        combinedSongs = [...jamSongs, ...hindiSongs];

        if (!combinedSongs.length) {
            if (emptyMsg) {
                emptyMsg.innerText = "No results found.";
            }
            return;
        }

        if (emptyMsg) emptyMsg.style.display = "none";

        // Render UI Sections
        renderTopResult(combinedSongs, query);
        renderArtists(combinedSongs);
        renderAlbums(combinedSongs);
        renderSongs(combinedSongs);
        renderPlaylists(combinedSongs, query);

    } catch (err) {
        console.error("SEARCH ERROR:", err);
        if (emptyMsg) {
            emptyMsg.style.display = "block";
            emptyMsg.innerText = "Something went wrong.";
        }
    }
}

/* ==========================================================
   CLEAR ALL
========================================================== */
function clearAllSections() {
    if (topResultDiv) topResultDiv.innerHTML = "";
    if (artistSection) artistSection.innerHTML = "";
    if (albumSection) albumSection.innerHTML = "";
    if (songSection) songSection.innerHTML = "";
    if (playlistSection) playlistSection.innerHTML = "";

    if (topResultSection) topResultSection.style.display = "none";
    if (artistSectionWrapper) artistSectionWrapper.style.display = "none";
    if (albumSectionWrapper) albumSectionWrapper.style.display = "none";
    if (songSectionWrapper) songSectionWrapper.style.display = "none";
    if (playlistSectionWrapper) playlistSectionWrapper.style.display = "none";
}

/* ==========================================================
   TOP RESULT (Spotify Style)
========================================================== */
function renderTopResult(list, q) {
    if (!topResultDiv || !topResultSection) return;

    const lower = q.toLowerCase();

    let best =
        list.find(s => s.artist?.toLowerCase().includes(lower)) ||
        list.find(s => s.title?.toLowerCase().includes(lower)) ||
        list[0];

    if (!best) return;

    topResultSection.style.display = "block";

    topResultDiv.innerHTML = `
        <div class="top-result">
            <img src="${best.cover}">
            <div class="top-result-info">
                <h3>${best.artist || best.title}</h3>
                <p>${best.source === 'hindi' ? 'Hindi Artist' : 'Global Artist'}</p>

                <div class="chips-row">
                    <span class="chip">${q}</span>
                    <span class="chip">${best.source === 'hindi' ? "Hindi" : "Global"}</span>
                </div>
            </div>
            <button onclick="playTop('${best.title}', '${best.artist}')">
                Play
            </button>
        </div>
    `;
}

window.playTop = (title, artist) => {
    alert(`Play: ${title} - ${artist}`);
};

/* ==========================================================
   ARTISTS
========================================================== */
function renderArtists(list) {
    if (!artistSection || !artistSectionWrapper) return;

    const artists = [...new Set(list.map(s => s.artist).filter(Boolean))];

    if (!artists.length) return;

    artistSectionWrapper.style.display = "block";
    artistSection.innerHTML = "";

    artists.slice(0, 10).forEach(a => {
        const one = list.find(s => s.artist === a);

        artistSection.innerHTML += `
            <div class="card" onclick="openArtist('${a}')">
                <img src="${one.cover}">
                <p class="card-title">${a}</p>
                <p class="card-sub">Artist</p>
            </div>
        `;
    });
}

window.openArtist = (name) => {
    window.location.href = `artist.html?artist=${encodeURIComponent(name)}`;
};

/* ==========================================================
   ALBUMS (Artist Mix)
========================================================== */
function renderAlbums(list) {
    if (!albumSection || !albumSectionWrapper) return;

    const grouped = groupBy(list, s => s.artist || "Unknown");

    const albums = Object.keys(grouped).map(artist => ({
        title: `${artist} Mix`,
        artist,
        cover: grouped[artist][0].cover
    }));

    if (!albums.length) return;

    albumSectionWrapper.style.display = "block";
    albumSection.innerHTML = "";

    albums.slice(0, 10).forEach(a => {
        albumSection.innerHTML += `
            <div class="card">
                <img src="${a.cover}">
                <p class="card-title">${a.title}</p>
                <p class="card-sub">${a.artist}</p>
            </div>
        `;
    });
}

/* ==========================================================
   SONGS
========================================================== */
function renderSongs(list) {
    if (!songSection || !songSectionWrapper) return;

    songSectionWrapper.style.display = "block";
    songSection.innerHTML = "";

    list.slice(0, 20).forEach(s => {
        songSection.innerHTML += `
            <div class="card">
                <img src="${s.cover}">
                <p class="card-title">${s.title}</p>
                <p class="card-sub">${s.artist}</p>
            </div>
        `;
    });
}

/* ==========================================================
   PLAYLISTS (Auto)
========================================================== */
function renderPlaylists(list, q) {
    if (!playlistSection || !playlistSectionWrapper) return;

    playlistSectionWrapper.style.display = "block";
    playlistSection.innerHTML = "";

    const cover = list[0].cover;

    playlistSection.innerHTML += `
        <div class="card">
            <img src="${cover}">
            <p class="card-title">${q} Mix</p>
            <p class="card-sub">Auto Playlist</p>
        </div>
    `;

    const hindi = list.find(x => x.source === "hindi");
    if (hindi) {
        playlistSection.innerHTML += `
            <div class="card">
                <img src="${hindi.cover}">
                <p class="card-title">Desi Mix for ${q}</p>
                <p class="card-sub">Hindi Selection</p>
            </div>
        `;
    }
}

/* ==========================================================
   HELPERS
========================================================== */
function groupBy(arr, keyFn) {
    return arr.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
}

function getBestHindiAudio(list) {
    if (!list) return "";
    const q320 = list.find(x => x.quality === "320kbps");
    const q160 = list.find(x => x.quality === "160kbps");
    return (q320?.url || q160?.url || list[0]?.url || "");
}
