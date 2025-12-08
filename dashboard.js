// Check token on load
const token = localStorage.getItem("musicfy_token");

if (!token) {
  // No session -> go to login
  window.location.href = "login.html";
} else {
  // Fetch user info from protected /me
  fetch("http://localhost:5000/api/me", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        // Invalid token / session expired
        localStorage.removeItem("musicfy_token");
        localStorage.removeItem("musicfy_name");
        localStorage.removeItem("musicfy_email");
        window.location.href = "login.html";
      } else {
        const name = data.user.fullName || "User";
        document.getElementById("welcomeText").innerText = `Welcome, ${name}`;
      }
    })
    .catch(err => {
      console.log(err);
      window.location.href = "login.html";
    });
}

// Logout button
document.getElementById("logoutBtn").addEventListener("click", () => {
  const token = localStorage.getItem("musicfy_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  fetch("http://localhost:5000/api/logout", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    }
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Logged out");

      // Clear session
      localStorage.removeItem("musicfy_token");
      localStorage.removeItem("musicfy_name");
      localStorage.removeItem("musicfy_email");

      window.location.href = "login.html";
    })
    .catch(err => {
      console.log(err);
      alert("Error logging out");
    });
});
