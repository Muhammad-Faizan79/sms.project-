import { baseUrl } from "./baseUrl.js";

const $ = (id) => document.getElementById(id);
const state = { teacher: null, courses: [], students: [], results: [], attendance: [], schoolAttendance: [], notices: [] };
let editResultId = null;
let attendanceLoadedFor = null;
let schoolAttendanceLoadedFor = null;
let qrScanner = null;
let qrScanBusy = false;
let scanRetryAfter = 0;
const scannedQrPayloads = new Set();

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function todayText() { return new Date().toISOString().slice(0, 10); }
function showDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString(); }
function showMsg(id, text, ok) { const element = $(id); element.textContent = text; element.className = text ? `msg ${ok ? "ok" : "err"}` : "msg"; }
function studentIdOf(result) { return String(result.studentId?._id || result.studentId); }
function courseIdOf(result) { return String(result.courseId?._id || result.courseId); }
function courseFor(id) { return state.courses.find((course) => course._id === String(id)) || {}; }
function studentFor(id) { return state.students.find((student) => student._id === String(id)) || {}; }
function percentForResult(result) { return result.totalMarks ? result.marksObtained * 100 / result.totalMarks : 0; }
function schoolClassOf(student) { return String(student.className || "").replace(/^class\s*/i, "").trim(); }
function schoolAttendanceStudentId(item) { return String(item.studentId?._id || item.studentId); }

async function api(path, options = {}) {
    const response = await fetch(`${baseUrl}/teacher${path}`, {
        method: options.method || "GET", credentials: "include",
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json();
    if (!response.ok || !data.status) throw new Error(data.message || "Request failed");
    return data;
}

function renderHome() {
    const hour = new Date().getHours();
    $("greeting").textContent = `${hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"} 👋`;
    $("bannerName").textContent = `${state.teacher.name}!`;
    $("stCourses").textContent = state.courses.length;
    $("stStudents").textContent = state.students.length;
    $("stResults").textContent = state.results.length;
    const average = state.results.length ? state.results.reduce((sum, item) => sum + percentForResult(item), 0) / state.results.length : 0;
    $("stAvg").textContent = `${average.toFixed(1)}%`;
    $("homeCourses").innerHTML = state.courses.map((course) => {
        const results = state.results.filter((item) => courseIdOf(item) === course._id);
        const score = results.length ? results.reduce((sum, item) => sum + percentForResult(item), 0) / results.length : 0;
        const records = state.attendance.filter((item) => String(item.courseId?._id || item.courseId) === course._id);
        const present = records.filter((item) => item.status === "present").length;
        const attendancePercent = records.length ? Math.round((present / records.length) * 100) : 0;
        return `<tr><td><b>${escapeHtml(course.courseCode)}</b> ${escapeHtml(course.courseName)}</td><td>${score.toFixed(1)}%</td><td>${attendancePercent}%</td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="3">No courses assigned.</td></tr>';
    $("homeResults").innerHTML = state.results.slice(0, 6).map((result) =>
        `<tr><td>${escapeHtml(result.studentId?.name || "Student")}</td><td>${escapeHtml(result.courseId?.courseName || "Course")}</td><td>${escapeHtml(result.examType)}</td><td>${result.marksObtained}/${result.totalMarks}</td></tr>`
    ).join("") || '<tr><td class="empty" colspan="4">No results yet.</td></tr>';
}

function fillCourseSelects() {
    const options = state.courses.map((course) => `<option value="${course._id}">${escapeHtml(course.courseCode)} - ${escapeHtml(course.courseName)}</option>`).join("");
    const markCourse = $("mCourse").value;
    const attendanceCourse = $("aCourse").value;
    $("mCourse").innerHTML = options;
    $("aCourse").innerHTML = options;
    if (state.courses.some((course) => course._id === markCourse)) $("mCourse").value = markCourse;
    if (state.courses.some((course) => course._id === attendanceCourse)) $("aCourse").value = attendanceCourse;
    $("mStudent").innerHTML = state.students.map((student) => `<option value="${student._id}">${escapeHtml(student.rollNo)} - ${escapeHtml(student.name)}</option>`).join("");
}

function renderResults() {
    $("marksBody").innerHTML = state.results.map((result) => {
        const percent = percentForResult(result);
        return `<tr><td>${escapeHtml(result.studentId?.name || "Student")}</td><td>${escapeHtml(result.courseId?.courseName || "Course")}</td><td>${escapeHtml(result.examType)}</td><td>${result.marksObtained}/${result.totalMarks}</td><td>${percent.toFixed(1)}%</td><td>${showDate(result.date)}</td><td><button class="btn small" data-action="edit-result" data-id="${result._id}">Edit</button><button class="btn small danger" data-action="delete-result" data-id="${result._id}">Delete</button></td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="7">No results entered yet.</td></tr>';
}

function renderStudents() {
    $("studentsBody").innerHTML = state.students.map((student) => {
        const results = state.results.filter((result) => studentIdOf(result) === student._id);
        const average = results.length ? results.reduce((sum, result) => sum + percentForResult(result), 0) / results.length : null;
        return `<tr><td><b>${escapeHtml(student.rollNo)}</b></td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.email)}</td><td>${average == null ? "-" : `${average.toFixed(1)}%`}</td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="4">No students yet.</td></tr>';
}

function renderNotices() {
    $("noticesBody").innerHTML = state.notices.map((notice) =>
        `<tr><td><b>${escapeHtml(notice.title)}</b></td><td>${escapeHtml(notice.text)}</td><td>${showDate(notice.createdAt)}</td><td><button class="btn small danger" data-action="delete-notice" data-id="${notice._id}">Delete</button></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="4">No notices posted.</td></tr>';
}

function renderAttendanceSummary() {
    const courseId = $("aCourse").value;
    $("aSummary").innerHTML = state.students.map((student) => {
        const records = state.attendance.filter((item) => String(item.studentId?._id || item.studentId) === student._id && String(item.courseId?._id || item.courseId) === courseId);
        const present = records.filter((item) => item.status === "present").length;
        const late = records.filter((item) => item.status === "late").length;
        const percentage = records.length ? Math.round((present / records.length) * 100) : 0;
        return `<tr><td>${escapeHtml(student.name)}</td><td>${present}</td><td>${late}</td><td>${records.length}</td><td><span class="pill ${percentage >= 75 ? "green" : "red"}">${percentage}%</span></td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="5">No attendance records.</td></tr>';
}

function renderSchoolAttendanceRows() {
    const className = $("saClass").value;
    const byStudent = new Map(state.schoolAttendance.map((item) => [schoolAttendanceStudentId(item), item.status]));
    const roster = state.students.filter((student) => schoolClassOf(student) === className);
    $("schoolAttendanceBody").innerHTML = roster.map((student) => {
        const status = byStudent.get(student._id) || "absent";
        return `<tr><td><b>${escapeHtml(student.rollNo)}</b></td><td>${escapeHtml(student.name)}</td><td><select class="attendance-status" id="school_att_${student._id}" aria-label="Attendance status for ${escapeHtml(student.name)}"><option value="present" ${status === "present" ? "selected" : ""}>Present</option><option value="absent" ${status === "absent" ? "selected" : ""}>Absent</option><option value="late" ${status === "late" ? "selected" : ""}>Late</option></select></td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="3">No students are registered in this class.</td></tr>';
    $("schoolAttendanceBox").classList.remove("hide");
}

async function loadSchoolAttendance() {
    const className = $("saClass").value;
    const date = $("saDate").value;
    if (!className || !date) throw new Error("Choose a class and school date.");
    if (date > todayText()) throw new Error("Future attendance cannot be recorded.");
    const data = await api(`/school-attendance?className=${encodeURIComponent(className)}&date=${encodeURIComponent(date)}`);
    state.schoolAttendance = data.attendance;
    schoolAttendanceLoadedFor = { className, date };
    scannedQrPayloads.clear();
    renderSchoolAttendanceRows();
}

async function stopSchoolScanner() {
    if (!qrScanner) return;
    try {
        await qrScanner.stop();
        await qrScanner.clear();
    } finally {
        qrScanner = null;
        $("attendanceQrReader").classList.add("hide");
        $("stopSchoolScanner").classList.add("hide");
        $("startSchoolScanner").classList.remove("hide");
    }
}

async function handleStudentQr(qrPayload) {
    if (qrScanBusy || scannedQrPayloads.has(qrPayload) || Date.now() < scanRetryAfter) return;
    qrScanBusy = true;
    try {
        const className = $("saClass").value;
        const date = $("saDate").value;
        const data = await api("/school-attendance/scan", {
            method: "POST",
            body: { qrPayload, className, date }
        });
        const studentId = schoolAttendanceStudentId(data.attendance);
        state.schoolAttendance = state.schoolAttendance.filter((item) => schoolAttendanceStudentId(item) !== studentId);
        state.schoolAttendance.push(data.attendance);
        scannedQrPayloads.add(qrPayload);
        renderSchoolAttendanceRows();
        showMsg("schoolAttendanceMsg", `${data.attendance.studentId.name} marked present.`, true);
    } catch (error) {
        scanRetryAfter = Date.now() + 1500;
        if (error.message.includes("already recorded")) scannedQrPayloads.add(qrPayload);
        showMsg("schoolAttendanceMsg", error.message, false);
    } finally {
        qrScanBusy = false;
    }
}

async function refreshAll() {
    const [courses, students, results, attendance, notices] = await Promise.all([
        api("/courses"), api("/students"), api("/results"), api("/attendance"), api("/notices")
    ]);
    state.courses = courses.courses;
    state.students = students.students;
    state.results = results.results;
    state.attendance = attendance.attendance;
    state.notices = notices.notices;
    fillCourseSelects(); renderHome(); renderResults(); renderStudents(); renderNotices(); renderAttendanceSummary();
}

function showSection(name) {
    ["home", "marks", "attendance", "students", "notices", "profile"].forEach((section) => $(section).classList.toggle("hide", section !== name));
    $("pageTitle").textContent = ({ home: "Dashboard", marks: "Enter Marks", attendance: "Attendance", students: "Students", notices: "Notices", profile: "Profile" })[name];
    document.querySelectorAll("#menu li").forEach((item) => item.classList.toggle("active", item.dataset.sec === name));
    $("sidebar").classList.remove("open");
}
document.querySelectorAll("#menu li").forEach((item) => item.addEventListener("click", () => showSection(item.dataset.sec)));
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

function clearResultForm() {
    editResultId = null; $("mMarks").value = ""; $("mTotal").value = "100"; $("mDate").value = todayText();
    $("mTitle").textContent = "Add Result"; $("mSave").textContent = "Save Result"; $("mCancel").classList.add("hide");
}
$("mSave").addEventListener("click", async () => {
    try {
        const body = { courseId: $("mCourse").value, studentId: $("mStudent").value, examType: $("mExam").value, marksObtained: Number($("mMarks").value), totalMarks: Number($("mTotal").value), date: $("mDate").value };
        if (!body.courseId || !body.studentId || !body.date || body.totalMarks <= 0 || body.marksObtained < 0 || body.marksObtained > body.totalMarks) throw new Error("Choose course, student, date, and enter valid marks.");
        await api(editResultId ? `/results/${editResultId}` : "/results", { method: editResultId ? "PATCH" : "POST", body });
        clearResultForm(); await refreshAll(); showMsg("mMsg", "Result saved.", true);
    } catch (error) { showMsg("mMsg", error.message, false); }
});
$("mCancel").addEventListener("click", clearResultForm);

$("aLoad").addEventListener("click", async () => {
    const courseId = $("aCourse").value;
    const date = $("aDate").value;
    if (!courseId || !date) { showMsg("aMsg", "Choose a course and date.", false); return; }
    if (date > todayText()) { showMsg("aMsg", "Future attendance cannot be recorded.", false); return; }
    try {
        const data = await api(`/attendance?courseId=${encodeURIComponent(courseId)}&date=${encodeURIComponent(date)}`);
        const byStudent = new Map(data.attendance.map((item) => [String(item.studentId?._id || item.studentId), item.status]));
        $("aBody").innerHTML = state.students.map((student) => {
            const status = byStudent.get(student._id) || "present";
            return `<tr><td>${escapeHtml(student.rollNo)}</td><td>${escapeHtml(student.name)}</td><td><select class="attendance-status" id="att_${student._id}" aria-label="Attendance status for ${escapeHtml(student.name)}"><option value="present" ${status === "present" ? "selected" : ""}>Present</option><option value="absent" ${status === "absent" ? "selected" : ""}>Absent</option><option value="late" ${status === "late" ? "selected" : ""}>Late</option></select></td></tr>`;
        }).join("") || '<tr><td class="empty" colspan="3">No students found.</td></tr>';
        $("aBox").classList.remove("hide"); attendanceLoadedFor = { courseId, date }; showMsg("aMsg", "", true);
    } catch (error) { showMsg("aMsg", error.message, false); }
});

$("loadSchoolAttendance").addEventListener("click", async () => {
    try {
        await loadSchoolAttendance();
        showMsg("schoolAttendanceMsg", "Class attendance loaded. Students not scanned are marked absent when saved.", true);
    } catch (error) { showMsg("schoolAttendanceMsg", error.message, false); }
});

$("saveSchoolAttendance").addEventListener("click", async () => {
    const className = $("saClass").value;
    const date = $("saDate").value;
    if (!schoolAttendanceLoadedFor || schoolAttendanceLoadedFor.className !== className || schoolAttendanceLoadedFor.date !== date) {
        showMsg("schoolAttendanceMsg", "Load the class list again for the selected class and date.", false);
        return;
    }
    try {
        const roster = state.students.filter((student) => schoolClassOf(student) === className);
        if (!roster.length) throw new Error("No students are registered in this class.");
        const records = roster.map((student) => ({
            studentId: student._id,
            status: $(`school_att_${student._id}`).value
        }));
        await api("/school-attendance", { method: "POST", body: { className, date, records } });
        await loadSchoolAttendance();
        showMsg("schoolAttendanceMsg", `Class ${className} attendance saved for ${showDate(date)}.`, true);
    } catch (error) { showMsg("schoolAttendanceMsg", error.message, false); }
});

$("startSchoolScanner").addEventListener("click", async () => {
    try {
        if (!window.Html5Qrcode) throw new Error("QR scanner could not load. Check your internet connection and reload.");
        if (!window.isSecureContext && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
            throw new Error("Camera access requires HTTPS or localhost. Open this site using a secure connection.");
        }
        const className = $("saClass").value;
        const date = $("saDate").value;
        if (!schoolAttendanceLoadedFor || schoolAttendanceLoadedFor.className !== className || schoolAttendanceLoadedFor.date !== date) {
            await loadSchoolAttendance();
        }
        $("attendanceQrReader").classList.remove("hide");
        qrScanner = new window.Html5Qrcode("attendanceQrReader");
        const cameras = await window.Html5Qrcode.getCameras();
        if (!cameras.length) throw new Error("No camera found. Connect a camera and allow browser camera permission.");
        const camera = cameras.find((item) => /back|rear|environment|world/i.test(item.label)) || cameras[0];
        const format = window.Html5QrcodeSupportedFormats?.QR_CODE;
        await qrScanner.start(
            camera.id,
            { fps: 10, qrbox: { width: 250, height: 250 }, disableFlip: false, ...(format ? { formatsToSupport: [format] } : {}) },
            handleStudentQr,
            () => {}
        );
        $("startSchoolScanner").classList.add("hide");
        $("stopSchoolScanner").classList.remove("hide");
        showMsg("schoolAttendanceMsg", `Camera ready (${camera.label || "camera"}). Hold a student's QR code steady in the frame.`, true);
    } catch (error) {
        if (qrScanner) {
            try { await stopSchoolScanner(); } catch { qrScanner = null; }
        }
        const message = error.name === "NotAllowedError" || /permission denied|not allowed/i.test(error.message)
            ? "Camera permission is blocked. Allow camera access for this site in your browser settings, then try again."
            : error.name === "NotFoundError" || /no camera found/i.test(error.message)
                ? "No usable camera was found. Connect a camera and reload the page."
                : error.name === "NotReadableError" || /already in use|could not start video source/i.test(error.message)
                    ? "The camera may be in use by another app or browser tab. Close it and retry."
                    : error.message || "Unable to start the camera.";
        showMsg("schoolAttendanceMsg", message, false);
    }
});

$("stopSchoolScanner").addEventListener("click", async () => {
    try {
        await stopSchoolScanner();
        showMsg("schoolAttendanceMsg", "QR scanner stopped.", true);
    } catch (error) { showMsg("schoolAttendanceMsg", error.message, false); }
});

$("aSave").addEventListener("click", async () => {
    const courseId = $("aCourse").value;
    const date = $("aDate").value;
    if (!attendanceLoadedFor || attendanceLoadedFor.courseId !== courseId || attendanceLoadedFor.date !== date) {
        showMsg("aMsg", "Show students again for the selected course and date.", false); return;
    }
    try {
        const records = state.students.map((student) => ({ studentId: student._id, status: $(`att_${student._id}`).value }));
        await api("/attendance", { method: "POST", body: { courseId, date, records } });
        const latest = await api("/attendance"); state.attendance = latest.attendance;
        renderAttendanceSummary(); renderHome(); showMsg("aMsg", `Attendance saved for ${showDate(date)}.`, true);
    } catch (error) { showMsg("aMsg", error.message, false); }
});
$("aCourse").addEventListener("change", renderAttendanceSummary);

$("nSave").addEventListener("click", async () => {
    try {
        const body = { title: $("nTitle").value.trim(), text: $("nText").value.trim() };
        if (!body.title || !body.text) throw new Error("Title and message are required.");
        await api("/notices", { method: "POST", body });
        $("nTitle").value = ""; $("nText").value = "";
        const notices = await api("/notices"); state.notices = notices.notices; renderNotices(); showMsg("nMsg", "Notice posted.", true);
    } catch (error) { showMsg("nMsg", error.message, false); }
});

$("saveProfile").addEventListener("click", async () => {
    try {
        const body = { email: $("pEmail").value.trim() };
        if ($("pNew").value) { body.currentPassword = $("pOld").value; body.newPassword = $("pNew").value; }
        const data = await api("/profile", { method: "PATCH", body });
        state.teacher = data.user; $("userName").textContent = data.user.name; fillProfile(); showMsg("profileMsg", "Profile updated.", true);
    } catch (error) { showMsg("profileMsg", error.message, false); }
});

function fillProfile() {
    $("profileInfo").innerHTML = `<p><span>Name</span><b>${escapeHtml(state.teacher.name)}</b></p><p><span>Teacher ID</span><b>${escapeHtml(state.teacher.teacherCode)}</b></p><p><span>Subjects</span><b>${escapeHtml(state.teacher.subject)}</b></p><p><span>Email</span><b>${escapeHtml(state.teacher.email)}</b></p><p><span>Courses</span><b>${state.courses.length}</b></p>`;
    $("pEmail").value = state.teacher.email; $("pOld").value = ""; $("pNew").value = "";
}

document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const result = state.results.find((item) => item._id === button.dataset.id);
    try {
        if (button.dataset.action === "edit-result" && result) {
            editResultId = result._id; $("mCourse").value = courseIdOf(result); $("mStudent").value = studentIdOf(result);
            $("mExam").value = result.examType; $("mMarks").value = result.marksObtained; $("mTotal").value = result.totalMarks;
            $("mDate").value = String(result.date).slice(0, 10); $("mTitle").textContent = "Edit Result";
            $("mSave").textContent = "Update Result"; $("mCancel").classList.remove("hide"); showSection("marks");
        } else if (button.dataset.action === "delete-result") {
            if (!confirm("Delete this result?")) return;
            await api(`/results/${button.dataset.id}`, { method: "DELETE" }); await refreshAll();
        } else if (button.dataset.action === "delete-notice") {
            if (!confirm("Delete this notice?")) return;
            await api(`/notices/${button.dataset.id}`, { method: "DELETE" });
            const notices = await api("/notices"); state.notices = notices.notices; renderNotices();
        }
    } catch (error) { alert(error.message); }
});

$("logoutBtn").addEventListener("click", async () => {
    try { await api("/logout", { method: "POST" }); } finally { window.location.replace("teacher-login.html"); }
});
const themeBtn = $("themeBtn");
let theme = localStorage.getItem("srms_theme") || "light";
document.documentElement.setAttribute("data-theme", theme);
themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
themeBtn.addEventListener("click", () => { theme = theme === "dark" ? "light" : "dark"; document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("srms_theme", theme); themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark"; });

async function initialize() {
    try {
        const profile = await api("/me"); state.teacher = profile.user;
        $("userName").textContent = state.teacher.name;
        $("avatar").textContent = state.teacher.name.replace("Dr. ", "").replace("Prof. ", "").charAt(0);
        $("aDate").value = todayText(); $("saDate").value = todayText(); $("mDate").value = todayText();
        await refreshAll(); clearResultForm(); fillProfile(); renderHome();
    } catch { window.location.replace("teacher-login.html"); }
}
initialize();