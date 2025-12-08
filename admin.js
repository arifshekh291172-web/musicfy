const uploadBtn = document.getElementById("uploadBtn");
const statusEl = document.getElementById("status");

uploadBtn.addEventListener("click", async () => {
    const title = document.getElementById("title").value.trim();
    const artist = document.getElementById("artist").value.trim();
    const coverUrl = document.getElementById("coverUrl").value.trim();
    const audioFile = document.getElementById("audioFile").files[0];
    const coverFile = document.getElementById("coverFile").files[0];

    if (!title || !artist || !audioFile) {
        statusEl.innerText = "Please fill title, artist and audio file.";
        return;
    }

    let formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("coverUrl", coverUrl);
    formData.append("audioFile", audioFile);

    if (coverFile) formData.append("coverFile", coverFile);

    statusEl.innerText = "Uploading...";

    fetch("http://localhost:5000/api/music/song/upload", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                statusEl.innerText = "Uploaded Successfully!";
            } else {
                statusEl.innerText = "Upload Failed!";
            }
        })
        .catch(err => {
            console.log(err);
            statusEl.innerText = "Error uploading file!";
        });
});
