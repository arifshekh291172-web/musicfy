document.getElementById("uploadSongForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", e.target.title.value);
    formData.append("artist", e.target.artist.value);
    formData.append("audio", e.target.audio.files[0]);
    formData.append("cover", e.target.cover.files[0]);

    const token = localStorage.getItem("musicfy_token");

    const res = await fetch("http://localhost:5000/api/music/upload", {
        method: "POST",
        headers: {
            Authorization: "Bearer " + token
        },
        body: formData
    });

    const data = await res.json();
    console.log("UPLOAD RESPONSE:", data);

    if (data.success) {
        alert("Song uploaded!");
    } else {
        alert("Failed to upload");
    }
});
