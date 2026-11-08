import { baseUrl } from "./baseUrl.js";

const $ = (id) => document.getElementById(id);
const state = { student: null, courses: [], results: [], attendance: [], schoolAttendance: { monthlySummary: [] }, schoolAttendanceError: "", exams: [], notices: [], feedback: [], ranking: { rank: 0, classSize: 0 } };
const sections = ["home", "profile", "courses", "results", "attendance", "exams", "notices", "feedback"];
const titles = { home: "Dashboard", profile: "Profile", courses: "Courses", results: "Results", attendance: "Attendance", exams: "Exams", notices: "Notice Board", feedback: "Feedback" };
let calYear;
let calMonth;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function showDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(); }
function showMsg(id, text, ok) { const element = $(id); element.textContent = text; element.className = text ? `msg ${ok ? "ok" : "err"}` : "msg"; }
function courseIdOf(item) { return String(item.courseId?._id || item.courseId); }
function courseName(course) { return course.courseName || "Course"; }
function gradeFor(percent) {
    if (percent >= 90) return "A+"; if (percent >= 80) return "A"; if (percent >= 70) return "B+";
    if (percent >= 60) return "B"; if (percent >= 50) return "C"; if (percent >= 40) return "D"; return "F";
}
function pointFor(percent) { return percent >= 90 ? 10 : percent >= 80 ? 9 : percent >= 70 ? 8 : percent >= 60 ? 7 : percent >= 50 ? 6 : percent >= 40 ? 5 : 0; }
function gradeBadge(grade) {
    const type = grade === "F" ? "fail" : ["C", "D"].includes(grade) ? "low" : ["B", "B+"].includes(grade) ? "mid" : "";
    return `<span class="grade ${type}">${grade}</span>`;
}
async function api(path, options = {}) {
    const response = await fetch(`${baseUrl}/student${path}`, {
        method: options.method || "GET", credentials: "include",
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json();
    if (!response.ok || !data.status) throw new Error(data.message || "Request failed");
    return data;
}

function courseRows() {
    return state.courses.map((course) => {
        const results = state.results.filter((item) => courseIdOf(item) === course._id);
        const obtained = results.reduce((sum, item) => sum + item.marksObtained, 0);
        const total = results.reduce((sum, item) => sum + item.totalMarks, 0);
        return { course, percent: total ? (obtained / total) * 100 : null };
    });
}
function cgpa() {
    const rows = courseRows().filter((row) => row.percent !== null);
    return rows.length ? rows.reduce((sum, row) => sum + pointFor(row.percent), 0) / rows.length : 0;
}
function attendanceFor(courseId = null) {
    const records = state.attendance.filter((item) => !courseId || courseIdOf(item) === courseId);
    const present = records.filter((item) => item.status === "present").length;
    return { records, present, late: records.filter((item) => item.status === "late").length, percent: records.length ? Math.round((present / records.length) * 100) : 0 };
}

function renderHome() {
    const hour = new Date().getHours();
    $("greeting").textContent = `${hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"} 👋`;
    $("bannerName").textContent = `${state.student.name}!`;
    $("stCgpa").textContent = cgpa().toFixed(2);
    $("stCourses").textContent = state.courses.length;
    $("stExams").textContent = state.results.length;
    $("stRank").textContent = state.ranking.rank || "-";
    $("stRankOf").textContent = `out of ${state.ranking.classSize || 0}`;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonth = state.schoolAttendance.monthlySummary?.find((month) => month.month === currentMonth);
    $("stAtt").textContent = state.schoolAttendanceError ? "—" : `${thisMonth?.percentage || 0}%`;
    const recent = [...state.results].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    $("recentBody").innerHTML = recent.map((result) => {
        const percent = result.totalMarks ? result.marksObtained * 100 / result.totalMarks : 0;
        return `<tr><td>${escapeHtml(result.courseId?.courseName)}</td><td>${escapeHtml(result.examType)}</td><td>${gradeBadge(gradeFor(percent))}</td><td>${result.marksObtained}/${result.totalMarks}</td><td>${showDate(result.date)}</td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="5">No results yet.</td></tr>';
    $("homeNotices").innerHTML = state.notices.slice(0, 3).map((notice) =>
        `<div class="notice"><b>${escapeHtml(notice.title)}</b><p>${escapeHtml(notice.text)}</p><small>${showDate(notice.createdAt)} · ${escapeHtml(notice.authorName)}</small></div>`
    ).join("") || '<p class="muted">No notices.</p>';
    const scores = courseRows().filter((row) => row.percent !== null).map((row) => row.percent);
    const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
    const bands = [scores.filter((value) => value >= 80).length, scores.filter((value) => value >= 60 && value < 80).length, scores.filter((value) => value >= 40 && value < 60).length, scores.filter((value) => value < 40).length];
    const total = scores.length || 1;
    const angles = [bands[0] / total * 100, (bands[0] + bands[1]) / total * 100, (bands[0] + bands[1] + bands[2]) / total * 100];
    $("donut").style.background = scores.length ? `conic-gradient(#22a45d 0 ${angles[0]}%, #3b82f6 ${angles[0]}% ${angles[1]}%, #f59e0b ${angles[1]}% ${angles[2]}%, #ef4444 ${angles[2]}% 100%)` : "#ccc";
    $("donutText").textContent = `${average}%`;
    $("legend").innerHTML = [`Excellent (80+): ${bands[0]}`, `Good (60-79): ${bands[1]}`, `Average (40-59): ${bands[2]}`, `Needs improvement: ${bands[3]}`].map((label) => `<li>${escapeHtml(label)}</li>`).join("");
}

function renderProfile() {
    const student = state.student;
    $("profileInfo").innerHTML = `<p><span>Name</span><b>${escapeHtml(student.name)}</b></p><p><span>Roll No</span><b>${escapeHtml(student.rollNo)}</b></p><p><span>Class</span><b>${escapeHtml(student.className)}</b></p><p><span>Section</span><b>${escapeHtml(student.group)}</b></p><p><span>Email</span><b>${escapeHtml(student.email)}</b></p><p><span>Phone</span><b>${escapeHtml(student.phone || "-")}</b></p>`;
    $("pEmail").value = student.email; $("pPhone").value = student.phone || ""; $("pOld").value = ""; $("pNew").value = "";
}

function renderCourses() {
    $("coursesBody").innerHTML = courseRows().map(({ course, percent }) => {
        const attendance = attendanceFor(course._id).percent;
        return `<tr><td><b>${escapeHtml(course.courseCode)}</b></td><td>${escapeHtml(course.courseName)}</td><td>${escapeHtml(course.assignedTeacher?.name || "-")}</td><td>${attendance}%</td><td>${percent === null ? "-" : `${percent.toFixed(1)}%`}</td><td>${percent === null ? "-" : gradeBadge(gradeFor(percent))}</td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="6">No courses available.</td></tr>';
}

function renderResults() {
    const rows = courseRows();
    $("rCgpa").textContent = cgpa().toFixed(2);
    $("rRank").textContent = `${state.ranking.rank || "-"} / ${state.ranking.classSize || 0}`;
    const scored = rows.filter((row) => row.percent !== null);
    const average = scored.length ? scored.reduce((sum, row) => sum + row.percent, 0) / scored.length : 0;
    $("rAvg").textContent = `${average.toFixed(1)}%`;
    $("summaryBody").innerHTML = rows.map(({ course, percent }) =>
        `<tr><td>${escapeHtml(course.courseName)}</td><td>${percent === null ? "-" : `${percent.toFixed(1)}%`}</td><td>${percent === null ? "-" : gradeBadge(gradeFor(percent))}</td><td>${percent === null ? "-" : pointFor(percent)}</td></tr>`
    ).join("") || '<tr><td class="empty" colspan="4">No courses.</td></tr>';
    const all = [...state.results].sort((a, b) => new Date(b.date) - new Date(a.date));
    $("allResultsBody").innerHTML = all.map((result) => {
        const percent = result.totalMarks ? result.marksObtained * 100 / result.totalMarks : 0;
        return `<tr><td>${escapeHtml(result.courseId?.courseName)}</td><td>${escapeHtml(result.examType)}</td><td>${result.marksObtained}/${result.totalMarks}</td><td>${percent.toFixed(1)}%</td><td>${gradeBadge(gradeFor(percent))}</td><td>${showDate(result.date)}</td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="6">No results yet.</td></tr>';
}

function renderAttendance() {
    const list = state.courses.map((course) => {
        const attendance = attendanceFor(course._id);
        const color = attendance.percent >= 85 ? "" : attendance.percent >= 75 ? "orange" : "red";
        return `<div class="att-box"><div class="row"><b>${escapeHtml(course.courseName)}</b><b>${attendance.percent}%</b></div><div class="bar"><i class="${color}" style="width:${attendance.percent}%"></i></div><small class="muted">${attendance.present} present, ${attendance.late} late of ${attendance.records.length} classes</small></div>`;
    }).join("");
    const overall = attendanceFor();
    const warning = overall.records.length && overall.percent < 75 ? '<p class="msg err">Your overall attendance is below 75%.</p>' : "";
    $("attList").innerHTML = `<p>Overall: <b>${overall.percent}%</b></p>${warning}${list || '<p class="muted">No attendance records.</p>'}`;
}

function renderMonthlyAttendance() {
    const months = state.schoolAttendance.monthlySummary || [];
    if (state.schoolAttendanceError) {
        $("monthlyAttendance").innerHTML = `<tr><td class="empty" colspan="6">${escapeHtml(state.schoolAttendanceError)}</td></tr>`;
        return;
    }
    $("monthlyAttendance").innerHTML = months.map((month) =>
        `<tr><td><b>${escapeHtml(new Date(`${month.month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" }))}</b></td><td>${month.present}</td><td>${month.late}</td><td>${month.absent}</td><td>${month.total}</td><td><span class="pill ${month.percentage >= 75 ? "green" : "red"}">${month.percentage}%</span></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="6">No class attendance has been recorded yet.</td></tr>';
}

function renderStudentQr(data) {
    if (!window.QRCode) throw new Error("QR code library did not load. Check your internet connection and reload.");
    $("studentQrCode").replaceChildren();
    $("studentQrName").textContent = data.student.name;
    $("studentQrDetails").textContent = `Roll No: ${data.student.rollNo} · Class ${data.student.className}`;
    new window.QRCode($("studentQrCode"), {
        text: data.qrPayload,
        width: 200,
        height: 200,
        correctLevel: window.QRCode.CorrectLevel.M
    });
    $("downloadStudentQr").disabled = false;
}

function drawCalendar() {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    $("calTitle").textContent = `${names[calMonth]} ${calYear}`;
    const firstDay = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
    const days = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date().toISOString().slice(0, 10);
    const examDates = new Set(state.exams.map((exam) => String(exam.date).slice(0, 10)));
    let html = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<div class="dow">${day}</div>`).join("");
    html += "<div></div>".repeat(firstDay);
    for (let day = 1; day <= days; day++) {
        const date = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const classes = ["day", date === today ? "today" : "", examDates.has(date) ? "exam" : ""].filter(Boolean).join(" ");
        html += `<div class="${classes}" title="${examDates.has(date) ? "Exam" : ""}">${day}</div>`;
    }
    $("calGrid").innerHTML = html;
}

function renderExams() {
    const exams = [...state.exams].sort((a, b) => new Date(a.date) - new Date(b.date));
    const today = new Date().toISOString().slice(0, 10);
    $("examsBody").innerHTML = exams.map((exam) => {
        const date = String(exam.date).slice(0, 10);
        const status = date < today ? '<span class="pill">Completed</span>' : date === today ? '<span class="pill red">Today</span>' : '<span class="pill purple">Upcoming</span>';
        return `<tr><td>${escapeHtml(exam.courseId?.courseName)}</td><td>${escapeHtml(exam.examType)}</td><td>${showDate(exam.date)}</td><td>${escapeHtml(exam.time)}</td><td>${escapeHtml(exam.room)}</td><td>${status}</td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="6">No exams scheduled.</td></tr>';
}
function renderNotices() {
    const html = state.notices.map((notice) => `<div class="notice"><b>${escapeHtml(notice.title)}</b><p>${escapeHtml(notice.text)}</p><small>${showDate(notice.createdAt)} · ${escapeHtml(notice.authorName)}</small></div>`).join("");
    $("allNotices").innerHTML = html || '<p class="muted">No notices.</p>';
}
function renderFeedback() {
    $("myFeedback").innerHTML = state.feedback.map((item) => `<div class="notice"><b>${escapeHtml(item.subject)} — ${item.rating}/5</b><p>${escapeHtml(item.message)}</p><small>${showDate(item.createdAt)}</small></div>`).join("") || '<p class="muted">You have not sent any feedback yet.</p>';
}

function showSection(name) {
    sections.forEach((section) => $(section).classList.toggle("hide", section !== name));
    $("pageTitle").textContent = titles[name];
    document.querySelectorAll("#menu li").forEach((item) => item.classList.toggle("active", item.dataset.sec === name));
    $("sidebar").classList.remove("open");
}
document.querySelectorAll("#menu li").forEach((item) => item.addEventListener("click", () => showSection(item.dataset.sec)));
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

$("saveProfile").addEventListener("click", async () => {
    try {
        const body = { email: $("pEmail").value.trim(), phone: $("pPhone").value.trim() };
        if ($("pNew").value) { body.currentPassword = $("pOld").value; body.newPassword = $("pNew").value; }
        const data = await api("/profile", { method: "PATCH", body });
        state.student = data.user; $("userName").textContent = data.user.name; renderProfile(); showMsg("profileMsg", "Profile updated.", true);
    } catch (error) { showMsg("profileMsg", error.message, false); }
});

$("sendFeedback").addEventListener("click", async () => {
    try {
        const body = { subject: $("fSubject").value.trim(), rating: Number($("fRating").value), message: $("fMessage").value.trim() };
        if (!body.subject || !body.message) throw new Error("Subject and message are required.");
        await api("/feedback", { method: "POST", body });
        $("fSubject").value = ""; $("fMessage").value = "";
        const data = await api("/feedback"); state.feedback = data.feedback; renderFeedback(); showMsg("feedbackMsg", "Feedback submitted.", true);
    } catch (error) { showMsg("feedbackMsg", error.message, false); }
});

$("printBtn").addEventListener("click", () => window.print());
$("downloadStudentQr").addEventListener("click", () => {
    const canvas = $("studentQrCode").querySelector("canvas");
    const image = $("studentQrCode").querySelector("img");
    const source = canvas?.toDataURL("image/png") || image?.src;
    if (!source) {
        showMsg("studentQrMsg", "Your QR code is not ready yet.", false);
        return;
    }
    const link = document.createElement("a");
    link.href = source;
    link.download = `attendance-qr-${state.student.rollNo}.png`;
    link.click();
});
$("calPrev").addEventListener("click", () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } drawCalendar(); });
$("calNext").addEventListener("click", () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } drawCalendar(); });
$("logoutBtn").addEventListener("click", async () => { try { await api("/logout", { method: "POST" }); } finally { window.location.replace("student-login.html"); } });

const themeBtn = $("themeBtn");
let theme = localStorage.getItem("srms_theme") || "light";
document.documentElement.setAttribute("data-theme", theme);
themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
themeBtn.addEventListener("click", () => { theme = theme === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("srms_theme", theme); themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark"; });

async function initialize() {
    try {
        const profile = await api("/me"); state.student = profile.user;
        $("userName").textContent = state.student.name; $("avatar").textContent = state.student.name.charAt(0);
        const [courses, results, attendance, exams, notices, feedback, ranking] = await Promise.all([
            api("/courses"), api("/results"), api("/attendance"), api("/exams"), api("/notices"), api("/feedback"), api("/ranking")
        ]);
        state.courses = courses.courses; state.results = results.results; state.attendance = attendance.attendance;
        state.exams = exams.exams; state.notices = notices.notices; state.feedback = feedback.feedback; state.ranking = ranking;
        try {
            state.schoolAttendance = await api("/school-attendance");
        } catch (error) {
            state.schoolAttendanceError = `Unable to load monthly attendance: ${error.message}`;
        }
        const now = new Date(); calYear = now.getFullYear(); calMonth = now.getMonth();
        renderHome(); renderProfile(); renderCourses(); renderResults(); renderAttendance(); renderMonthlyAttendance(); renderExams(); renderNotices(); renderFeedback(); drawCalendar();
        try {
            renderStudentQr(await api("/attendance/qr"));
        } catch (error) {
            $("downloadStudentQr").disabled = true;
            showMsg("studentQrMsg", error.message, false);
        }
    } catch { window.location.replace("student-login.html"); }
}
initialize();