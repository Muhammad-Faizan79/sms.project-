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

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const errorBox = document.getElementById("loginError");
    errorBox.textContent = "";
    try {
        const response = await fetch(`${baseUrl}/student/login`, {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
            body: JSON.stringify({ login: document.getElementById("userId").value.trim(), password: document.getElementById("password").value })
        });
        const result = await response.json();
        if (!response.ok || !result.status) throw new Error(result.message || "Login failed");
        window.location.replace("student-dashboard.html");
    } catch (error) { errorBox.textContent = error.message; }
});
