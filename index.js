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
// SHOW LOGGED-IN UI
//----------------------------------
function showLoggedInUI(name) {
    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    loggedInProfile.style.display = "flex";
    userNameEl.innerText = name;
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
        });
}


//----------------------------------
// LOGOUT
//----------------------------------
logoutBtn.onclick = () => {
    localStorage.clear();
    location.reload();
};


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
                userNameEl.innerText += " ⭐";
                premiumBadge.textContent = "Premium Active";
                premiumBadge.style.display = "block";
            }
        });
}



//----------------------------------
// LOAD TRENDING SONGS (Jamendo)
//----------------------------------
function loadSongs() {
    const songsDiv = document.getElementById("songsContainer");
    songsDiv.innerHTML = `<p style="color:#b3b3b3;">Loading trending songs...</p>`;

    const url =
        `${JAMENDO_BASE_URL}/tracks/?client_id=${JAMENDO_CLIENT_ID}` +
        `&format=json&audioformat=mp32&imagesize=300&limit=30&order=popularity_total`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const results = data.results || [];
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
                songsDiv.innerHTML += `
                <div class="song-card" onclick="playByIndex(${index})">
                    <img src="${track.album_image}" class="song-cover">
                    <p><b>${track.name}</b></p>
                    <p class="small">${track.artist_name}</p>
                </div>`;
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
            songsDiv.innerHTML = "";

            songQueue = data.songs.map(s => ({ ...s, source: "backend" }));

            data.songs.forEach((s, index) => {
                songsDiv.innerHTML += `
                <div class="song-card" onclick="playByIndex(${index})">
                    <img src="${s.cover}" class="song-cover">
                    <p><b>${s.title}</b></p>
                    <p class="small">${s.artist}</p>
                </div>`;
            });
        });
});



//----------------------------------
// PLAY SONG BY INDEX
//----------------------------------
window.playByIndex = function (index) {
    if (!requireLogin()) return;

    const s = songQueue[index];
    if (!s || !s.audioUrl) return;

    currentIndex = index;

    currentSongId = s._id; // Jamendo + Backend both have _id

    audio.src = s.audioUrl;

    playerTitle.innerText = s.title;
    playerArtist.innerText = s.artist;
    playerCover.src = s.cover;

    fsCover.src = s.cover;
    fsTitle.innerText = s.title;
    fsArtist.innerText = s.artist;

    audio.play();
    playBtn.innerText = "⏸️";
    fsPlayBtn.innerText = "⏸️";

    // Save recent for both jamendo + backend
    saveRecent(currentSongId);
};



//----------------------------------
// PLAY RECENT
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
        });
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
        .then(() => loadRecent());
}



//----------------------------------
// LOAD RECENT
//----------------------------------
function loadRecent() {
    const div = document.getElementById("recentContainer");

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

            data.recent.forEach(song => {
                div.innerHTML += `
                <div class="song-card" onclick="playRecent('${song._id}')">
                    <img src="${song.cover}" class="song-cover">
                    <p><b>${song.title}</b></p>
                    <p class="small">${song.artist}</p>
                </div>`;
            });
        });
}



//----------------------------------
// AUDIO EVENTS
//----------------------------------
audio.ontimeupdate = () => {
    if (!audio.duration) return;

    seekBar.max = audio.duration;
    fsSeekBar.max = audio.duration;

    seekBar.value = audio.currentTime;
    fsSeekBar.value = audio.currentTime;
};

audio.onended = () => nextSong();

seekBar.oninput = () => audio.currentTime = seekBar.value;
fsSeekBar.oninput = () => audio.currentTime = fsSeekBar.value;



//----------------------------------
// PLAYER CONTROLS
//----------------------------------
function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸️";
        fsPlayBtn.innerText = "⏸️";
    } else {
        audio.pause();
        playBtn.innerText = "▶️";
        fsPlayBtn.innerText = "▶️";
    }
}

playBtn.onclick = togglePlay;
fsPlayBtn.onclick = togglePlay;


window.nextSong = function () {
    if (repeatMode === "one") return playByIndex(currentIndex);

    if (currentIndex < songQueue.length - 1) playByIndex(currentIndex + 1);
    else if (repeatMode === "all") playByIndex(0);
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
};



//----------------------------------
// FULLSCREEN PLAYER
//----------------------------------
openFullscreenBtn.onclick = () => fsPlayer.style.display = "flex";
closeFullscreenBtn.onclick = () => fsPlayer.style.display = "none";

fsPrevBtn.onclick = () => prevSong();
fsNextBtn.onclick = () => nextSong();



//----------------------------------
// LYRICS (Premium Only)
//----------------------------------
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
        });
};



//----------------------------------
// PLAYLIST SYSTEM
//----------------------------------
addPlaylistBtn.onclick = () => {
    if (!requireLogin()) return;
    createPlaylistPopup.style.display = "flex";
};

cancelCreatePlaylist.onclick = () => {
    createPlaylistPopup.style.display = "none";
};

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
        });
};

function loadPlaylists() {
    if (!token) return;

    fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/my", {
        headers: { Authorization: "Bearer " + token }
    })
        .then(r => r.json())
        .then(data => {
            const div = document.getElementById("playlistContainer");
            div.innerHTML = "";

            data.playlists.forEach(pl => {
                div.innerHTML += `
                <div class="song-card">
                    <img src="playlist.jpg" class="song-cover">
                    <p><b>${pl.name}</b></p>
                    <p class="small">${pl.songs.length} songs</p>
                </div>`;
            });
        });
}



//----------------------------------
// NAVIGATION
//----------------------------------
backBtn.onclick = () => history.back();
forwardBtn.onclick = () => history.forward();



//----------------------------------
// MOBILE MENU
//----------------------------------
menuToggle.onclick = () => mobileMenu.classList.add("open");
closeMobileMenu.onclick = () => mobileMenu.classList.remove("open");

mobileSignup.onclick = () => {
    mobileMenu.classList.remove("open");
    window.location.href = "register.html";
};

mobileLogin.onclick = () => {
    mobileMenu.classList.remove("open");
    window.location.href = "login.html";
};



//----------------------------------
// HEADER SCROLL BLUR
//----------------------------------
window.addEventListener("scroll", () => {
    if (window.scrollY > 10) header.classList.add("header-blur");
    else header.classList.remove("header-blur");
});
