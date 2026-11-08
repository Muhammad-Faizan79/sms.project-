// ---------- light / dark mode ----------
var themeBtn = document.getElementById("themeBtn");
var theme = localStorage.getItem("srms_theme") || "light";
document.documentElement.setAttribute("data-theme", theme);
themeBtn.innerHTML = theme == "dark" ? "☀️ Light" : "🌙 Dark";

themeBtn.addEventListener("click", function () {
    theme = (theme == "dark") ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("srms_theme", theme);
    themeBtn.innerHTML = theme == "dark" ? "☀️ Light" : "🌙 Dark";
});
