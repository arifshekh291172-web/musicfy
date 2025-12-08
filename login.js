// ----------------------------------------------
// LOGIN FORM HANDLER
// ----------------------------------------------
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const identifier = document.getElementById("email").value.trim(); // email OR username
    const password = document.getElementById("password").value.trim();

    if (!identifier || !password) {
        alert("Please enter email/username and password.");
        return;
    }

    try {
        const res = await fetch("https://musicfy-jkhs.onrender.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier, password })   // MOST IMPORTANT FIX
        });

        const data = await res.json();
        console.log("LOGIN RESPONSE:", data);

        if (!data.success) {
            alert(data.message || "Login failed");
            return;
        }

        // SAVE TOKEN + USER DETAILS
        localStorage.setItem("musicfy_token", data.token);
        localStorage.setItem("musicfy_name", data.user.fullName);
        localStorage.setItem("musicfy_email", data.user.email);
        localStorage.setItem("musicfy_username", data.user.username);

        alert("Login successful!");

        // Redirect to dashboard / index
        window.location.href = "index.html";

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        alert("Server error. Try again later.");
    }
});


// ----------------------------------------------
// SHOW / HIDE PASSWORD
// ----------------------------------------------
document.getElementById("togglePassword").addEventListener("click", () => {
    const pass = document.getElementById("password");
    const toggle = document.getElementById("togglePassword");

    if (pass.type === "password") {
        pass.type = "text";
        toggle.textContent = "🙈";
    } else {
        pass.type = "password";
        toggle.textContent = "👁️";
    }
});
