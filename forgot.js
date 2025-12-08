const API = "https://musicfy-jkhs.onrender.com/api";

const emailInput = document.getElementById("email");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifySection = document.getElementById("otpSection");
const resetSection = document.getElementById("resetSection");

let userEmail = "";

// STEP 1 — SEND OTP
sendOtpBtn.onclick = () => {
    userEmail = emailInput.value.trim();
    if (!userEmail) return alert("Enter your email");

    fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
    })
    .then(res => res.json())
    .then(data => {
        console.log("SEND OTP:", data);
        if (!data.success) return alert(data.message);

        alert("OTP sent!");
        verifySection.style.display = "block";
    });
};

// STEP 2 — VERIFY OTP
document.getElementById("verifyOtpBtn").onclick = () => {
    const otp = document.getElementById("otp").value.trim();

    fetch(`${API}/verify-forgot-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp })
    })
    .then(res => res.json())
    .then(data => {
        console.log("VERIFY OTP:", data);
        if (!data.success) return alert(data.message);

        alert("OTP verified!");
        resetSection.style.display = "block";
    });
};

// STEP 3 — RESET PASSWORD
document.getElementById("resetBtn").onclick = () => {
    const newPassword = document.getElementById("newPassword").value.trim();

    fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, newPassword })
    })
    .then(res => res.json())
    .then(data => {
        console.log("RESET PASSWORD:", data);
        if (!data.success) return alert(data.message);

        alert("Password changed! Login now.");
        window.location.href = "login.html";
    });
};
