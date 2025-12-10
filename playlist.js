const token = localStorage.getItem("musicfy_token");
const playlistId = localStorage.getItem("current_playlist_id");

const hero = document.getElementById("playlistHero");
const coverEl = document.getElementById("playlistCover");
const titleEl = document.getElementById("playlistTitle");
const infoEl = document.getElementById("playlistInfo");
const tracksContainer = document.getElementById("tracksContainer");

const playBtnHero = document.getElementById("playBtnHero");
const shuffleBtnHero = document.getElementById("shuffleBtnHero");

const sortButtons = document.querySelectorAll(".sort-btn");

let tracks = []; // current playlist songs
let sortBy = "name";

if (!playlistId) {
    titleEl.innerText = "No playlist selected";
} else {
    loadPlaylist();
}

// ------------------------
// LOAD PLAYLIST DETAILS
// ------------------------
function loadPlaylist() {
    fetch(`https://musicfy-jkhs.onrender.com/api/music/playlist/${playlistId}`, {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            if (!data || !data.playlist) {
                titleEl.innerText = "Playlist not found";
                return;
            }

            const pl = data.playlist;
            tracks = pl.songs || [];

            titleEl.innerText = pl.name || "Playlist";
            infoEl.innerText = `${tracks.length} songs`;

            // Use first track cover as hero background if exists
            if (tracks.length && tracks[0].cover) {
                coverEl.src = tracks[0].cover;
                applyGradientFromCover(tracks[0].cover);
            }

            renderTracks();
        })
        .catch(err => {
            console.error("PLAYLIST LOAD ERROR:", err);
            titleEl.innerText = "Error loading playlist";
        });
}

// ------------------------
// GRADIENT BACKGROUND FROM COVER (simple fallback)
// ------------------------
function applyGradientFromCover(imgUrl) {
    // Simple: keep a nice green-ish gradient
    hero.style.background = "linear-gradient(135deg, #1db95455, #000)";
}

// ------------------------
// RENDER TRACK ROWS
// ------------------------
function renderTracks() {
    tracksContainer.innerHTML = "";

    // sort copy
    let sorted = [...tracks];

    if (sortBy === "name") {
        sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "duration") {
        sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));
    } else if (sortBy === "date") {
        sorted.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
    }

    sorted.forEach((song, idx) => {
        const row = document.createElement("div");
        row.className = "track-row";
        row.setAttribute("draggable", "true");
        row.dataset.id = song._id;
        row.dataset.index = idx;

        const durationText = song.duration
            ? formatDuration(song.duration)
            : "–";

        const dateText = song.addedAt
            ? new Date(song.addedAt).toLocaleDateString()
            : "–";

        row.innerHTML = `
            <div class="track-index">${idx + 1}</div>
            <div class="track-main">
                <img src="${song.cover}" class="track-cover-sm">
                <div>
                    <div class="track-title">${song.title}</div>
                    <div class="track-artist">${song.artist}</div>
                </div>
            </div>
            <div class="track-date">${dateText}</div>
            <div class="track-duration">${durationText}</div>
            <div class="track-more">
                <button class="more-dot-btn">⋮</button>
                <div class="context-menu">
                    <p onclick="addToQueue('${song._id}')">Add to queue</p>
                    <p onclick="removeFromPlaylist('${song._id}')">Remove from playlist</p>
                </div>
            </div>
        `;

        // click row → play that song (connect to your global player)
        row.addEventListener("dblclick", () => {
            console.log("Play song:", song.title);
            // yahan tu playByIndex / custom play function connect kar sakta hai
        });

        // drag events
        addDragEvents(row);

        // context menu toggle
        const moreBtn = row.querySelector(".more-dot-btn");
        const menu = row.querySelector(".context-menu");
        moreBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeAllContextMenus();
            menu.style.display = "block";
        });

        tracksContainer.appendChild(row);
    });
}

// ------------------------
// FORMAT DURATION
// ------------------------
function formatDuration(sec) {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
}

// ------------------------
// CONTEXT MENU HELPERS
// ------------------------
function closeAllContextMenus() {
    document.querySelectorAll(".context-menu").forEach(m => m.style.display = "none");
}
document.addEventListener("click", () => closeAllContextMenus());

// ------------------------
// SORT BUTTONS
// ------------------------
sortButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        sortButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        sortBy = btn.dataset.sort;
        renderTracks();
    });
});

// ------------------------
// DRAG & DROP REORDER (UI ONLY)
// ------------------------
let dragSrcEl = null;

function addDragEvents(row) {
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("drop", handleDrop);
    row.addEventListener("dragend", handleDragEnd);
}

function handleDragStart(e) {
    dragSrcEl = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add("drag-over");
}

function handleDrop(e) {
    e.stopPropagation();
    const fromId = dragSrcEl.dataset.id;
    const toId = this.dataset.id;

    if (fromId === toId) return;

    const fromIndex = tracks.findIndex(s => s._id === fromId);
    const toIndex = tracks.findIndex(s => s._id === toId);

    const temp = tracks[fromIndex];
    tracks[fromIndex] = tracks[toIndex];
    tracks[toIndex] = temp;

    this.classList.remove("drag-over");
    renderTracks();

    console.log("New playlist order:", tracks.map(t => t.title));

    // yahan tu backend ko order save karne ke liye API call bana sakta hai
    // fetch("/api/music/playlist/reorder", { ... })
}

function handleDragEnd() {
    this.classList.remove("dragging");
    document.querySelectorAll(".track-row").forEach(r => r.classList.remove("drag-over"));
}

// ------------------------
// CONTEXT MENU ACTIONS
// ------------------------
window.addToQueue = function (songId) {
    console.log("Add to queue:", songId);
    alert("Queue system abhi frontend me console.log pe hai. Tu yahan apna actual queue code laga sakta hai.");
};

window.removeFromPlaylist = function (songId) {
    if (!confirm("Remove this song from playlist?")) return;

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
            if (!d.success) return alert(d.message || "Failed to remove");

            tracks = tracks.filter(t => t._id !== songId);
            renderTracks();
        })
        .catch(err => {
            console.error("REMOVE ERROR:", err);
            alert("Error removing song.");
        });
};

// ------------------------
// HERO PLAY & SHUFFLE
// ------------------------
playBtnHero.addEventListener("click", () => {
    console.log("Play playlist from first song");
    // yahan tu global playByIndex(0) / custom player hook kar sakta hai
});

shuffleBtnHero.addEventListener("click", () => {
    console.log("Shuffle playlist");
    // simple shuffle example:
    tracks.sort(() => Math.random() - 0.5);
    renderTracks();
});
