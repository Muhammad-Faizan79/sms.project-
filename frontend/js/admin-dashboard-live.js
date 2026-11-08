import { baseUrl } from "./baseUrl.js";

const state = { admin: null, students: [], teachers: [], courses: [], results: [], exams: [], notices: [], feedback: [] };
const $ = (id) => document.getElementById(id);
const sections = ["home", "students", "teachers", "courses", "results", "exams", "notices", "feedback", "settings"];
const titles = { home: "Dashboard", students: "Students", teachers: "Teachers", courses: "Courses", results: "Results", exams: "Exams", notices: "Notices", feedback: "Feedback", settings: "Settings" };
let editStudentId = null;
let editTeacherId = null;
let editCourseId = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function dateInput(value) {
    return value ? String(value).slice(0, 10) : "-";
}

function showDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function showMsg(id, text, ok) {
    const element = $(id);
    element.textContent = text;
    element.className = text ? `msg ${ok ? "ok" : "err"}` : "msg";
}

async function api(path, options = {}) {
    const response = await fetch(`${baseUrl}/auth${path}`, {
        method: options.method || "GET",
        credentials: "include",
        headers: options.body ? { "Content-Type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await response.json();
    if (!response.ok || !data.status) throw new Error(data.message || "Request failed");
    return data;
}

function averageFor(studentId) {
    const results = state.results.filter((result) => String(result.studentId?._id || result.studentId) === String(studentId));
    if (!results.length) return 0;
    return results.reduce((sum, result) => sum + (result.marksObtained / result.totalMarks) * 100, 0) / results.length;
}

function gradeFor(percent) {
    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B+";
    if (percent >= 60) return "B";
    if (percent >= 50) return "C";
    if (percent >= 40) return "D";
    return "F";
}

function gradeBadge(grade) {
    const type = grade === "F" ? "fail" : ["C", "D"].includes(grade) ? "low" : ["B", "B+"].includes(grade) ? "mid" : "";
    return `<span class="grade ${type}">${grade}</span>`;
}

function renderHome() {
    const hour = new Date().getHours();
    $("greeting").textContent = `${hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening"} 👋`;
    $("stStudents").textContent = state.students.length;
    $("stTeachers").textContent = state.teachers.length;
    $("stCourses").textContent = state.courses.length;
    $("stResults").textContent = state.results.length;
    const passed = state.results.filter((result) => (result.marksObtained / result.totalMarks) * 100 >= 40).length;
    $("stPass").textContent = `${state.results.length ? Math.round((passed / state.results.length) * 100) : 0}%`;

    const topStudents = state.students.map((student) => ({ student, average: averageFor(student._id) }))
        .sort((a, b) => b.average - a.average).slice(0, 5);
    $("topBody").innerHTML = topStudents.map(({ student, average }, index) =>
        `<tr><td>${index + 1}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.rollNo)}</td><td><b>${average.toFixed(1)}%</b></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="4">No students yet.</td></tr>';

    const grades = ["A+", "A", "B+", "B", "C", "D", "F"];
    const counts = grades.map((grade) => state.results.filter((result) => gradeFor((result.marksObtained / result.totalMarks) * 100) === grade).length);
    const max = Math.max(1, ...counts);
    $("gradeBars").innerHTML = grades.map((grade, index) =>
        `<div><b>${counts[index]}</b><i style="height:${Math.max(3, Math.round((counts[index] / max) * 100))}%"></i><span>${grade}</span></div>`
    ).join("");
    $("homeNotices").innerHTML = state.notices.slice(0, 3).map((notice) =>
        `<div class="notice"><b>${escapeHtml(notice.title)}</b><p>${escapeHtml(notice.text)}</p><small>${showDate(notice.createdAt)} · ${escapeHtml(notice.authorName)}</small></div>`
    ).join("") || '<p class="muted">No notices.</p>';
}

function renderStudents() {
    $("studentsBody").innerHTML = state.students.map((student) =>
        `<tr><td><b>${escapeHtml(student.rollNo)}</b></td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.email)}</td><td>${escapeHtml(student.className)}</td><td>${escapeHtml(student.group)}</td><td>${averageFor(student._id).toFixed(1)}%</td><td><button class="btn small" data-action="edit-student" data-id="${student._id}">Edit</button><button class="btn small danger" data-action="delete-student" data-id="${student._id}">Delete</button></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="7">No students yet.</td></tr>';
}

function renderTeachers() {
    $("teachersBody").innerHTML = state.teachers.map((teacher) => {
        const courses = state.courses.filter((course) => String(course.assignedTeacher?._id || course.assignedTeacher) === String(teacher._id)).length;
        return `<tr><td><b>${escapeHtml(teacher.teacherCode)}</b></td><td>${escapeHtml(teacher.name)}</td><td>${escapeHtml(teacher.email)}</td><td>${escapeHtml(teacher.subject)}</td><td>${courses}</td><td><button class="btn small" data-action="edit-teacher" data-id="${teacher._id}">Edit</button><button class="btn small danger" data-action="delete-teacher" data-id="${teacher._id}">Delete</button></td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="6">No teachers yet.</td></tr>';
}

function renderCourses() {
    const oldTeacher = $("cTeacher").value;
    $("cTeacher").innerHTML = '<option value="">- Not assigned -</option>' + state.teachers.map((teacher) =>
        `<option value="${teacher._id}">${escapeHtml(teacher.name)}</option>`
    ).join("");
    if (state.teachers.some((teacher) => teacher._id === oldTeacher)) $("cTeacher").value = oldTeacher;
    $("coursesBody").innerHTML = state.courses.map((course) =>
        `<tr><td><b>${escapeHtml(course.courseCode)}</b></td><td>${escapeHtml(course.courseName)}</td><td>${escapeHtml(course.assignedTeacher?.name || "Not assigned")}</td><td><button class="btn small" data-action="edit-course" data-id="${course._id}">Edit</button><button class="btn small danger" data-action="delete-course" data-id="${course._id}">Delete</button></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="4">No courses yet.</td></tr>';
}

function renderResults() {
    const oldStudent = $("rStudent").value;
    const oldCourse = $("rCourse").value;
    $("rStudent").innerHTML = state.students.map((student) => `<option value="${student._id}">${escapeHtml(student.rollNo)} - ${escapeHtml(student.name)}</option>`).join("");
    $("rCourse").innerHTML = state.courses.map((course) => `<option value="${course._id}">${escapeHtml(course.courseCode)} - ${escapeHtml(course.courseName)}</option>`).join("");
    if (state.students.some((student) => student._id === oldStudent)) $("rStudent").value = oldStudent;
    if (state.courses.some((course) => course._id === oldCourse)) $("rCourse").value = oldCourse;
    $("resultsBody").innerHTML = state.results.map((result) => {
        const student = result.studentId || {};
        const course = result.courseId || {};
        const percent = result.totalMarks ? (result.marksObtained / result.totalMarks) * 100 : 0;
        return `<tr><td>${escapeHtml(student.name || "Unknown")}</td><td>${escapeHtml(course.courseName || "Unknown")}</td><td>${escapeHtml(result.examType)}</td><td>${result.marksObtained}/${result.totalMarks}</td><td>${gradeBadge(gradeFor(percent))}</td><td>${showDate(result.date)}</td><td><button class="btn small danger" data-action="delete-result" data-id="${result._id}">Delete</button></td></tr>`;
    }).join("") || '<tr><td class="empty" colspan="7">No results yet.</td></tr>';
}

function renderExams() {
    const oldCourse = $("eCourse").value;
    $("eCourse").innerHTML = state.courses.map((course) => `<option value="${course._id}">${escapeHtml(course.courseCode)} - ${escapeHtml(course.courseName)}</option>`).join("");
    if (state.courses.some((course) => course._id === oldCourse)) $("eCourse").value = oldCourse;
    $("examsBody").innerHTML = state.exams.map((exam) =>
        `<tr><td>${escapeHtml(exam.courseId?.courseName || "Unknown")}</td><td>${escapeHtml(exam.examType)}</td><td>${showDate(exam.date)}</td><td>${escapeHtml(exam.time)}</td><td>${escapeHtml(exam.room)}</td><td><button class="btn small danger" data-action="delete-exam" data-id="${exam._id}">Delete</button></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="6">No exams scheduled.</td></tr>';
}

function renderNotices() {
    $("noticesBody").innerHTML = state.notices.map((notice) =>
        `<tr><td><b>${escapeHtml(notice.title)}</b></td><td>${escapeHtml(notice.text)}</td><td>${escapeHtml(notice.authorName)}</td><td>${showDate(notice.createdAt)}</td><td><button class="btn small danger" data-action="delete-notice" data-id="${notice._id}">Delete</button></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="5">No notices.</td></tr>';
}

function renderFeedback() {
    $("feedbackBody").innerHTML = state.feedback.map((item) =>
        `<tr><td>${escapeHtml(item.studentId?.name || "Unknown")}</td><td><b>${escapeHtml(item.subject)}</b></td><td>${item.rating}/5</td><td>${escapeHtml(item.message)}</td><td>${showDate(item.createdAt)}</td><td><button class="btn small danger" data-action="delete-feedback" data-id="${item._id}">Delete</button></td></tr>`
    ).join("") || '<tr><td class="empty" colspan="6">No feedback yet.</td></tr>';
}

async function refreshAll() {
    const [students, teachers, courses, results, exams, notices, feedback] = await Promise.all([
        api("/students"), api("/teachers"), api("/courses"), api("/results"), api("/exams"), api("/notices"), api("/feedback")
    ]);
    state.students = students.students;
    state.teachers = teachers.teachers;
    state.courses = courses.courses;
    state.results = results.results;
    state.exams = exams.exams;
    state.notices = notices.notices;
    state.feedback = feedback.feedback;
    renderStudents(); renderTeachers(); renderCourses(); renderResults(); renderExams(); renderNotices(); renderFeedback(); renderHome();
}

function showCreatedStudentQr(response) {
    try {
        if (!window.QRCode) return false;
        $("createdStudentQr").replaceChildren();
        $("createdStudentQr").dataset.rollNo = response.student.rollNo;
        $("createdStudentQrName").textContent = response.student.name;
        $("createdStudentQrDetails").textContent = `Roll No: ${response.student.rollNo} · Class ${response.student.className}`;
        new window.QRCode($("createdStudentQr"), {
            text: response.qrPayload,
            width: 200,
            height: 200,
            correctLevel: window.QRCode.CorrectLevel.M
        });
        $("createdStudentQrCard").classList.remove("hide");
        return true;
    } catch (error) {
        console.error("Unable to render student attendance QR:", error);
        return false;
    }
}

function downloadCreatedStudentQr() {
    const canvas = $("createdStudentQr").querySelector("canvas");
    const image = $("createdStudentQr").querySelector("img");
    const source = canvas?.toDataURL("image/png") || image?.src;
    if (!source) return;
    const link = document.createElement("a");
    link.href = source;
    link.download = `attendance-qr-${$("createdStudentQr").dataset.rollNo}.png`;
    link.click();
}

function showSection(name) {
    sections.forEach((section) => $(section).classList.toggle("hide", section !== name));
    $("pageTitle").textContent = titles[name];
    document.querySelectorAll("#menu li").forEach((item) => item.classList.toggle("active", item.dataset.sec === name));
    $("sidebar").classList.remove("open");
}

function clearStudentForm() {
    editStudentId = null;
    $("createdStudentQrCard").classList.add("hide");
    ["sRoll", "sName", "sEmail", "sPhone"].forEach((id) => $(id).value = "");
    $("sPass").value = "";
    $("sPass").disabled = false;
    $("sCourse").value = "";
    $("sYear").value = "A";
    $("sFormTitle").textContent = "Add Student";
    $("sSave").textContent = "Save Student";
    $("sCancel").classList.add("hide");
}

function clearTeacherForm() {
    editTeacherId = null;
    ["tId", "tName", "tEmail", "tSubject"].forEach((id) => $(id).value = "");
    $("tPass").value = "";
    $("tId").disabled = false;
    $("tFormTitle").textContent = "Add Teacher";
    $("tSave").textContent = "Save Teacher";
    $("tCancel").classList.add("hide");
}

function clearCourseForm() {
    editCourseId = null;
    $("cCode").value = ""; $("cName").value = ""; $("cTeacher").value = "";
    $("cFormTitle").textContent = "Add Course";
    $("cSave").textContent = "Save Course";
    $("cCancel").classList.add("hide");
}

document.querySelectorAll("#menu li").forEach((item) => item.addEventListener("click", () => showSection(item.dataset.sec)));
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));

$("sSave").addEventListener("click", async () => {
    try {
        const creatingStudent = !editStudentId;
        const body = {
            rollNo: $("sRoll").value.trim(), name: $("sName").value.trim(), email: $("sEmail").value.trim(),
            phone: $("sPhone").value.trim(), className: $("sCourse").value.trim(), group: $("sYear").value.trim()
        };
        if (!editStudentId) body.password = $("sPass").value;
        if (!body.rollNo || !body.name || !body.email || !body.className || (!editStudentId && body.password.length < 8)) throw new Error("Fill all required fields; password must be at least 8 characters.");
        const response = await api(editStudentId ? `/students/${editStudentId}` : "/students", { method: editStudentId ? "PATCH" : "POST", body });
        clearStudentForm();
        const qrReady = creatingStudent ? showCreatedStudentQr(response) : true;
        await refreshAll();
        showMsg("sMsg", creatingStudent
            ? qrReady ? "Student created. QR code is ready below." : "Student created, but the QR image could not be rendered. The student can download it from their portal."
            : "Student updated.", qrReady);
    } catch (error) { showMsg("sMsg", error.message, false); }
});
$("sCancel").addEventListener("click", clearStudentForm);
$("downloadCreatedStudentQr").addEventListener("click", downloadCreatedStudentQr);

$("tSave").addEventListener("click", async () => {
    try {
        const body = { teacherCode: $("tId").value.trim(), name: $("tName").value.trim(), email: $("tEmail").value.trim(), subject: $("tSubject").value.trim() };
        if ($("tPass").value) body.password = $("tPass").value;
        if (!body.teacherCode || !body.name || !body.email || (!editTeacherId && (!body.password || body.password.length < 8))) throw new Error("Fill required fields; password must be at least 8 characters.");
        await api(editTeacherId ? `/teachers/${editTeacherId}` : "/teachers", { method: editTeacherId ? "PATCH" : "POST", body });
        clearTeacherForm(); await refreshAll(); showMsg("tMsg", "Teacher saved.", true);
    } catch (error) { showMsg("tMsg", error.message, false); }
});
$("tCancel").addEventListener("click", clearTeacherForm);

$("cSave").addEventListener("click", async () => {
    try {
        const body = { courseCode: $("cCode").value.trim(), courseName: $("cName").value.trim(), assignedTeacher: $("cTeacher").value || null };
        if (!body.courseCode || !body.courseName) throw new Error("Course code and name are required.");
        await api(editCourseId ? `/courses/${editCourseId}` : "/courses", { method: editCourseId ? "PATCH" : "POST", body });
        clearCourseForm(); await refreshAll(); showMsg("cMsg", "Course saved.", true);
    } catch (error) { showMsg("cMsg", error.message, false); }
});
$("cCancel").addEventListener("click", clearCourseForm);

$("rSave").addEventListener("click", async () => {
    try {
        const body = { studentId: $("rStudent").value, courseId: $("rCourse").value, examType: $("rExam").value, marksObtained: Number($("rMarks").value), totalMarks: Number($("rTotal").value), date: $("rDate").value };
        if (!body.studentId || !body.courseId || !body.date || body.totalMarks <= 0 || body.marksObtained < 0 || body.marksObtained > body.totalMarks) throw new Error("Choose student/course/date and enter valid marks.");
        await api("/results", { method: "POST", body });
        $("rMarks").value = ""; await refreshAll(); showMsg("rMsg", "Result added.", true);
    } catch (error) { showMsg("rMsg", error.message, false); }
});

$("eSave").addEventListener("click", async () => {
    try {
        const body = { courseId: $("eCourse").value, examType: $("eType").value, date: $("eDate").value, time: $("eTime").value.trim(), room: $("eRoom").value.trim() };
        if (!body.courseId || !body.date || !body.time || !body.room) throw new Error("Fill all exam fields.");
        await api("/exams", { method: "POST", body });
        $("eRoom").value = ""; await refreshAll(); showMsg("eMsg", "Exam added.", true);
    } catch (error) { showMsg("eMsg", error.message, false); }
});

$("nSave").addEventListener("click", async () => {
    try {
        const body = { title: $("nTitle").value.trim(), text: $("nText").value.trim() };
        if (!body.title || !body.text) throw new Error("Title and message are required.");
        await api("/notices", { method: "POST", body });
        $("nTitle").value = ""; $("nText").value = ""; await refreshAll(); showMsg("nMsg", "Notice posted.", true);
    } catch (error) { showMsg("nMsg", error.message, false); }
});

document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    try {
        if (action === "edit-student") {
            const student = state.students.find((item) => item._id === id);
            editStudentId = id;
            $("sRoll").value = student.rollNo; $("sName").value = student.name; $("sEmail").value = student.email;
            $("sPhone").value = student.phone || ""; $("sCourse").value = String(student.className).replace(/^class\s*/i, "");
            $("sYear").value = ["A", "B", "C"].includes(student.group) ? student.group : "A";
            $("sPass").value = ""; $("sPass").disabled = true; $("sFormTitle").textContent = "Edit Student";
            $("sSave").textContent = "Update Student"; $("sCancel").classList.remove("hide"); showSection("students");
        } else if (action === "edit-teacher") {
            const teacher = state.teachers.find((item) => item._id === id);
            editTeacherId = id; $("tId").value = teacher.teacherCode; $("tId").disabled = true;
            $("tName").value = teacher.name; $("tEmail").value = teacher.email; $("tSubject").value = teacher.subject;
            $("tPass").value = ""; $("tFormTitle").textContent = "Edit Teacher"; $("tSave").textContent = "Update Teacher";
            $("tCancel").classList.remove("hide"); showSection("teachers");
        } else if (action === "edit-course") {
            const course = state.courses.find((item) => item._id === id);
            editCourseId = id; $("cCode").value = course.courseCode; $("cName").value = course.courseName;
            $("cTeacher").value = course.assignedTeacher?._id || ""; $("cFormTitle").textContent = "Edit Course";
            $("cSave").textContent = "Update Course"; $("cCancel").classList.remove("hide"); showSection("courses");
        } else {
            const routes = { "delete-student": "/students", "delete-teacher": "/teachers", "delete-course": "/courses", "delete-result": "/results", "delete-exam": "/exams", "delete-notice": "/notices", "delete-feedback": "/feedback" };
            if (!routes[action] || !confirm("Delete this record? Related records may also be removed.")) return;
            await api(`${routes[action]}/${id}`, { method: "DELETE" });
            await refreshAll();
        }
    } catch (error) { alert(error.message); }
});

$("passSave").addEventListener("click", async () => {
    try {
        const currentPassword = $("oldPass").value;
        const newPassword = $("newPass").value;
        if (newPassword.length < 8 || newPassword !== $("newPass2").value) throw new Error("New passwords must match and be at least 8 characters.");
        await api("/password", { method: "PATCH", body: { currentPassword, newPassword } });
        ["oldPass", "newPass", "newPass2"].forEach((id) => $(id).value = "");
        showMsg("passMsg", "Password updated.", true);
    } catch (error) { showMsg("passMsg", error.message, false); }
});

$("backupBtn").addEventListener("click", async () => {
    try {
        const backup = await api("/backup");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([JSON.stringify(backup.data, null, 2)], { type: "application/json" }));
        link.download = `srms-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click(); URL.revokeObjectURL(link.href);
    } catch (error) { alert(error.message); }
});

$("logoutBtn").addEventListener("click", async () => {
    try { await api("/logoutadmin", { method: "POST" }); } finally { window.location.replace("admin-login.html"); }
});

const themeBtn = $("themeBtn");
let theme = localStorage.getItem("srms_theme") || "light";
document.documentElement.setAttribute("data-theme", theme);
themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
themeBtn.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("srms_theme", theme);
    themeBtn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
});

async function initialize() {
    try {
        const response = await api("/meadmin");
        state.admin = response.user;
        console.log(response);
        await refreshAll();
        const today = new Date().toISOString().slice(0, 10);
        $("rDate").value = today; $("eDate").value = today;
    } catch (error) {
        console.log(error);
        alert(error.message); 
        window.location.replace("admin-login.html");
    }
}

initialize();