const token = localStorage.getItem("musicfy_token");

const playlistContainer = document.getElementById("playlistContainer");
const songList = document.getElementById("songList");
const libraryHero = document.getElementById("libraryHero");

let playlists = [];
let recentPlaylists = [];
let downloadedPlaylists = [];
let selectedPlaylistSongs = [];

/* Load Library */
loadLibrary();

function loadLibrary() {
    loadPlaylists();
    loadSongs();
}

/* Load playlists */
function loadPlaylists() {
    fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/my", {
        headers: { Authorization: "Bearer " + token }
    })
    .then(res => res.json())
    .then(data => {
        playlists = data.playlists || [];

        // Sort for filters
        downloadedPlaylists = playlists.slice(0,2);
        recentPlaylists = playlists.reverse();

        renderPlaylists(playlists);
    });
}

/* Render playlist cards with gradient effect */
function renderPlaylists(list) {
    playlistContainer.innerHTML = "";

    list.forEach(pl => {

        playlistContainer.innerHTML += `
            <div class="song-card" onclick="openPlaylist('${pl._id}', '${pl.name}')">
                <img src="playlist.jpg" class="song-cover">
                <p><b>${pl.name}</b></p>
                <p class="small">${pl.songs.length} songs</p>
            </div>
        `;
    });
}

/* Open Playlist */
function openPlaylist(id, name) {
    localStorage.setItem("current_playlist_id", id);

    /* Dynamic Gradient */
    libraryHero.style.background = `
        linear-gradient(135deg, #1db95455, #000)
    `;
    libraryHero.querySelector(".hero-title").innerText = name;

    loadPlaylistSongs(id);
}

/* Load Songs in Playlist */
function loadPlaylistSongs(id) {
    fetch(`https://musicfy-jkhs.onrender.com/api/music/playlist/${id}`, {
        headers: { Authorization: "Bearer " + token }
    })
    .then(r => r.json())
    .then(data => {
        selectedPlaylistSongs = data.songs || [];
        renderSongList();
    });
}

/* Render Songs with Drag & Drop */
function renderSongList() {
    songList.innerHTML = "";

    selectedPlaylistSongs.forEach((song, index) => {
        songList.innerHTML += `
            <div class="song-card" draggable="true" data-index="${index}">
                <span class="drag-handle">≡</span>
                <img src="${song.cover}" class="song-cover">
                <p><b>${song.title}</b></p>
                <p class="small">${song.artist}</p>
            </div>
        `;
    });

    enableDragDrop();
}

/* Drag Drop Function */
function enableDragDrop() {
    const items = document.querySelectorAll("#songList .song-card");

    items.forEach(item => {
        item.addEventListener("dragstart", dragStart);
        item.addEventListener("dragover", dragOver);
        item.addEventListener("drop", dropItem);
    });
}

let dragStartIndex;

function dragStart() {
    dragStartIndex = +this.dataset.index;
}

function dragOver(e) {
    e.preventDefault();
}

function dropItem() {
    const dropIndex = +this.dataset.index;

    // Swap in array
    const temp = selectedPlaylistSongs[dragStartIndex];
    selectedPlaylistSongs[dragStartIndex] = selectedPlaylistSongs[dropIndex];
    selectedPlaylistSongs[dropIndex] = temp;

    renderSongList();
}

/* Filter Clicks */
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.dataset.filter;

        if (type === "all") renderPlaylists(playlists);
        if (type === "downloaded") renderPlaylists(downloadedPlaylists);
        if (type === "recent") renderPlaylists(recentPlaylists);
    };
});

/* FAB – Create New Playlist */
document.getElementById("fabBtn").onclick = () => {
    const name = prompt("Enter Playlist Name:");
    if (!name) return;

    fetch("https://musicfy-jkhs.onrender.com/api/music/playlist/create", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name })
    })
    .then(r => r.json())
    .then(() => loadPlaylists());
};
