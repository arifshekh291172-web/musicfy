//----------------------------------
// CONFIG
//----------------------------------
const BACKEND_URL = "https://musicfy-jkhs.onrender.com";

//----------------------------------
// GLOBAL VARIABLES
//----------------------------------
const token = localStorage.getItem("musicfy_token");
console.log("TOKEN =", token);

let isPremium = false;
let currentSongId = null;
let songQueue = [];
let currentIndex = -1;
let repeatMode = "off";

const JAMENDO_CLIENT_ID = "ad0706b4";
const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";

let userPlaylistsCache = [];
let isSeekingMini = false;
let isSeekingFs = false;

//----------------------------------
// LOGIN CHECK
//----------------------------------
function requireLogin() {
    if (!token) {
        alert("Please login to play songs.");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

//----------------------------------
// ELEMENT REFERENCES
//----------------------------------
const searchInput = document.querySelector(".search");

// Auth UI
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const loggedInProfile = document.getElementById("loggedInProfile");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const premiumBadge = document.getElementById("premiumBadge");

// Navigation
const backBtn = document.getElementById("backBtn");
const forwardBtn = document.getElementById("forwardBtn");

// Mobile menu
const mobileMenu = document.getElementById("mobileMenu");
const menuToggle = document.getElementById("menuToggle");
const closeMobileMenu = document.getElementById("closeMobileMenu");
const mobileSignup = document.getElementById("mobileSignup");
const mobileLogin = document.getElementById("mobileLogin");

// Header / mini-player
const header = document.getElementById("mainHeader");
const miniPlayerEl = document.getElementById("miniPlayer");

// Optional buffering overlay (if you add in HTML)
// <div id="bufferingOverlay"><div class="loader"></div></div>
const bufferingOverlay = document.getElementById("bufferingOverlay");

//----------------------------------
// MOBILE MENU TOGGLE (Safe)
//----------------------------------
if (menuToggle && mobileMenu) {
    menuToggle.onclick = () => {
        mobileMenu.classList.add("open");
    };
}
if (closeMobileMenu && mobileMenu) {
    closeMobileMenu.onclick = () => {
        mobileMenu.classList.remove("open");
    };
}
if (mobileSignup) {
    mobileSignup.onclick = () => (window.location.href = "register.html");
}
if (mobileLogin) {
    mobileLogin.onclick = () => (window.location.href = "login.html");
}

//----------------------------------
// SHOW LOGGED-IN UI
//----------------------------------
function showLoggedInUI(name) {
    if (signupBtn) signupBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "none";
    if (loggedInProfile) loggedInProfile.style.display = "flex";
    if (userNameEl) userNameEl.innerText = name;
}

//----------------------------------
// FETCH CURRENT USER
//----------------------------------
if (token) {
    fetch(`${BACKEND_URL}/api/me`, {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            if (data && data.success && data.user) {
                showLoggedInUI(data.user.fullName || "User");
                checkPremiumStatus();
                loadRecent();
                loadPlaylists();
            }
        })
        .catch(err => console.log("ME ERROR:", err));
}

//----------------------------------
// LOGOUT
//----------------------------------
if (logoutBtn) {
    logoutBtn.onclick = () => {
        localStorage.clear();
        location.reload();
    };
}

//----------------------------------
// BROWSER NAVIGATION (optional)
//----------------------------------
if (backBtn) backBtn.onclick = () => window.history.back();
if (forwardBtn) forwardBtn.onclick = () => window.history.forward();

//----------------------------------
// SPOTIFY-STYLE SEARCH ENGINE
//----------------------------------
if (searchInput) {
    // ENTER PRESS → Go to search.html
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = searchInput.value.trim();
            if (!q) return;
            window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
    });

    // LIVE SEARCH PREVIEW
    searchInput.addEventListener("input", async () => {
        const q = searchInput.value.trim().toLowerCase();

        if (q.length < 2) {
            hideSearchPreview();
            return loadSongs();
        }

        const hindiKeywords = [
            "arijit", "armaan", "atif", "jubin", "kishore", "udit",
            "kumar", "shreya", "sonu", "hindi", "bollywood", "punjabi",
            "desi", "rahman", "diljit", "arjit"
        ];

        try {
            if (hindiKeywords.some(k => q.includes(k))) {
                showSearchPreview("Searching Hindi songs…");
                const results = await searchHindi(q);
                return renderSearchPreview(results.slice(0, 5));
            }

            showSearchPreview("Searching…");
            const results = await searchEnglish(q);
            renderSearchPreview(results.slice(0, 5));
        } catch (err) {
            console.log("LIVE SEARCH ERROR:", err);
            hideSearchPreview();
        }
    });
}

//----------------------------------
// PREVIEW POPUP UI
//----------------------------------
function showSearchPreview(text) {
    let box = document.getElementById("searchPreviewBox");
    if (!box) {
        box = document.createElement("div");
        box.id = "searchPreviewBox";
        box.className = "search-preview";
        document.body.appendChild(box);
    }
    box.style.display = "block";
    box.innerHTML = `<p>${text}</p>`;
}

function hideSearchPreview() {
    const box = document.getElementById("searchPreviewBox");
    if (box) box.style.display = "none";
}

function renderSearchPreview(list) {
    let box = document.getElementById("searchPreviewBox");
    if (!box) return;

    if (!list.length) {
        box.innerHTML = "<p>No results</p>";
        return;
    }

    box.innerHTML = list
        .map(s => `
            <div class="preview-item" onclick="openSongFromPreview('${s._id}')">
                <img src="${s.cover}" class="preview-thumb">
                <div class="preview-text">
                    <p><b>${s.title}</b></p>
                    <p class="small">${s.artist}</p>
                </div>
            </div>
        `).join("");
}

// CLICK FROM PREVIEW → PLAY SONG
window.openSongFromPreview = function (id) {
    hideSearchPreview();

    const index = songQueue.findIndex(s => s._id === id);
    if (index !== -1) return playByIndex(index);

    alert("Song loaded from search results. Play from full search page.");
};

//----------------------------------
// ENGLISH SEARCH (Jamendo)
//----------------------------------
async function searchEnglish(q) {
    const res = await fetch(
        `${BACKEND_URL}/api/music/search?q=${encodeURIComponent(q)}`
    );
    const data = await res.json();
    songQueue = data.songs || [];
    return data.songs || [];
}

//----------------------------------
// HINDI SEARCH (JioSaavn)
//----------------------------------
async function searchHindi(q) {
    const res = await fetch(
        `${BACKEND_URL}/api/music/hindi?q=${encodeURIComponent(q)}`
    );

    const data = await res.json();

    return (data.songs || []).map(s => ({
        _id: s.id,
        title: s.name,
        artist: s.primaryArtists,
        cover: s.image?.[2]?.url,
        audioUrl: s.downloadUrl?.[0]?.url || "",
        source: "hindi"
    }));
}

//----------------------------------
// SUGGEST BOX (Typeahead Artist/Song)
//----------------------------------
const suggestBox = document.getElementById("suggestBox");

if (searchInput && suggestBox) {
    searchInput.addEventListener("input", async function () {
        const q = this.value.trim();

        if (q.length < 1) {
            suggestBox.style.display = "none";
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/music/suggest?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            if (!data.suggestions || !data.suggestions.length) {
                suggestBox.style.display = "none";
                return;
            }

            suggestBox.style.display = "block";
            suggestBox.innerHTML = "";

            data.suggestions.forEach(item => {
                suggestBox.innerHTML += `
                    <div class="suggest-item" onclick="selectSuggestion('${item.name}')">
                        ${item.name}
                    </div>
                `;
            });
        } catch (err) {
            console.log("SUGGEST ERROR:", err);
            suggestBox.style.display = "none";
        }
    });
}

window.selectSuggestion = function (name) {
    if (searchInput) searchInput.value = name;
    if (suggestBox) suggestBox.style.display = "none";
    window.location.href = `search.html?q=${encodeURIComponent(name)}`;
};

//----------------------------------
// FORMAT SONG TIME
//----------------------------------
function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

//----------------------------------
// SONG CARD TEMPLATE
//----------------------------------
function createSongCardHTML(song, index) {
    const safeId = song._id || `song-${index}`;
    const isFav = favouriteSongs.includes(safeId);

    return `
    <div class="song-card" data-id="${safeId}">
        <button class="fav-btn ${isFav ? "active" : ""}"
            onclick="event.stopPropagation(); toggleFavourite('${safeId}', this)">
            ❤️
        </button>

        <button class="more-btn" onclick="openMoreMenu('${safeId}', event)">⋮</button>
        <div class="more-menu" id="menu-${safeId}">
            <p onclick="addToPlaylist('${safeId}')">Add to Playlist</p>
            <p onclick="removeFromPlaylist('${safeId}')">Remove from Playlist</p>
        </div>

        <div class="song-thumb" onclick="playByIndex(${index})">
            <img src="${song.cover}" class="song-cover">
            <button class="hover-play-btn"
                onclick="event.stopPropagation(); playByIndex(${index});">▶</button>
        </div>

        <p><b>${song.title}</b></p>
        <p class="small">${song.artist}</p>
    </div>`;
}

// STUBS (अगर बाद में implement करना हो तो बदल देना)
window.addToPlaylist = function (id) {
    alert("Add to Playlist UI abhi implement karna hai (playlist page se).");
};
window.removeFromPlaylist = function (id) {
    alert("Remove from Playlist UI abhi implement karna hai (playlist page se).");
};

//----------------------------------
// CLOSE ALL 3 DOT MENUS
//----------------------------------
function closeAllMoreMenus() {
    document.querySelectorAll(".more-menu").forEach(m => m.style.display = "none");
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".more-btn") && !e.target.closest(".more-menu")) {
        closeAllMoreMenus();
    }
});

// OPEN SPECIFIC SONG MENU
window.openMoreMenu = function (id, event) {
    event.stopPropagation();
    closeAllMoreMenus();

    const menu = document.getElementById(`menu-${id}`);
    if (menu) menu.style.display = "block";
};

//----------------------------------
// LOAD TRENDING SONGS (Jamendo)
//----------------------------------
function loadSongs() {
    const songsDiv = document.getElementById("songsContainer");
    if (!songsDiv) return;
    songsDiv.innerHTML = `<p style="color:#b3b3b3;">Loading songs...</p>`;

    const url =
        `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
        `&format=json&audioformat=mp32&imagesize=300&limit=25&order=popularity_total`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            songsDiv.innerHTML = "";
            const results = data.results || [];

            songQueue = results.map(t => ({
                _id: t.id,
                title: t.name,
                artist: t.artist_name,
                cover: t.album_image,
                audioUrl: t.audio,
                source: "jamendo"
            }));

            results.forEach((track, index) => {
                songsDiv.innerHTML += createSongCardHTML({
                    _id: track.id,
                    title: track.name,
                    artist: track.artist_name,
                    cover: track.album_image
                }, index);
            });
        })
        .catch(err => {
            songsDiv.innerHTML = `<p style="color:red;">Error loading songs</p>`;
            console.error("SONG LOAD ERROR:", err);
        });
}

// पहली बार load
loadSongs();

//----------------------------------
// MINI & FULLSCREEN PLAYER ELEMENTS
//----------------------------------
const audio = document.getElementById("audio");

// Mini player
const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const playerCover = document.getElementById("playerCover");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const seekBar = document.getElementById("seekBar");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");

// Fullscreen player
const fsPlayer = document.getElementById("fullscreenPlayer");
const fsCover = document.getElementById("fsCover");
const fsTitle = document.getElementById("fsTitle");
const fsArtist = document.getElementById("fsArtist");
const fsSeekBar = document.getElementById("fsSeekBar");
const fsPlayBtn = document.getElementById("fsPlayBtn");
const fsPrevBtn = document.getElementById("fsPrevBtn");
const fsNextBtn = document.getElementById("fsNextBtn");
const closeFullscreenBtn = document.getElementById("closeFullscreenBtn");
const openFullscreenBtn = document.getElementById("openFullscreenBtn");

//----------------------------------
// BUFFERING OVERLAY
//----------------------------------
function showBuffering() {
    if (bufferingOverlay) bufferingOverlay.style.display = "flex";
    if (miniPlayerEl) miniPlayerEl.classList.add("seeking");
}

function hideBuffering() {
    if (bufferingOverlay) bufferingOverlay.style.display = "none";
    if (miniPlayerEl) miniPlayerEl.classList.remove("seeking");
}

//----------------------------------
// UI STATE (PLAYING / PAUSED)
//----------------------------------
function setPlayingUI(isPlaying) {
    document.body.classList.toggle("playing", isPlaying);
    if (miniPlayerEl) miniPlayerEl.classList.toggle("playing", isPlaying);
    if (fsPlayer) fsPlayer.classList.toggle("playing", isPlaying);
}

//----------------------------------
// PLAY SONG BY INDEX
//----------------------------------
window.playByIndex = function (index) {
    if (!requireLogin()) return;

    const s = songQueue[index];
    if (!s) return;

    currentIndex = index;
    currentSongId = s._id;

    showBuffering();
    playBtn.innerText = "⏳";
    fsPlayBtn.innerText = "⏳";

    audio.src = s.audioUrl;

    // Mini player UI
    playerTitle.innerText = s.title;
    playerArtist.innerText = s.artist;
    playerCover.src = s.cover;

    // Fullscreen UI
    fsCover.src = s.cover;
    fsTitle.innerText = s.title;
    fsArtist.innerText = s.artist;

    audio.play()
        .then(() => {
            playBtn.innerText = "⏸️";
            fsPlayBtn.innerText = "⏸️";
            setPlayingUI(true);
            hideBuffering();
        })
        .catch(() => {
            playBtn.innerText = "▶️";
            fsPlayBtn.innerText = "▶️";
            setPlayingUI(false);
            hideBuffering();
        });

    saveRecent(currentSongId);
};

//----------------------------------
// PLAY RECENT SONG
//----------------------------------
window.playRecent = function (songId) {
    if (!requireLogin()) return;

    const index = songQueue.findIndex(s => s._id === songId);
    if (index !== -1) return playByIndex(index);

    fetch(`${BACKEND_URL}/api/music/allsongs`)
        .then(r => r.json())
        .then(d => {
            songQueue = d.songs || [];
            const idx = songQueue.findIndex(s => s._id == songId);
            if (idx !== -1) playByIndex(idx);
        });
};

//----------------------------------
// SAVE RECENT
//----------------------------------
function saveRecent(songId) {
    if (!token) return;

    fetch(`${BACKEND_URL}/api/music/recent/add`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ songId })
    })
        .then(() => loadRecent())
        .catch(err => console.log("RECENT SAVE ERROR:", err));
}

//----------------------------------
// AUDIO EVENTS
//----------------------------------
audio.addEventListener("waiting", () => {
    showBuffering();
    playBtn.innerText = "⏳";
    fsPlayBtn.innerText = "⏳";
});

audio.addEventListener("playing", () => {
    hideBuffering();
    playBtn.innerText = "⏸️";
    fsPlayBtn.innerText = "⏸️";
    setPlayingUI(true);
});

audio.addEventListener("pause", () => {
    playBtn.innerText = "▶️";
    fsPlayBtn.innerText = "▶️";
    setPlayingUI(false);
});

audio.addEventListener("loadedmetadata", () => {
    seekBar.max = audio.duration;
    fsSeekBar.max = audio.duration;
    totalTimeEl.innerText = formatTime(audio.duration);
});

audio.ontimeupdate = () => {
    if (!audio.duration) return;

    if (!isSeekingMini) seekBar.value = audio.currentTime;
    if (!isSeekingFs) fsSeekBar.value = audio.currentTime;

    currentTimeEl.innerText = formatTime(audio.currentTime);
};

audio.onended = () => {
    hideBuffering();
    setPlayingUI(false);
    nextSong();
};

//----------------------------------
// SEEK BAR CONTROL
//----------------------------------
seekBar.addEventListener("input", () => {
    isSeekingMini = true;
    audio.currentTime = seekBar.value;
    showBuffering();
});

seekBar.addEventListener("change", () => {
    isSeekingMini = false;
    hideBuffering();
});

// FULLSCREEN SEEKBAR
fsSeekBar.addEventListener("input", () => {
    isSeekingFs = true;
    audio.currentTime = fsSeekBar.value;
    showBuffering();
});

fsSeekBar.addEventListener("change", () => {
    isSeekingFs = false;
    hideBuffering();
});

//----------------------------------
// PLAY / PAUSE TOGGLE
//----------------------------------
function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸️";
        fsPlayBtn.innerText = "⏸️";
        setPlayingUI(true);
    } else {
        audio.pause();
        playBtn.innerText = "▶️";
        fsPlayBtn.innerText = "▶️";
        setPlayingUI(false);
    }
}

playBtn.onclick = togglePlay;
fsPlayBtn.onclick = togglePlay;

//----------------------------------
// NEXT / PREVIOUS / SHUFFLE / REPEAT
//----------------------------------
window.nextSong = function () {
    if (repeatMode === "one") return playByIndex(currentIndex);

    if (currentIndex < songQueue.length - 1) {
        playByIndex(currentIndex + 1);
    } else if (repeatMode === "all") {
        playByIndex(0);
    }
};

window.prevSong = function () {
    if (currentIndex > 0) playByIndex(currentIndex - 1);
};

window.shuffleSong = function () {
    const rand = Math.floor(Math.random() * songQueue.length);
    playByIndex(rand);
};

window.toggleRepeat = function () {
    repeatMode =
        repeatMode === "off" ? "one" :
            repeatMode === "one" ? "all" : "off";

    repeatBtn.innerText =
        repeatMode === "off" ? "🔁" :
            repeatMode === "one" ? "1️⃣" : "🔂";
};

//----------------------------------
// FULLSCREEN PLAYER OPEN/CLOSE
//----------------------------------
if (openFullscreenBtn && fsPlayer) {
    openFullscreenBtn.onclick = () => (fsPlayer.style.display = "flex");
}
if (closeFullscreenBtn && fsPlayer) {
    closeFullscreenBtn.onclick = () => (fsPlayer.style.display = "none");
}

if (fsPrevBtn) fsPrevBtn.onclick = () => prevSong();
if (fsNextBtn) fsNextBtn.onclick = () => nextSong();

//----------------------------------
// PLAYLIST POPUP
//----------------------------------
const addPlaylistBtn = document.getElementById("addPlaylistBtn");
const createPlaylistPopup = document.getElementById("createPlaylistPopup");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const cancelCreatePlaylist = document.getElementById("cancelCreatePlaylist");
const newPlaylistName = document.getElementById("newPlaylistName");

// CREATE PLAYLIST POPUP OPEN
if (addPlaylistBtn && createPlaylistPopup) {
    addPlaylistBtn.onclick = () => {
        if (!requireLogin()) return;
        createPlaylistPopup.style.display = "flex";
    };
}

if (cancelCreatePlaylist && createPlaylistPopup) {
    cancelCreatePlaylist.onclick = () => {
        createPlaylistPopup.style.display = "none";
    };
}

//----------------------------------
// CREATE PLAYLIST
//----------------------------------
if (createPlaylistBtn && newPlaylistName) {
    createPlaylistBtn.onclick = () => {
        const name = newPlaylistName.value.trim();
        if (!name) return alert("Enter playlist name!");

        const exists = userPlaylistsCache.some(
            p => p.name.toLowerCase() === name.toLowerCase()
        );

        if (exists) return alert("Playlist already exists!");

        fetch(`${BACKEND_URL}/api/music/playlist/create`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        })
            .then(r => r.json())
            .then(d => {
                if (!d.success) return alert("Failed to create playlist");

                createPlaylistPopup.style.display = "none";
                newPlaylistName.value = "";
                loadPlaylists();
                loadSidebarPlaylists();
            });
    };
}

//----------------------------------
// GLOBAL FAVOURITE VARIABLES
//----------------------------------
let favouritePlaylistId = null;
let favouriteSongs = [];

//----------------------------------
// LOAD PLAYLISTS (MAIN)
//----------------------------------
function loadPlaylists() {
    if (!token) return;

    fetch(`${BACKEND_URL}/api/music/playlist/my`, {
        headers: { Authorization: "Bearer " + token }
    })
        .then(r => r.json())
        .then(data => {
            userPlaylistsCache = data.playlists || [];

            const div = document.getElementById("playlistContainer");
            if (!div) return;
            div.innerHTML = "";

            userPlaylistsCache.forEach(pl => {
                div.innerHTML += `
                <div class="song-card">
                    <button class="more-btn" onclick="openPlaylistMenu(event, '${pl._id}')">⋮</button>

                    <div class="more-menu" id="playlist-menu-${pl._id}">
                        <p onclick="renamePlaylist('${pl._id}')">Rename</p>
                        <p onclick="deletePlaylist('${pl._id}')">Delete</p>
                    </div>

                    <img src="playlist.jpg" class="song-cover" onclick="openPlaylist('${pl._id}')">
                    <p><b>${pl.name}</b></p>
                    <p class="small">${pl.songs.length} songs</p>
                </div>`;
            });

            detectFavouritePlaylist();
            loadSidebarPlaylists();
        })
        .catch(err => console.log("PLAYLIST LOAD ERROR:", err));
}

// PLAYLIST MENU OPEN
window.openPlaylistMenu = function (event, playlistId) {
    event.stopPropagation();
    // close others
    document.querySelectorAll(".more-menu").forEach(m => (m.style.display = "none"));
    const menu = document.getElementById(`playlist-menu-${playlistId}`);
    if (menu) menu.style.display = "block";
};

//----------------------------------
// DETECT / CREATE FAVOURITE PLAYLIST
//----------------------------------
function detectFavouritePlaylist() {
    const favPlaylist = userPlaylistsCache.find(p => p.name === "Favourites");

    if (favPlaylist) {
        favouritePlaylistId = favPlaylist._id;
        favouriteSongs = favPlaylist.songs.map(s => s._id);

        const favCover = favPlaylist.songs.length
            ? favPlaylist.songs[0].cover
            : "playlist.jpg";

        const favImg = document.getElementById("favImg");
        const favTitle = document.getElementById("favTitle");
        const favCard = document.getElementById("favouriteCard");

        if (favImg) favImg.src = favCover;
        if (favTitle) favTitle.innerText = `Favourites (${favPlaylist.songs.length})`;
        if (favCard) {
            favCard.style.display = "block";
            favCard.onclick = () => {
                localStorage.setItem("current_playlist_id", favouritePlaylistId);
                window.location = "playlist.html";
            };
        }
    } else if (token) {
        // auto create Favourites playlist
        fetch(`${BACKEND_URL}/api/music/playlist/create`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: "Favourites" })
        })
            .then(() => loadPlaylists())
            .catch(err => console.log("AUTO FAV CREATE ERROR:", err));
    }
}

//----------------------------------
// FAVOURITE TOGGLE
//----------------------------------
window.toggleFavourite = function (songId, btn) {
    if (!favouritePlaylistId) return alert("Favourites loading...");

    const isFav = favouriteSongs.includes(songId);
    const endpoint = isFav ? "remove" : "add";

    fetch(`${BACKEND_URL}/api/music/playlist/${endpoint}`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId: favouritePlaylistId, songId })
    })
        .then(r => r.json())
        .then(d => {
            if (!d.success) return alert("Error updating favourites");

            if (isFav) {
                favouriteSongs = favouriteSongs.filter(id => id !== songId);
                btn.classList.remove("active");
            } else {
                favouriteSongs.push(songId);
                btn.classList.add("active");
                btn.classList.add("pop");
                setTimeout(() => btn.classList.remove("pop"), 300);
            }

            loadPlaylists();
        })
        .catch(err => console.log("FAVOURITE TOGGLE ERROR:", err));
};

//----------------------------------
// SIDEBAR PLAYLIST LIST
//----------------------------------
function loadSidebarPlaylists() {
    const sidebar = document.querySelector(".scroll");
    if (!sidebar) return;

    let html = `<h4>Your Playlists</h4>`;

    if (!userPlaylistsCache.length) {
        html += `<p>No playlists.</p>`;
    } else {
        userPlaylistsCache.forEach(pl => {
            html += `
                <p class="sidebar-pl" onclick="openPlaylist('${pl._id}')">
                    • ${pl.name}
                </p>`;
        });
    }

    sidebar.innerHTML = html;
}

//----------------------------------
// RENAME PLAYLIST
//----------------------------------
window.renamePlaylist = function (playlistId) {
    let newname = prompt("Enter new name:");
    if (!newname) return;

    const exists = userPlaylistsCache.some(
        p => p.name.toLowerCase() === newname.toLowerCase()
    );
    if (exists) return alert("Name already used!");

    fetch(`${BACKEND_URL}/api/music/playlist/rename`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId, newname })
    })
        .then(() => {
            alert("Playlist renamed.");
            loadPlaylists();
        })
        .catch(err => console.log("RENAME ERROR:", err));
};

//----------------------------------
// DELETE PLAYLIST
//----------------------------------
window.deletePlaylist = function (playlistId) {
    if (!confirm("Delete this playlist?")) return;

    fetch(`${BACKEND_URL}/api/music/playlist/delete`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId })
    })
        .then(() => {
            alert("Playlist deleted.");
            loadPlaylists();
        })
        .catch(err => console.log("DELETE PLAYLIST ERROR:", err));
};

//----------------------------------
// OPEN PLAYLIST PAGE
//----------------------------------
window.openPlaylist = function (playlistId) {
    localStorage.setItem("current_playlist_id", playlistId);
    window.location.href = "playlist.html";
};

//----------------------------------
// INIT APP (DOMContentLoaded)
//----------------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (token) {
        loadSongs();
        loadPlaylists();
        loadRecent();
        checkPremiumStatus();
    } else {
        loadSongs();
    }
});

//----------------------------------
// PREMIUM STATUS CHECK
//----------------------------------
function checkPremiumStatus() {
    if (!token) return;

    fetch(`${BACKEND_URL}/api/premium/check`, {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            // premiumRoutes.js: { premium: true/false, plan, expiry }
            if (data && data.premium) {
                isPremium = true;
                if (premiumBadge) {
                    premiumBadge.style.display = "inline-block";
                    premiumBadge.innerText = "PREMIUM";
                }
            } else {
                isPremium = false;
            }
        })
        .catch(err => console.log("Premium Check Error:", err));
}

//----------------------------------
// LOAD RECENT SONGS
//----------------------------------
function loadRecent() {
    if (!token) return;

    fetch(`${BACKEND_URL}/api/music/recent`, {
        headers: { Authorization: "Bearer " + token }
    })
        .then(r => r.json())
        .then(d => {
            const div = document.getElementById("recentContainer");
            if (!div) return;

            div.innerHTML = "";

            if (!d.success || !d.recent || d.recent.length === 0) {
                div.innerHTML = "<p style='color:#bbb;'>No recently played songs.</p>";
                return;
            }

            // यहां songQueue को recent से overwrite नहीं कर रहे,
            // बस कार्ड बना रहे हैं, playRecent अलग से handle करेगा
            d.recent.forEach((song, index) => {
                div.innerHTML += createSongCardHTML({
                    _id: song._id,
                    title: song.title,
                    artist: song.artist,
                    cover: song.cover
                }, index);
            });
        })
        .catch(err => console.log("Recent Load Error:", err));

}

console.log("Musicfy index.js fully loaded.");
