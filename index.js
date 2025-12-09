//----------------------------------
// GLOBAL VARIABLES
//----------------------------------
const token = localStorage.getItem("musicfy_token");
console.log("TOKEN FROM LOCALSTORAGE =", token);

let isPremium = false;
let currentSongId = null;
let songQueue = [];
let currentIndex = -1;
let repeatMode = "off";

// Jamendo Royalty-Free Trending Songs
const JAMENDO_CLIENT_ID = "ad0706b4";
const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";

// Playlists cache (for Add/Remove)
let userPlaylistsCache = [];

// Seek flags
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

// Header
const header = document.getElementById("mainHeader");

// Mini Player
const audio = document.getElementById("audio");
const playerTitle = document.getElementById("playerTitle");
const playerArtist = document.getElementById("playerArtist");
const playerCover = document.getElementById("playerCover");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const seekBar = document.getElementById("seekBar");
const lyricsBtn = document.getElementById("lyricsBtn");
const openFullscreenBtn = document.getElementById("openFullscreenBtn");
const miniPlayerEl = document.getElementById("miniPlayer");

// Mini timer labels (HTML mein already present)
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");

// Fullscreen Player
const fsPlayer = document.getElementById("fullscreenPlayer");
const fsCover = document.getElementById("fsCover");
const fsTitle = document.getElementById("fsTitle");
const fsArtist = document.getElementById("fsArtist");
const fsSeekBar = document.getElementById("fsSeekBar");
const fsPlayBtn = document.getElementById("fsPlayBtn");
const fsPrevBtn = document.getElementById("fsPrevBtn");
const fsNextBtn = document.getElementById("fsNextBtn");
const closeFullscreenBtn = document.getElementById("closeFullscreenBtn");

// Playlist Popup
const addPlaylistBtn = document.getElementById("addPlaylistBtn");
const createPlaylistPopup = document.getElementById("createPlaylistPopup");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
const cancelCreatePlaylist = document.getElementById("cancelCreatePlaylist");
const newPlaylistName = document.getElementById("newPlaylistName");


//----------------------------------
// TIME FORMATTER
//----------------------------------
function formatTime(sec) {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}


//----------------------------------
// GLOBAL BUFFERING OVERLAY (DYNAMIC)
//----------------------------------
const bufferingOverlay = document.createElement("div");
bufferingOverlay.id = "bufferingOverlay";
bufferingOverlay.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 14px;
    background: rgba(0,0,0,0.75);
    color: #fff;
    border-radius: 999px;
    font-size: 12px;
    display: none;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
`;
const bufferingSpinner = document.createElement("div");
bufferingSpinner.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #fff;
    border-top-color: transparent;
    animation: musicfySpin 0.7s linear infinite;
`;
const bufferingText = document.createElement("span");
bufferingText.textContent = "Buffering...";
bufferingOverlay.appendChild(bufferingSpinner);
bufferingOverlay.appendChild(bufferingText);
document.body.appendChild(bufferingOverlay);

// inject keyframes for spinner
const styleEl = document.createElement("style");
styleEl.innerHTML = `
@keyframes musicfySpin {
    to { transform: rotate(360deg); }
}
`;
document.head.appendChild(styleEl);

function showBuffering() {
    bufferingOverlay.style.display = "flex";
    if (miniPlayerEl) miniPlayerEl.classList.add("seeking");
}

function hideBuffering() {
    bufferingOverlay.style.display = "none";
    if (miniPlayerEl) miniPlayerEl.classList.remove("seeking");
}

//----------------------------------
// PLAYING STATE UI (for animations)
//----------------------------------
function setPlayingUI(isPlaying) {
    if (miniPlayerEl) miniPlayerEl.classList.toggle("playing", isPlaying);
    if (fsPlayer) fsPlayer.classList.toggle("playing", isPlaying);
    document.body.classList.toggle("playing", isPlaying);
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

if (token) {
    fetch("https://musicfy-jkhs.onrender.com/api/me", {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            console.log("ME RESPONSE:", data);

            if (data.success) {
                showLoggedInUI(data.user.fullName);
                checkPremiumStatus();
                loadRecent();
                loadPlaylists();
            }
        })
        .catch(err => console.error("ME ERROR:", err));
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
// PREMIUM STATUS CHECK
//----------------------------------
function checkPremiumStatus() {
    if (!token) return;

    fetch("https://musicfy-jkhs.onrender.com/api/premium/status", {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            console.log("PREMIUM STATUS:", data);

            if (data.premium) {
                isPremium = true;
                if (userNameEl) userNameEl.innerText += " ⭐";
                if (premiumBadge) {
                    premiumBadge.textContent = "Premium Active";
                    premiumBadge.style.display = "block";
                }
            }
        })
        .catch(err => console.error("PREMIUM STATUS ERROR:", err));
}


//----------------------------------
// SONG CARD TEMPLATE (TOP-RIGHT MORE BUTTON + HOVER PLAY)
//----------------------------------
function createSongCardHTML(song, index) {
    const safeId = song._id || `jam-${index}`;

    return `
    <div class="song-card" data-song-id="${safeId}">
        <!-- More Button on Top Right -->
        <button class="more-btn" onclick="openMoreMenu('${safeId}', event)">⋮</button>

        <!-- More Menu -->
        <div class="more-menu" id="menu-${safeId}">
            <p onclick="addToPlaylist('${safeId}')">Add to Playlist</p>
            <p onclick="removeFromPlaylist('${safeId}')">Remove from Playlist</p>
        </div>

        <!-- Song Thumbnail -->
        <div class="song-thumb" onclick="playByIndex(${index})">
            <img src="${song.cover}" class="song-cover" alt="${song.title}">
            <!-- Hover Play Button -->
            <button class="hover-play-btn" onclick="event.stopPropagation(); playByIndex(${index});">
                ▶
            </button>
        </div>

        <p><b>${song.title}</b></p>
        <p class="small">${song.artist}</p>
    </div>
    `;
}


//----------------------------------
// CLOSE ALL MORE MENUS
//----------------------------------
function closeAllMoreMenus() {
    document.querySelectorAll(".more-menu").forEach(m => {
        m.style.display = "none";
    });
}

// Click outside closes menus
document.addEventListener("click", (e) => {
    if (!e.target.closest(".more-btn") && !e.target.closest(".more-menu")) {
        closeAllMoreMenus();
    }
});


//----------------------------------
// OPEN SPECIFIC MORE MENU
//----------------------------------
window.openMoreMenu = function (songId, event) {
    event.stopPropagation();
    closeAllMoreMenus();

    const menu = document.getElementById(`menu-${songId}`);
    if (menu) {
        menu.style.display = "block";
    }
};


//----------------------------------
// LOAD TRENDING SONGS (Jamendo)
//----------------------------------
function loadSongs() {
    const songsDiv = document.getElementById("songsContainer");
    if (!songsDiv) return;

    songsDiv.innerHTML = `<p style="color:#b3b3b3;">Loading trending songs...</p>`;

    const url =
        `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
        `&format=json&audioformat=mp32&imagesize=300&limit=30&order=popularity_total`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const results = (data && data.results) || [];
            songsDiv.innerHTML = "";

            songQueue = results.map(track => ({
                _id: track.id,
                title: track.name,
                artist: track.artist_name,
                cover: track.album_image,
                audioUrl: track.audio,
                source: "jamendo"
            }));

            results.forEach((track, index) => {
                const s = {
                    _id: track.id,
                    title: track.name,
                    artist: track.artist_name,
                    cover: track.album_image
                };
                songsDiv.innerHTML += createSongCardHTML(s, index);
            });
        })
        .catch(err => {
            songsDiv.innerHTML = `<p style="color:red;">Error loading songs.</p>`;
            console.error(err);
        });
}

loadSongs();


//----------------------------------
// BACKEND SEARCH
//----------------------------------
if (searchInput) {
    searchInput.addEventListener("input", function () {
        const q = this.value.trim();

        if (q.length < 2) {
            loadSongs();
            return;
        }

        fetch(`https://musicfy-jkhs.onrender.com/api/music/search?q=${encodeURIComponent(q)}`)
            .then(res => res.json())
            .then(data => {
                const songsDiv = document.getElementById("songsContainer");
                if (!songsDiv) return;

                songsDiv.innerHTML = "";

                songQueue = data.songs.map(s => ({ ...s, source: "backend" }));

                data.songs.forEach((s, index) => {
                    songsDiv.innerHTML += createSongCardHTML(s, index);
                });
            })
            .catch(err => console.error("SEARCH ERROR:", err));
    });
}


//----------------------------------
// PLAY SONG BY INDEX
//----------------------------------
window.playByIndex = function (index) {
    if (!requireLogin()) return;

    const s = songQueue[index];
    if (!s || !s.audioUrl) return;

    currentIndex = index;
    currentSongId = s._id;

    // show buffering state immediately
    playBtn.innerText = "⏳";
    fsPlayBtn.innerText = "⏳";
    showBuffering();

    audio.src = s.audioUrl;

    playerTitle.innerText = s.title;
    playerArtist.innerText = s.artist;
    playerCover.src = s.cover;

    fsCover.src = s.cover;
    fsTitle.innerText = s.title;
    fsArtist.innerText = s.artist;

    audio.play()
        .then(() => {
            playBtn.innerText = "⏸️";
            fsPlayBtn.innerText = "⏸️";
            hideBuffering();
            setPlayingUI(true);
        })
        .catch(() => {
            playBtn.innerText = "▶️";
            fsPlayBtn.innerText = "▶️";
            hideBuffering();
            setPlayingUI(false);
        });

    saveRecent(currentSongId);
};


//----------------------------------
// PLAY RECENT SONG
//----------------------------------
window.playRecent = function (songId) {
    if (!requireLogin()) return;

    const index = songQueue.findIndex(s => s._id == songId);
    if (index !== -1) return playByIndex(index);

    fetch("https://musicfy-jkhs.onrender.com/api/music/allsongs")
        .then(r => r.json())
        .then(d => {
            songQueue = d.songs.map(s => ({ ...s, source: "backend" }));
            const idx = songQueue.findIndex(s => s._id == songId);
            if (idx !== -1) playByIndex(idx);
        })
        .catch(err => console.error("PLAY RECENT ERROR:", err));
};


//----------------------------------
// SAVE RECENT
//----------------------------------
function saveRecent(songId) {
    if (!token) return;

    fetch("https://musicfy-jkhs.onrender.com/api/music/recent/add", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ songId })
    })
        .then(() => loadRecent())
        .catch(err => console.error("SAVE RECENT ERROR:", err));
}


//----------------------------------
// LOAD RECENT
//----------------------------------
function loadRecent() {
    const div = document.getElementById("recentContainer");
    if (!div) return;

    fetch("https://musicfy-jkhs.onrender.com/api/music/recent", {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success || !data.recent.length) {
                div.innerHTML = `<p style="color:#b3b3b3;">No recent songs.</p>`;
                return;
            }

            div.innerHTML = "";

            data.recent.forEach((song) => {
                div.innerHTML += `
                <div class="song-card" onclick="playRecent('${song._id}')">
                    <img src="${song.cover}" class="song-cover">
                    <p><b>${song.title}</b></p>
                    <p class="small">${song.artist}</p>
                </div>`;
            });
        })
        .catch(err => console.error("LOAD RECENT ERROR:", err));
}


//----------------------------------
// AUDIO EVENTS + SEEK BEHAVIOUR
//----------------------------------

// Buffering / Loading
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
    hideBuffering();
    playBtn.innerText = "▶️";
    fsPlayBtn.innerText = "▶️";
    setPlayingUI(false);
});

audio.addEventListener("loadedmetadata", () => {
    if (seekBar) seekBar.max = audio.duration || 0;
    if (fsSeekBar) fsSeekBar.max = audio.duration || 0;

    if (totalTimeEl) totalTimeEl.innerText = formatTime(audio.duration);
    hideBuffering();
});

audio.addEventListener("canplay", () => {
    hideBuffering();
});

audio.addEventListener("error", () => {
    hideBuffering();
    playBtn.innerText = "▶️";
    fsPlayBtn.innerText = "▶️";
    setPlayingUI(false);
});

audio.ontimeupdate = () => {
    if (!audio.duration) return;

    if (!isSeekingMini && seekBar) {
        seekBar.max = audio.duration;
        seekBar.value = audio.currentTime;
    }
    if (!isSeekingFs && fsSeekBar) {
        fsSeekBar.max = audio.duration;
        fsSeekBar.value = audio.currentTime;
    }

    if (currentTimeEl) currentTimeEl.innerText = formatTime(audio.currentTime);
};

audio.onended = () => {
    hideBuffering();
    setPlayingUI(false);
    nextSong();
};

// Mini seek
if (seekBar) {
    seekBar.addEventListener("input", () => {
        if (!audio.duration) return;
        isSeekingMini = true;
        audio.currentTime = seekBar.value;
        showBuffering();
    });
    seekBar.addEventListener("change", () => {
        isSeekingMini = false;
        hideBuffering();
    });

    // hover/focus animation hooks
    seekBar.addEventListener("focus", () => {
        if (miniPlayerEl) miniPlayerEl.classList.add("seek-focus");
    });
    seekBar.addEventListener("blur", () => {
        if (miniPlayerEl) miniPlayerEl.classList.remove("seek-focus");
    });
}

// Fullscreen seek
if (fsSeekBar) {
    fsSeekBar.addEventListener("input", () => {
        if (!audio.duration) return;
        isSeekingFs = true;
        audio.currentTime = fsSeekBar.value;
        showBuffering();
    });
    fsSeekBar.addEventListener("change", () => {
        isSeekingFs = false;
        hideBuffering();
    });
}


//----------------------------------
// PLAYER CONTROLS
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
    repeatMode = repeatMode === "off"
        ? "one"
        : repeatMode === "one"
            ? "all"
            : "off";

    if (repeatMode === "off") {
        repeatBtn.innerText = "🔁";
    } else if (repeatMode === "one") {
        repeatBtn.innerText = "1️⃣";
    } else {
        repeatBtn.innerText = "🔂";
    }
};


//----------------------------------
// FULLSCREEN PLAYER
//----------------------------------
if (openFullscreenBtn) {
    openFullscreenBtn.onclick = () => {
        fsPlayer.style.display = "flex";
    };
}

if (closeFullscreenBtn) {
    closeFullscreenBtn.onclick = () => {
        fsPlayer.style.display = "none";
    };
}

if (fsPrevBtn) fsPrevBtn.onclick = () => prevSong();
if (fsNextBtn) fsNextBtn.onclick = () => nextSong();


//----------------------------------
// LYRICS (Premium Only)
//----------------------------------
if (lyricsBtn) {
    lyricsBtn.onclick = () => {
        if (!isPremium) return alert("Lyrics only for premium users.");
        if (!currentSongId) return alert("Lyrics only available for backend songs.");

        fetch(`https://musicfy-jkhs.onrender.com/api/music/lyrics/${currentSongId}`, {
            headers: { Authorization: "Bearer " + token }
        })
            .then(r => r.json())
            .then(data => {
                if (!data.success) return alert("Lyrics not found.");
                alert(data.lyrics);
            })
            .catch(err => {
                console.error("LYRICS ERROR:", err);
                alert("Error loading lyrics.");
            });
    };
}


//----------------------------------
// PLAYLIST SYSTEM
//----------------------------------
if (addPlaylistBtn) {
    addPlaylistBtn.onclick = () => {
        if (!requireLogin()) return;
        createPlaylistPopup.style.display = "flex";
    };
}

if (cancelCreatePlaylist) {
    cancelCreatePlaylist.onclick = () => {
        createPlaylistPopup.style.display = "none";
    };
}

if (createPlaylistBtn) {
    createPlaylistBtn.onclick = () => {
        const name = newPlaylistName.value.trim();
        if (!name) return alert("Enter playlist name!");

        fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/create", {
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
            })
            .catch(err => {
                console.error("CREATE PLAYLIST ERROR:", err);
                alert("Error creating playlist.");
            });
    };
}


//----------------------------------
// LOAD PLAYLISTS + CACHE
//----------------------------------
function loadPlaylists() {
    if (!token) return;

    fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/my", {
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
                <div class="song-card" onclick="openPlaylist('${pl._id}')">
                    <img src="playlist.jpg" class="song-cover">
                    <p><b>${pl.name}</b></p>
                    <p class="small">${pl.songs.length} songs</p>
                </div>`;
            });
        })
        .catch(err => console.error("LOAD PLAYLISTS ERROR:", err));
}


//----------------------------------
// ADD TO PLAYLIST (FROM MORE MENU)
//----------------------------------
window.addToPlaylist = function (songId) {
    if (!requireLogin()) return;

    if (!userPlaylistsCache.length) {
        alert("No playlist found. Create a playlist first.");
        return;
    }

    const listText = userPlaylistsCache
        .map((p, idx) => `${idx + 1}) ${p.name}`)
        .join("\n");

    const choice = prompt(`Select playlist number:\n${listText}`);
    if (!choice) return;

    const idx = parseInt(choice) - 1;
    if (idx < 0 || idx >= userPlaylistsCache.length) {
        alert("Invalid playlist number.");
        return;
    }

    const playlistId = userPlaylistsCache[idx]._id;

    fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/add", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId, songId })
    })
        .then(r => r.json())
        .then(d => {
            if (!d.success) return alert("Failed to add to playlist");
            alert("Song added to playlist!");
            loadPlaylists();
        })
        .catch(err => {
            console.error("ADD TO PLAYLIST ERROR:", err);
            alert("Error adding song to playlist.");
        });
};


//----------------------------------
// REMOVE FROM PLAYLIST (FROM MORE MENU)
//----------------------------------
window.removeFromPlaylist = function (songId) {
    if (!requireLogin()) return;

    if (!userPlaylistsCache.length) {
        alert("You have no playlists.");
        return;
    }

    const listText = userPlaylistsCache
        .map((p, idx) => `${idx + 1}) ${p.name}`)
        .join("\n");

    const choice = prompt(`From which playlist to remove?\n${listText}`);
    if (!choice) return;

    const idx = parseInt(choice) - 1;
    if (idx < 0 || idx >= userPlaylistsCache.length) {
        alert("Invalid playlist number.");
        return;
    }

    const playlistId = userPlaylistsCache[idx]._id;

    fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/remove", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId, songId })
    })
        .then(r => r.json())
        .then(d => {
            if (!d.success) return alert(d.message || "Failed to remove from playlist");
            alert("Song removed from playlist!");
            loadPlaylists();
        })
        .catch(err => {
            console.error("REMOVE FROM PLAYLIST ERROR:", err);
            alert("Error removing song from playlist.");
        });
};


//----------------------------------
// OPEN PLAYLIST PAGE
//----------------------------------
window.openPlaylist = function (playlistId) {
    localStorage.setItem("current_playlist_id", playlistId);
    window.location.href = "playlist.html";
};


//----------------------------------
// NAVIGATION
//----------------------------------
if (backBtn) {
    backBtn.onclick = () => history.back();
}
if (forwardBtn) {
    forwardBtn.onclick = () => history.forward();
}


//----------------------------------
// MOBILE MENU
//----------------------------------
if (menuToggle) {
    menuToggle.onclick = () => mobileMenu.classList.add("open");
}
if (closeMobileMenu) {
    closeMobileMenu.onclick = () => mobileMenu.classList.remove("open");
}

if (mobileSignup) {
    mobileSignup.onclick = () => {
        mobileMenu.classList.remove("open");
        window.location.href = "register.html";
    };
}

if (mobileLogin) {
    mobileLogin.onclick = () => {
        mobileMenu.classList.remove("open");
        window.location.href = "login.html";
    };
}


//----------------------------------
// HEADER SCROLL BLUR
//----------------------------------
window.addEventListener("scroll", () => {
    if (!header) return;
    if (window.scrollY > 10) header.classList.add("header-blur");
    else header.classList.remove("header-blur");
});
