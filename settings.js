const token = localStorage.getItem("musicfy_token");

// -------------- ON LOAD --------------
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

// -------------- PROFILE --------------
async function loadUserDetails() {
    try {
        const res = await fetch("/api/user/me", {
            headers: { Authorization: token }
        });
        const data = await res.json();

        if (!res.ok) {
            console.error(data);
            return;
        }

        document.getElementById("username").value = data.username || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("dob").value = data.dob ? data.dob.substring(0, 10) : "";
        document.getElementById("gender").value = data.gender || "";
        document.getElementById("privacyToggle").checked = !!data.isPrivate;
        if (data.photo) {
            document.getElementById("profileImage").src = data.photo;
        }
    } catch (err) {
        console.error("Error loading user details", err);
    }
}

document.getElementById("uploadPhoto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = function (ev) {
        document.getElementById("profileImage").src = ev.target.result;
    };
    reader.readAsDataURL(file);

    // Upload to backend
    const formData = new FormData();
    formData.append("photo", file);

    try {
        const res = await fetch("/api/user/upload-photo", {
            method: "POST",
            headers: { Authorization: token },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || "Error uploading photo");
        }
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
        const res = await fetch("/api/user/update-profile", {
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

// -------------- SECURITY --------------
async function changePassword() {
    const oldPass = document.getElementById("oldPass").value;
    const newPass = document.getElementById("newPass").value;

    if (!oldPass || !newPass) {
        alert("Please enter both current and new password.");
        return;
    }

    try {
        const res = await fetch("/api/user/change-password", {
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
        const res = await fetch("/api/user/security-info", {
            headers: { Authorization: token }
        });
        const data = await res.json();
        if (!res.ok) return;

        document.getElementById("twoFAToggle").checked = !!data.twoFAEnabled;
        if (data.lastLogin) {
            document.getElementById("lastLoginText").textContent =
                "Last login: " + new Date(data.lastLogin).toLocaleString();
        }
    } catch (err) {
        console.error("Error loading security info", err);
    }
}

async function toggleTwoFA() {
    const enabled = document.getElementById("twoFAToggle").checked;
    try {
        const res = await fetch("/api/user/twofa", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ enabled })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || "Error updating 2FA");
        }
    } catch (err) {
        console.error("2FA error", err);
    }
}

// -------------- SUBSCRIPTION --------------
async function loadPremiumStatus() {
    try {
        const res = await fetch("/api/premium/check", {
            headers: { Authorization: token }
        });
        const data = await res.json();

        if (!res.ok) {
            console.error(data);
            return;
        }

        document.getElementById("premiumStatus").innerText =
            data.isPremium ? "Premium: Active" : "Plan: Free";

        document.getElementById("premiumExpiry").innerText =
            data.isPremium && data.premiumExpiry
                ? "Expiry: " + new Date(data.premiumExpiry).toLocaleDateString()
                : "Expiry: --";

        document.getElementById("autoRenewToggle").checked = !!data.autoRenew;
    } catch (err) {
        console.error("Error loading premium status", err);
    }
}

async function toggleAutoRenew() {
    const autoRenew = document.getElementById("autoRenewToggle").checked;
    try {
        const res = await fetch("/api/premium/auto-renew", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ autoRenew })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || "Error updating auto-renew");
        }
    } catch (err) {
        console.error("Auto-renew error", err);
    }
}

async function redeemCoupon() {
    const code = document.getElementById("couponCode").value.trim();
    if (!code) {
        alert("Enter a coupon code.");
        return;
    }
    try {
        const res = await fetch("/api/premium/redeem", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        alert(data.message || (res.ok ? "Coupon applied" : "Error applying coupon"));
        if (res.ok) {
            loadPremiumStatus();
        }
    } catch (err) {
        console.error("Redeem coupon error", err);
    }
}

function upgradePremium() {
    window.location.href = "/premium.html";
}

// -------------- MUSIC PREFERENCES --------------
function attachGenreListeners() {
    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            chip.classList.toggle("active");
        });
    });
}

function attachCrossfadeListener() {
    const crossSlider = document.getElementById("crossfadeSlider");
    if (!crossSlider) return;
    crossSlider.addEventListener("input", () => {
        document.getElementById("crossValue").textContent = crossSlider.value + "s";
    });
}

async function loadPreferences() {
    try {
        const res = await fetch("/api/user/preferences", {
            headers: { Authorization: token }
        });
        const data = await res.json();
        if (!res.ok) return;

        // Genres
        if (Array.isArray(data.genres)) {
            document.querySelectorAll(".chip").forEach(chip => {
                if (data.genres.includes(chip.textContent)) {
                    chip.classList.add("active");
                }
            });
        }

        document.getElementById("explicitToggle").checked = !!data.blockExplicit;
        document.getElementById("playQuality").value = data.playQuality || "auto";
        document.getElementById("downloadQuality").value = data.downloadQuality || "medium";

        const crossSlider = document.getElementById("crossfadeSlider");
        if (typeof data.crossfade === "number") {
            crossSlider.value = data.crossfade;
            document.getElementById("crossValue").textContent = data.crossfade + "s";
        }

        document.getElementById("gaplessToggle").checked = !!data.gapless;
        document.getElementById("autoplayToggle").checked = !!data.autoplay;
        document.getElementById("dataSaverToggle").checked = !!data.dataSaver;
        document.getElementById("animationToggle").checked = data.animations !== false;
    } catch (err) {
        console.error("Error loading preferences", err);
    }
}

async function saveMusicPreferences() {
    const genres = [];
    document.querySelectorAll(".chip.active").forEach(chip => {
        genres.push(chip.textContent);
    });

    const body = {
        genres: genres,
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
        const res = await fetch("/api/user/preferences", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        alert(data.message || (res.ok ? "Preferences saved" : "Error saving preferences"));
    } catch (err) {
        console.error("Save preferences error", err);
    }
}

// -------------- THEME & ACCENT --------------
function loadTheme() {
    const saved = localStorage.getItem("theme") || "system";
    const select = document.getElementById("themeSelect");
    if (select) select.value = saved;
    applyTheme(saved);
}

function setTheme() {
    const theme = document.getElementById("themeSelect").value;
    localStorage.setItem("theme", theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.style.setProperty("--bg-main", "#000000");
        document.documentElement.style.setProperty("--bg-card", "#111111");
    } else if (theme === "light") {
        document.documentElement.style.setProperty("--bg-main", "#f9fafb");
        document.documentElement.style.setProperty("--bg-card", "#ffffff");
    } else if (theme === "oled") {
        document.documentElement.style.setProperty("--bg-main", "#000000");
        document.documentElement.style.setProperty("--bg-card", "#050505");
    } else {
        // system
        const prefersDark = window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.style.setProperty("--bg-main", prefersDark ? "#000000" : "#f9fafb");
        document.documentElement.style.setProperty("--bg-card", prefersDark ? "#111111" : "#ffffff");
    }
}

function setAccentColor() {
    const color = document.getElementById("accentSelect").value;
    document.documentElement.style.setProperty("--accent-color", color);
    localStorage.setItem("accentColor", color);
}

function loadAccentFromStorage() {
    const saved = localStorage.getItem("accentColor");
    if (saved) {
        document.documentElement.style.setProperty("--accent-color", saved);
        const select = document.getElementById("accentSelect");
        if (select) select.value = saved;
    }
}

function clearCache() {
    // Basic local cache clear (you can add more keys)
    localStorage.removeItem("musicfy_cache");
    alert("App cache cleared (local data).");
}

// -------------- REGIONAL SETTINGS --------------
async function loadRegionalSettings() {
    try {
        const res = await fetch("/api/user/regional", {
            headers: { Authorization: token }
        });
        const data = await res.json();
        if (!res.ok) return;

        if (data.language) {
            document.getElementById("langSelect").value = data.language;
        }
        if (data.country) {
            document.getElementById("countrySelect").value = data.country;
        }
    } catch (err) {
        console.error("Error loading regional settings", err);
    }
}

async function saveRegionalSettings() {
    const body = {
        language: document.getElementById("langSelect").value,
        country: document.getElementById("countrySelect").value
    };

    try {
        const res = await fetch("/api/user/regional", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        alert(data.message || (res.ok ? "Regional settings saved" : "Error saving regional settings"));
    } catch (err) {
        console.error("Save regional error", err);
    }
}

// -------------- NOTIFICATIONS --------------
function loadNotificationSettings() {
    const master = localStorage.getItem("notify_master") === "true";
    const newRel = localStorage.getItem("notify_new") === "true";
    const playlist = localStorage.getItem("notify_playlist") === "true";
    const offers = localStorage.getItem("notify_offers") === "true";

    document.getElementById("notifyMasterToggle").checked = master;
    document.getElementById("notifyNewToggle").checked = newRel;
    document.getElementById("notifyPlaylistToggle").checked = playlist;
    document.getElementById("notifyOffersToggle").checked = offers;
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
    const master = document.getElementById("notifyMasterToggle").checked;
    const newRel = document.getElementById("notifyNewToggle").checked;
    const playlist = document.getElementById("notifyPlaylistToggle").checked;
    const offers = document.getElementById("notifyOffersToggle").checked;

    localStorage.setItem("notify_master", master);
    localStorage.setItem("notify_new", newRel);
    localStorage.setItem("notify_playlist", playlist);
    localStorage.setItem("notify_offers", offers);

    alert("Notification settings saved.");
}

// -------------- DEVICES --------------
async function loadDevices() {
    try {
        const res = await fetch("/api/user/devices", {
            headers: { Authorization: token }
        });
        const data = await res.json();
        if (!res.ok) return;

        const list = document.getElementById("deviceList");
        list.innerHTML = "";
        (data.devices || []).forEach(d => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${d.name || "Device"}<br><span style="color:#9ca3af;font-size:11px;">Last active: ${d.lastActive ? new Date(d.lastActive).toLocaleString() : "Unknown"}</span></span>
                <button class="btn small" onclick="logoutDevice('${d.id}')">Logout</button>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error("Error loading devices", err);
    }
}

async function logoutDevice(deviceId) {
    try {
        const res = await fetch("/api/user/devices/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({ deviceId })
        });
        const data = await res.json();
        alert(data.message || (res.ok ? "Device logged out" : "Error logging out device"));
        if (res.ok) loadDevices();
    } catch (err) {
        console.error("Logout device error", err);
    }
}

// -------------- SUPPORT --------------
function openTicket() {
    window.location.href = "/support/ticket.html";
}

function openAIChat() {
    window.location.href = "/support/ai-chat.html";
}

function openReport() {
    window.location.href = "/support/report.html";
}

// -------------- LOGOUT --------------
function logout() {
    localStorage.removeItem("musicfy_token");
    window.location.href = "/login.html";
}
