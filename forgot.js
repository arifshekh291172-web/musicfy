// Correct backend base URL
const BASE = "https://musicfy-jkhs.onrender.com/api/auth/forgot";

// Elements
const identifierInput = document.getElementById("identifier");
const sendOtpBtn = document.getElementById("sendOtpBtn");

const otpSection = document.getElementById("otpSection");
const otpInput = document.getElementById("otp");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");

const resetSection = document.getElementById("resetSection");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetBtn = document.getElementById("resetBtn");


// --------------------------------
// SEND OTP
// --------------------------------
sendOtpBtn.onclick = () => {
    const identifier = identifierInput.value.trim();
    if (!identifier) return alert("Enter username or email");

    fetch(`${BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) return alert(data.message);

        alert("OTP sent successfully!");
        otpSection.classList.remove("hidden");
    })
    .catch(err => console.error("SEND OTP ERROR:", err));
};


// --------------------------------
// VERIFY OTP
// --------------------------------
verifyOtpBtn.onclick = () => {
    const identifier = identifierInput.value.trim();
    const otp = otpInput.value.trim();

    fetch(`${BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, otp })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) return alert(data.message);

        alert("OTP verified!");
        resetSection.classList.remove("hidden");
    })
    .catch(err => console.error("VERIFY OTP ERROR:", err));
};


// --------------------------------
// RESET PASSWORD
// --------------------------------
resetBtn.onclick = () => {
    const identifier = identifierInput.value.trim();
    const pass = newPasswordInput.value.trim();
    const confirm = confirmPasswordInput.value.trim();

    if (pass !== confirm) return alert("Passwords do not match");

    fetch(`${BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, newPassword: pass })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) return alert(data.message);

        alert("Password changed successfully!");
        window.location.href = "login.html";
    })
    .catch(err => console.error("RESET PASSWORD ERROR:", err));
};
