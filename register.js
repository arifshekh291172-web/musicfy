let userEmail = "";
let fullName = "";
let username = "";
let password = "";

let timeLeft = 300;
let timer;

// STEP 1 → SEND OTP
document.getElementById("sendOtpForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    fullName = document.getElementById("fullName").value.trim();
    userEmail = document.getElementById("email").value.trim();
    username = document.getElementById("username").value.trim();
    password = document.getElementById("password").value.trim();

    if (!fullName || !userEmail || !username || !password) {
        alert("Please fill all fields");
        return;
    }

    const res = await fetch("http://localhost:5000/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
        document.getElementById("sendOtpForm").style.display = "none";
        document.getElementById("otpSection").style.display = "block";

        startTimer();
        setupOtpInputs();
    }
});


// OTP Auto Focus
function setupOtpInputs() {
    const inputs = document.querySelectorAll(".otp-input");

    inputs.forEach((input, index) => {
        input.addEventListener("input", () => {
            if (input.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}


// TIMER
function startTimer() {
    const countdown = document.getElementById("countdown");
    const resendBtn = document.getElementById("resendBtn");

    timeLeft = 300;
    resendBtn.disabled = true;

    timer = setInterval(() => {
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;

        countdown.innerHTML = `OTP expires in ${m}:${s < 10 ? "0" + s : s}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            countdown.innerHTML = "OTP expired!";
            resendBtn.disabled = false;
        }

        timeLeft--;
    }, 1000);
}


// RESEND OTP
document.getElementById("resendBtn").addEventListener("click", async () => {
    const res = await fetch("http://localhost:5000/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) startTimer();
});


// Verify OTP
document.getElementById("verifyBtn").addEventListener("click", async () => {
    const inputs = document.querySelectorAll(".otp-input");
    let otp = "";
    inputs.forEach(i => otp += i.value);

    const res = await fetch("http://localhost:5000/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, otp })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
        clearInterval(timer);

        document.getElementById("verifyBtn").disabled = true;
        document.getElementById("finalRegisterBtn").style.display = "block";
    }
});


// FINAL REGISTER
document.getElementById("finalRegisterBtn").addEventListener("click", async () => {

    const res = await fetch("http://localhost:5000/api/register-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email: userEmail, username, password })
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) window.location.href = "login.html";
});


// PASSWORD TOGGLE
document.getElementById("togglePassword").addEventListener("click", () => {
    const pass = document.getElementById("password");
    pass.type = pass.type === "password" ? "text" : "password";
});
