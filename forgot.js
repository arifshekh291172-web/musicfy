const BASE = "https://musicfy-jkhs.onrender.com/api/auth/forgot";

const identifierInput = document.getElementById("identifier");
const sendOtpBtn = document.getElementById("sendOtpBtn");

const otpSection = document.getElementById("otpSection");
const otpInput = document.getElementById("otp");
const otpTimer = document.getElementById("otpTimer");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendBtn = document.getElementById("resendBtn");

const resetSection = document.getElementById("resetSection");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetBtn = document.getElementById("resetBtn");

let countdownInterval;

// ----------------------------
// START COUNTDOWN
// ----------------------------
function startTimer() {
    let time = 30;

    resendBtn.disabled = true;

    countdownInterval = setInterval(() => {
        time--;

        let m = "00:" + (time < 10 ? "0" + time : time);
        otpTimer.innerText = m;

        if (time <= 0) {
            clearInterval(countdownInterval);
            otpTimer.innerText = "00:00";
            resendBtn.disabled = false;
        }
    }, 1000);
}

// ----------------------------
// SEND OTP
// ----------------------------
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

            otpSection.classList.remove("hidden");
            alert("OTP sent to your email!");

            startTimer();
        });
};

// ----------------------------
// RESEND OTP
// ----------------------------
resendBtn.onclick = () => {
    const identifier = identifierInput.value.trim();
    if (!identifier) return;

    fetch(`${BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
    })
        .then(r => r.json())
        .then(data => {
            if (!data.success) return alert(data.message);

            alert("New OTP sent!");
            startTimer();
        });
};

// ----------------------------
// VERIFY OTP
// ----------------------------
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
        });
};

// ----------------------------
// RESET PASSWORD
// ----------------------------
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

            alert("Password reset successful!");
            window.location.href = "login.html";
        });
};
