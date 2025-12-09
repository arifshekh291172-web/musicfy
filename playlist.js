const token = localStorage.getItem("musicfy_token");
const playlistId = localStorage.getItem("current_playlist_id");

if (!playlistId) {
    alert("No playlist selected.");
    history.back();
}

// Load Playlist
function loadPlaylist() {
    fetch(`https://musicfy-jkhs.onrender.com/api/playlist/${playlistId}`, {
        headers: { Authorization: "Bearer " + token }
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert("Playlist not found.");
                return;
            }

            const playlist = data.playlist;
            document.getElementById("playlistName").innerText = playlist.name;

            const div = document.getElementById("playlistSongs");
            div.innerHTML = "";

            if (playlist.songs.length === 0) {
                div.innerHTML = `<p style="color:#b3b3b3;">No songs added yet.</p>`;
                return;
            }

            playlist.songs.forEach(song => {
                div.innerHTML += `
                <div class="song-card">
                    <img src="${song.cover}" class="song-cover">
                    <p><b>${song.title}</b></p>
                    <p class="small">${song.artist}</p>

                    <button onclick="playSong('${song._id}')">Play</button>
                    <button onclick="removeSong('${song._id}')">Remove</button>
                </div>`;
            });
        });
}

loadPlaylist();

// Play from playlist
function playSong(songId) {
    localStorage.setItem("play_from_playlist", songId);
    window.location.href = "index.html";
}

// Remove song
function removeSong(songId) {
    fetch(`https://musicfy-jkhs.onrender.com/api/playlist/remove`, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ playlistId, songId })
    })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                alert("Song removed.");
                loadPlaylist();
            }
        });
}
