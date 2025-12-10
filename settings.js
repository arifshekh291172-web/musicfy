// -------------------------------------
// GLOBAL CONFIG
// -------------------------------------
const BACKEND = "https://musicfy-jkhs.onrender.com";
const token = localStorage.getItem("musicfy_token");

// UNIVERSAL API WRAPPER (MAIN FIX)
const API = (path, options = {}) => {
    const url = path.startsWith("/")
        ? `${BACKEND}${path}`
        : `${BACKEND}/${path}`;

    return fetch(url, options);
};

// -------------------------------------
// ON LOAD
// -------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    attachGenreListeners();
    attachCrossfadeListener();
    loadTheme();
    loadAccentFromStorage();
    loadUserDetails();
    loadPremiumStatus();
    loadPreferences();
    loadRegionalSettings();
    loadNotificationSettings();
    loadDevices();
    loadSecurityInfo();
});

// -------------------------------------
// PROFILE
// -------------------------------------
async function loadUserDetails() {
    try {
        const res = await API("/api/user/me", {
            headers: { Authorization: token }
        });

        const data = await res.json();
        if (!res.ok) return console.error(data);

        document.getElementById("username").value = data.username || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("dob").value = data.dob ? data.dob.substring(0, 10) : "";
        document.getElementById("gender").value = data.gender || "";
        document.getElementById("privacyToggle").checked = !!data.isPrivate;

        if (data.photo) document.getElementById("profileImage").src = data.photo;
    } catch (err) {
        console.error("Error loading user details", err);
    }
}

document.getElementById("uploadPhoto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = ev => document.getElementById("profileImage").src = ev.target.result;
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append("photo", file);

    try {
        const res = await API("/api/user/upload-photo", {
            method: "POST",
            headers: { Authorization: token },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) alert(data.message || "Error uploading photo");
    } catch (err) {
        console.error("Upload photo error", err);
    }
});

async function saveProfile() {
    const body = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        dob: document.getElementById("dob").value,
        gender: document.getElementById("gender").value,
        isPrivate: document.getElementById("privacyToggle").checked
    };

    try {
        const res = await API("/api/user/update-profile", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        alert(data.message || (res.ok ? "Profile updated" : "Error updating profile"));
    } catch (err) {
        console.error("Error saving profile", err);
    }
}

// -------------------------------------
// SECURITY
// -------------------------------------
async function changePassword() {
    const oldPass = document.getElementById("oldPass").value;
    const newPass = document.getElementById("newPass").value;

    if (!oldPass || !newPass) return alert("Please enter both passwords.");

    try {
        const res = await API("/api/user/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ oldPass, newPass })
        });

        const data = await res.json();
        alert(data.message || (res.ok ? "Password updated" : "Error updating password"));
    } catch (err) {
        console.error("Change password error", err);
    }
}

async function loadSecurityInfo() {
    try {
        const res = await API("/api/user/security-info", {
            headers: { Authorization: token }
        });

        const data = await res.json();
        if (!res.ok) return;

        document.getElementById("twoFAToggle").checked = !!data.twoFAEnabled;
        if (data.lastLogin)
            document.getElementById("lastLoginText").textContent =
                "Last login: " + new Date(data.lastLogin).toLocaleString();
    } catch (err) {
        console.error("Error loading security info", err);
    }
}

async function toggleTwoFA() {
    const enabled = document.getElementById("twoFAToggle").checked;

    try {
        const res = await API("/api/user/twofa", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ enabled })
        });

        const data = await res.json();
        if (!res.ok) alert(data.message || "Error updating 2FA");
    } catch (err) {
        console.error("2FA error", err);
    }
}

// -------------------------------------
// SUBSCRIPTION
// -------------------------------------
async function loadPremiumStatus() {
    try {
        const res = await API("/api/premium/check", {
            headers: { Authorization: token }
        });

        const data = await res.json();
        if (!res.ok) return;

        document.getElementById("premiumStatus").innerText =
            data.isPremium ? "Premium: Active" : "Plan: Free";

        document.getElementById("premiumExpiry").innerText =
            data.isPremium && data.premiumExpiry
                ? "Expiry: " + new Date(data.premiumExpiry).toLocaleDateString()
                : "Expiry: --";

        document.getElementById("autoRenewToggle").checked = !!data.autoRenew;
    } catch (err) {
        console.error("Premium load error", err);
    }
}

async function toggleAutoRenew() {
    const autoRenew = document.getElementById("autoRenewToggle").checked;

    try {
        const res = await API("/api/premium/auto-renew", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ autoRenew })
        });

        const data = await res.json();
        if (!res.ok) alert(data.message || "Error updating auto-renew");
    } catch (err) {
        console.error("Auto-renew error", err);
    }
}

async function redeemCoupon() {
    const code = document.getElementById("couponCode").value.trim();
    if (!code) return alert("Enter coupon code.");

    try {
        const res = await API("/api/premium/redeem", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ code })
        });

        const data = await res.json();
        alert(data.message || (res.ok ? "Coupon applied" : "Invalid coupon"));
        if (res.ok) loadPremiumStatus();
    } catch (err) {
        console.error("Redeem error", err);
    }
}

// -------------------------------------
// MUSIC PREFERENCES
// -------------------------------------
function attachGenreListeners() {
    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => chip.classList.toggle("active"));
    });
}

function attachCrossfadeListener() {
    const slider = document.getElementById("crossfadeSlider");
    if (!slider) return;

    slider.addEventListener("input", () => {
        document.getElementById("crossValue").textContent = slider.value + "s";
    });
}

async function loadPreferences() {
    try {
        const res = await API("/api/user/preferences", {
            headers: { Authorization: token }
        });

        const data = await res.json();
        if (!res.ok) return;

        if (Array.isArray(data.genres)) {
            document.querySelectorAll(".chip").forEach(chip => {
                if (data.genres.includes(chip.textContent)) chip.classList.add("active");
            });
        }

        document.getElementById("explicitToggle").checked = !!data.blockExplicit;
        document.getElementById("playQuality").value = data.playQuality || "auto";
        document.getElementById("downloadQuality").value = data.downloadQuality || "medium";

        const slider = document.getElementById("crossfadeSlider");
        slider.value = data.crossfade || 0;
        document.getElementById("crossValue").textContent = data.crossfade + "s";

        document.getElementById("gaplessToggle").checked = !!data.gapless;
        document.getElementById("autoplayToggle").checked = !!data.autoplay;
        document.getElementById("dataSaverToggle").checked = !!data.dataSaver;
        document.getElementById("animationToggle").checked = data.animations !== false;
    } catch (err) {
        console.error("Preferences load error", err);
    }
}

async function saveMusicPreferences() {
    const genres = [];
    document.querySelectorAll(".chip.active").forEach(c => genres.push(c.textContent));

    const body = {
        genres,
        blockExplicit: document.getElementById("explicitToggle").checked,
        playQuality: document.getElementById("playQuality").value,
        downloadQuality: document.getElementById("downloadQuality").value,
        crossfade: Number(document.getElementById("crossfadeSlider").value),
        gapless: document.getElementById("gaplessToggle").checked,
        autoplay: document.getElementById("autoplayToggle").checked,
        dataSaver: document.getElementById("dataSaverToggle").checked,
        animations: document.getElementById("animationToggle").checked
    };

    try {
        const res = await API("/api/user/preferences", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        alert(data.message || (res.ok ? "Preferences saved" : ""));
    } catch (err) {
        console.error("Preferences save error", err);
    }
}

// -------------------------------------
// THEME & ACCENT
// -------------------------------------
function loadTheme() {
    const saved = localStorage.getItem("theme") || "system";
    document.getElementById("themeSelect").value = saved;
    applyTheme(saved);
}

function setTheme() {
    const theme = document.getElementById("themeSelect").value;
    localStorage.setItem("theme", theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
        root.style.setProperty("--bg-main", "#000");
        root.style.setProperty("--bg-card", "#111");
    } else if (theme === "light") {
        root.style.setProperty("--bg-main", "#f9fafb");
        root.style.setProperty("--bg-card", "#fff");
    } else if (theme === "oled") {
        root.style.setProperty("--bg-main", "#000");
        root.style.setProperty("--bg-card", "#050505");
    } else {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.style.setProperty("--bg-main", dark ? "#000" : "#f9fafb");
        root.style.setProperty("--bg-card", dark ? "#111" : "#fff");
    }
}

function setAccentColor() {
    const color = document.getElementById("accentSelect").value;
    document.documentElement.style.setProperty("--accent-color", color);
    localStorage.setItem("accentColor", color);
}

function loadAccentFromStorage() {
    const saved = localStorage.getItem("accentColor");
    if (!saved) return;

    document.documentElement.style.setProperty("--accent-color", saved);
    document.getElementById("accentSelect").value = saved;
}

// -------------------------------------
// REGIONAL SETTINGS
// -------------------------------------
async function loadRegionalSettings() {
    try {
        const res = await API("/api/user/regional", {
            headers: { Authorization: token }
        });

        const data = await res.json();
        if (!res.ok) return;

        document.getElementById("langSelect").value = data.language || "en";
        document.getElementById("countrySelect").value = data.country || "India";
    } catch (err) {
        console.error("Regional load error", err);
    }
}

async function saveRegionalSettings() {
    const body = {
        language: document.getElementById("langSelect").value,
        country: document.getElementById("countrySelect").value
    };

    try {
        const res = await API("/api/user/regional", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        alert(data.message || "Regional settings saved");
    } catch (err) {
        console.error("Regional save error", err);
    }
}

// -------------------------------------
// NOTIFICATIONS
// -------------------------------------
function loadNotificationSettings() {
    document.getElementById("notifyMasterToggle").checked =
        localStorage.getItem("notify_master") === "true";

    document.getElementById("notifyNewToggle").checked =
        localStorage.getItem("notify_new") === "true";

    document.getElementById("notifyPlaylistToggle").checked =
        localStorage.getItem("notify_playlist") === "true";

    document.getElementById("notifyOffersToggle").checked =
        localStorage.getItem("notify_offers") === "true";
}

function toggleMasterNotifications() {
    const master = document.getElementById("notifyMasterToggle").checked;
    if (!master) {
        document.getElementById("notifyNewToggle").checked = false;
        document.getElementById("notifyPlaylistToggle").checked = false;
        document.getElementById("notifyOffersToggle").checked = false;
    }
}

function saveNotificationSettings() {
    localStorage.setItem("notify_master", document.getElementById("notifyMasterToggle").checked);
    localStorage.setItem("notify_new", document.getElementById("notifyNewToggle").checked);
    localStorage.setItem("notify_playlist", document.getElementById("notifyPlaylistToggle").checked);
    localStorage.setItem("notify_offers", document.getElementById("notifyOffersToggle").checked);

    alert("Notification settings saved.");
}

// -------------------------------------
// DEVICES
// -------------------------------------
async function loadDevices() {
    try {
        const res = await API("/api/user/devices", {
            headers: { Authorization: token }
        });

        const data = await res.json();
        if (!res.ok) return;

        const list = document.getElementById("deviceList");
        list.innerHTML = "";

        (data.devices || []).forEach(d => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${d.name || "Device"}<br>
                <span style="color:#9ca3af;font-size:11px;">
                    Last active: ${d.lastActive ? new Date(d.lastActive).toLocaleString() : "Unknown"}
                </span></span>
                <button class="btn small" onclick="logoutDevice('${d.id}')">Logout</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Device load error", err);
    }
}

async function logoutDevice(deviceId) {
    try {
        const res = await API("/api/user/devices/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ deviceId })
        });

        const data = await res.json();
        alert(data.message || "Device logged out");
        if (res.ok) loadDevices();
    } catch (err) {
        console.error("Device logout error", err);
    }
}

// -------------------------------------
// SUPPORT
// -------------------------------------
function openTicket() {
    window.location.href = "/support/ticket.html";
}

function openAIChat() {
    window.location.href = "/support/ai-chat.html";
}

function openReport() {
    window.location.href = "/support/report.html";
}

// -------------------------------------
// LOGOUT
// -------------------------------------
function logout() {
    localStorage.removeItem("musicfy_token");
    window.location.href = "/login.html";
}
