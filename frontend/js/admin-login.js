import { baseUrl } from "./baseUrl.js";

const themeBtn = document.getElementById("themeBtn");
let theme = localStorage.getItem("srms_theme") || "light";
document.documentElement.setAttribute("data-theme", theme);
themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
themeBtn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("srms_theme", theme);
    themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
});

async function submitAuth(path, body) {
    const response = await fetch(`${baseUrl}/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.status) throw new Error(result.message || "Request failed");
    window.location.replace("admin-dashboard.html");
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById("loginError");
    errorBox.textContent = "";
    try {
        await submitAuth("loginadmin", {
            email: document.getElementById("userId").value.trim(),
            password: document.getElementById("password").value
        });
    } catch (error) { errorBox.textContent = error.message; }
});

document.getElementById("setupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById("loginError");
    errorBox.textContent = "";
    try {
        await submitAuth("signup", {
            name: document.getElementById("setupName").value.trim(),
            email: document.getElementById("setupEmail").value.trim(),
            password: document.getElementById("setupPassword").value
        });
    } catch (error) { errorBox.textContent = error.message; }
});
