const BASE_URL= "https://musicfy-jkhs.onrender.com/api";

// STEP BUTTONS
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");

// INPUTS
const emailInput = document.getElementById("email");
const otpInput = document.getElementById("otp");
const newPass = document.getElementById("newPassword");
const confirmPass = document.getElementById("confirmPassword");

// STEPS
const stepEmail = document.getElementById("stepEmail");
const stepOtp = document.getElementById("stepOtp");
const stepReset = document.getElementById("stepReset");


// STEP 1: SEND OTP
sendOtpBtn.onclick = async () => {
    const email = emailInput.value.trim();

    if (!email) return alert("Enter your email");

    try {
        const res = await fetch(`${BASE_URL}/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();
        console.log("SEND OTP:", data);

        if (!data.success) return alert(data.message);

        alert("OTP sent to your email!");

        stepEmail.style.display = "none";
        stepOtp.style.display = "block";

    } catch (err) {
        alert("Server error");
        console.log(err);
    }
};


// STEP 2: VERIFY OTP
verifyOtpBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();

    if (!otp) return alert("Enter OTP");

    try {
        const res = await fetch(`${BASE_URL}/verify-reset-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });

        const data = await res.json();
        console.log("VERIFY OTP:", data);

        if (!data.success) return alert(data.message);

        alert("OTP verified!");

        stepOtp.style.display = "none";
        stepReset.style.display = "block";

    } catch (err) {
        alert("Server error");
        console.log(err);
    }
};


// STEP 3: RESET PASSWORD
resetPasswordBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const pass = newPass.value.trim();
    const cpass = confirmPass.value.trim();

    if (!pass || !cpass) return alert("Enter password");

    if (pass !== cpass) return alert("Passwords do not match");

    try {
        const res = await fetch(`${BASE_URL}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword: pass })
        });

        const data = await res.json();
        console.log("RESET PASSWORD:", data);

        if (!data.success) return alert(data.message);

        alert("Password reset successful! You can login now.");
        window.location.href = "login.html";

    } catch (err) {
        alert("Server error");
        console.log(err);
    }
};
