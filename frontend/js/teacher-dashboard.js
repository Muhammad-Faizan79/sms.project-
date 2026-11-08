// =====================================================
//  Teacher dashboard
// =====================================================

var db = JSON.parse(localStorage.getItem("srms_db"));
var session = JSON.parse(sessionStorage.getItem("srms_user"));
var me = null;            // login hua teacher
var editResultId = null;  // marks edit karte waqt result ki id
var attendanceLoadedFor = null;

if (session != null && session.role == "teacher") {
    for (var i = 0; i < db.teachers.length; i++) {
        if (db.teachers[i].id == session.id) me = db.teachers[i];
    }
}

// ---------- chhote helper ----------
function saveDB() {
    localStorage.setItem("srms_db", JSON.stringify(db));
}
function getGrade(p) {
    if (p >= 90) return "A+";
    if (p >= 80) return "A";
    if (p >= 70) return "B+";
    if (p >= 60) return "B";
    if (p >= 50) return "C";
    if (p >= 40) return "D";
    return "F";
}
function gradeBadge(g) {
    var cls = "grade";
    if (g == "B+" || g == "B") cls = "grade mid";
    if (g == "C" || g == "D") cls = "grade low";
    if (g == "F") cls = "grade fail";
    return '<span class="' + cls + '">' + g + '</span>';
}
function showDate(d) {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var p = d.split("-");
    return parseInt(p[2]) + " " + months[parseInt(p[1]) - 1] + " " + p[0];
}
function todayText() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
}
function showMsg(id, text, ok) {
    var el = document.getElementById(id);
    el.className = ok ? "msg ok" : "msg err";
    el.innerHTML = text;
}
function getStudent(id) {
    for (var i = 0; i < db.students.length; i++) {
        if (db.students[i].id == id) return db.students[i];
    }
    return { name: "(deleted)", roll: "-", email: "" };
}
function getCourse(id) {
    for (var i = 0; i < db.courses.length; i++) {
        if (db.courses[i].id == id) return db.courses[i];
    }
    return { name: "(deleted)", code: "-" };
}
// sirf is teacher ke courses
function getMyCourses() {
    var list = [];
    for (var i = 0; i < db.courses.length; i++) {
        if (db.courses[i].teacherId == me.id) list.push(db.courses[i]);
    }
    return list;
}
function isMyCourse(courseId) {
    return getCourse(courseId).teacherId == me.id;
}
// is teacher ke courses ke saare results
function getMyResults() {
    var list = [];
    for (var i = 0; i < db.results.length; i++) {
        if (isMyCourse(db.results[i].courseId)) list.push(db.results[i]);
    }
    list.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return list;
}
function averageOf(list) {
    if (list.length == 0) return 0;
    var sum = 0;
    for (var i = 0; i < list.length; i++) sum += (list[i].marks / list[i].total) * 100;
    return sum / list.length;
}
function getAttendance(studentId, courseId) {
    var total = 0, present = 0, late = 0;
    for (var i = 0; i < db.attendance.length; i++) {
        var a = db.attendance[i];
        if (a.courseId == courseId && (studentId == null || a.studentId == studentId)) {
            total++;
            if (a.status == "present" || (a.status == null && a.present)) present++;
            if (a.status == "late") late++;
        }
    }
    return { total: total, present: present, late: late, percent: total == 0 ? 0 : Math.round(present * 100 / total) };
}

// ---------- menu ----------
var menuItems = document.querySelectorAll("#menu li");
var sections = ["home", "marks", "attendance", "students", "notices", "profile"];
var titles = { home: "Dashboard", marks: "Enter Marks", attendance: "Attendance", students: "Students", notices: "Notices", profile: "Profile" };

function showSection(name) {
    for (var i = 0; i < sections.length; i++) {
        document.getElementById(sections[i]).classList.add("hide");
    }
    document.getElementById(name).classList.remove("hide");
    document.getElementById("pageTitle").innerHTML = titles[name];
    for (var j = 0; j < menuItems.length; j++) {
        menuItems[j].classList.remove("active");
        if (menuItems[j].getAttribute("data-sec") == name) menuItems[j].classList.add("active");
    }
    document.getElementById("sidebar").classList.remove("open");
}
for (var m = 0; m < menuItems.length; m++) {
    menuItems[m].addEventListener("click", function () {
        showSection(this.getAttribute("data-sec"));
    });
}

// ---------- HOME ----------
function fillHome() {
    var h = new Date().getHours();
    document.getElementById("greeting").innerHTML = (h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening") + " 👋";
    document.getElementById("bannerName").innerHTML = me.name + "!";

    var myCourses = getMyCourses();
    var results = getMyResults();
    document.getElementById("stCourses").innerHTML = myCourses.length;
    document.getElementById("stStudents").innerHTML = db.students.length;
    document.getElementById("stResults").innerHTML = results.length;
    document.getElementById("stAvg").innerHTML = averageOf(results).toFixed(1) + "%";

    var html = "";
    for (var i = 0; i < myCourses.length; i++) {
        var c = myCourses[i];
        var courseResults = [];
        for (var r = 0; r < results.length; r++) {
            if (results[r].courseId == c.id) courseResults.push(results[r]);
        }
        html += "<tr><td><b>" + c.code + "</b> " + c.name + "</td><td>" + averageOf(courseResults).toFixed(1) + "%</td><td>" + getAttendance(null, c.id).percent + "%</td></tr>";
    }
    document.getElementById("homeCourses").innerHTML = html || '<tr><td class="empty" colspan="3">No courses assigned yet. Ask admin.</td></tr>';

    var rh = "";
    for (var k = 0; k < results.length && k < 6; k++) {
        rh += "<tr><td>" + getStudent(results[k].studentId).name + "</td><td>" + getCourse(results[k].courseId).name + "</td><td>" + results[k].examType + "</td><td>" + results[k].marks + "/" + results[k].total + "</td></tr>";
    }
    document.getElementById("homeResults").innerHTML = rh || '<tr><td class="empty" colspan="4">Nothing entered yet.</td></tr>';
}

// ---------- MARKS ----------
function fillMarkSelects() {
    var courses = getMyCourses();
    var ch = "";
    for (var i = 0; i < courses.length; i++) ch += '<option value="' + courses[i].id + '">' + courses[i].code + " - " + courses[i].name + "</option>";
    document.getElementById("mCourse").innerHTML = ch;
    document.getElementById("aCourse").innerHTML = ch;

    var sh = "";
    for (var j = 0; j < db.students.length; j++) sh += '<option value="' + db.students[j].id + '">' + db.students[j].roll + " - " + db.students[j].name + "</option>";
    document.getElementById("mStudent").innerHTML = sh;
}

function fillMarksTable() {
    var results = getMyResults();
    var html = "";
    for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var p = (r.marks / r.total) * 100;
        html += "<tr><td>" + getStudent(r.studentId).name + "</td><td>" + getCourse(r.courseId).name + "</td><td>" + r.examType + "</td><td>" + r.marks + "/" + r.total + "</td><td>" + gradeBadge(getGrade(p)) + "</td><td>" + showDate(r.date) + "</td>" +
            '<td><button class="btn small" onclick="editResult(\'' + r.id + '\')">Edit</button><button class="btn small danger" onclick="deleteResult(\'' + r.id + '\')">Delete</button></td></tr>';
    }
    document.getElementById("marksBody").innerHTML = html || '<tr><td class="empty" colspan="7">No results entered yet.</td></tr>';
}

function clearMarkForm() {
    editResultId = null;
    document.getElementById("mMarks").value = "";
    document.getElementById("mTotal").value = 100;
    document.getElementById("mDate").value = todayText();
    document.getElementById("mTitle").innerHTML = "Add Result";
    document.getElementById("mSave").innerHTML = "Save Result";
    document.getElementById("mCancel").classList.add("hide");
}

document.getElementById("mSave").addEventListener("click", function () {
    var courseId = document.getElementById("mCourse").value;
    var studentId = document.getElementById("mStudent").value;
    var examType = document.getElementById("mExam").value;
    var marksText = document.getElementById("mMarks").value;
    var totalText = document.getElementById("mTotal").value;
    var date = document.getElementById("mDate").value;

    if (courseId == "") { showMsg("mMsg", "You have no course assigned. Ask admin.", false); return; }
    if (marksText == "" || totalText == "" || date == "") { showMsg("mMsg", "Please fill marks, total and date.", false); return; }
    var marks = parseFloat(marksText);
    var total = parseFloat(totalText);
    if (total <= 0 || marks < 0 || marks > total) { showMsg("mMsg", "Marks must be between 0 and total marks.", false); return; }

    if (editResultId == null) {
        db.results.push({ id: "R" + Date.now(), studentId: studentId, courseId: courseId, examType: examType, marks: marks, total: total, date: date });
        showMsg("mMsg", "Result added.", true);
    } else {
        for (var i = 0; i < db.results.length; i++) {
            if (db.results[i].id == editResultId) {
                db.results[i].studentId = studentId;
                db.results[i].courseId = courseId;
                db.results[i].examType = examType;
                db.results[i].marks = marks;
                db.results[i].total = total;
                db.results[i].date = date;
            }
        }
        showMsg("mMsg", "Result updated.", true);
        clearMarkForm();
    }
    saveDB();
    fillMarksTable();
    fillHome();
    fillStudents();
});
document.getElementById("mCancel").addEventListener("click", function () {
    clearMarkForm();
    showMsg("mMsg", "", true);
});

// Edit button: result ka data form me bhar do
function editResult(id) {
    for (var i = 0; i < db.results.length; i++) {
        var r = db.results[i];
        if (r.id == id) {
            editResultId = id;
            document.getElementById("mCourse").value = r.courseId;
            document.getElementById("mStudent").value = r.studentId;
            document.getElementById("mExam").value = r.examType;
            document.getElementById("mMarks").value = r.marks;
            document.getElementById("mTotal").value = r.total;
            document.getElementById("mDate").value = r.date;
            document.getElementById("mTitle").innerHTML = "Edit Result";
            document.getElementById("mSave").innerHTML = "Update Result";
            document.getElementById("mCancel").classList.remove("hide");
            window.scrollTo(0, 0);
            document.querySelector(".content").scrollTop = 0;
        }
    }
}
function deleteResult(id) {
    if (!confirm("Delete this result?")) return;
    var keep = [];
    for (var i = 0; i < db.results.length; i++) {
        if (db.results[i].id != id) keep.push(db.results[i]);
    }
    db.results = keep;
    saveDB();
    fillMarksTable();
    fillHome();
    fillStudents();
}

// ---------- ATTENDANCE ----------
document.getElementById("aLoad").addEventListener("click", function () {
    var courseId = document.getElementById("aCourse").value;
    var date = document.getElementById("aDate").value;
    if (courseId == "" || date == "") { showMsg("aMsg", "Please choose course and date.", false); return; }

    var html = "";
    for (var i = 0; i < db.students.length; i++) {
        var s = db.students[i];
        var status = "present";
        for (var j = 0; j < db.attendance.length; j++) {
            var a = db.attendance[j];
            if (a.studentId == s.id && a.courseId == courseId && a.date == date) {
                status = a.status || (a.present ? "present" : "absent");
            }
        }
        html += "<tr><td>" + s.roll + "</td><td>" + s.name + '</td><td><select class="attendance-status" id="att_' + s.id + '" aria-label="Attendance status for ' + s.name + '">' +
            '<option value="present"' + (status == "present" ? " selected" : "") + '>Present</option>' +
            '<option value="absent"' + (status == "absent" ? " selected" : "") + '>Absent</option>' +
            '<option value="late"' + (status == "late" ? " selected" : "") + '>Late</option></select></td></tr>';
    }
    document.getElementById("aBody").innerHTML = html;
    document.getElementById("aBox").classList.remove("hide");
    attendanceLoadedFor = { courseId: courseId, date: date };
    showMsg("aMsg", "", true);
});

document.getElementById("aSave").addEventListener("click", function () {
    var courseId = document.getElementById("aCourse").value;
    var date = document.getElementById("aDate").value;
    if (courseId == "" || date == "") { showMsg("aMsg", "Please choose course and date.", false); return; }
    if (document.getElementById("aBox").classList.contains("hide") || attendanceLoadedFor == null || attendanceLoadedFor.courseId != courseId || attendanceLoadedFor.date != date) {
        showMsg("aMsg", "Show students again for the selected course and date.", false);
        return;
    }
    if (date > todayText()) { showMsg("aMsg", "You cannot mark attendance for a future date.", false); return; }

    // is course + date ka purana record hata do
    var keep = [];
    for (var i = 0; i < db.attendance.length; i++) {
        var a = db.attendance[i];
        if (!(a.courseId == courseId && a.date == date)) keep.push(a);
    }
    db.attendance = keep;

    // naya record add karo
    for (var j = 0; j < db.students.length; j++) {
        var status = document.getElementById("att_" + db.students[j].id).value;
        db.attendance.push({ studentId: db.students[j].id, courseId: courseId, date: date, status: status, present: status == "present" });
    }
    saveDB();
    fillAttendanceSummary();
    fillHome();
    showMsg("aMsg", "Attendance saved for " + showDate(date), true);
});
document.getElementById("aCourse").addEventListener("change", fillAttendanceSummary);

function fillAttendanceSummary() {
    var courseId = document.getElementById("aCourse").value;
    var html = "";
    for (var i = 0; i < db.students.length; i++) {
        var s = db.students[i];
        var a = getAttendance(s.id, courseId);
        var cls = a.percent >= 75 ? "green" : "red";
        html += "<tr><td>" + s.name + "</td><td>" + a.present + "</td><td>" + a.late + "</td><td>" + a.total + '</td><td><span class="pill ' + cls + '">' + a.percent + "%</span></td></tr>";
    }
    document.getElementById("aSummary").innerHTML = html;
}

// ---------- STUDENTS ----------
function fillStudents() {
    var html = "";
    var results = getMyResults();
    for (var i = 0; i < db.students.length; i++) {
        var s = db.students[i];
        var mine = [];
        for (var r = 0; r < results.length; r++) {
            if (results[r].studentId == s.id) mine.push(results[r]);
        }
        html += "<tr><td><b>" + s.roll + "</b></td><td>" + s.name + "</td><td>" + s.email + "</td><td>" + (mine.length == 0 ? "-" : averageOf(mine).toFixed(1) + "%") + "</td></tr>";
    }
    document.getElementById("studentsBody").innerHTML = html;
}

// ---------- NOTICES ----------
function fillNotices() {
    var html = "";
    for (var i = db.notices.length - 1; i >= 0; i--) {
        var n = db.notices[i];
        if (n.byId == me.id) {
            html += "<tr><td><b>" + n.title + "</b></td><td>" + n.text + "</td><td>" + showDate(n.date) + '</td><td><button class="btn small danger" onclick="deleteNotice(\'' + n.id + '\')">Delete</button></td></tr>';
        }
    }
    document.getElementById("noticesBody").innerHTML = html || '<tr><td class="empty" colspan="4">You have not posted any notice.</td></tr>';
}
document.getElementById("nSave").addEventListener("click", function () {
    var title = document.getElementById("nTitle").value.trim();
    var text = document.getElementById("nText").value.trim();
    if (title == "" || text == "") { showMsg("nMsg", "Please write title and message.", false); return; }
    db.notices.push({ id: "N" + Date.now(), title: title, text: text, date: todayText(), by: me.name, byId: me.id });
    saveDB();
    document.getElementById("nTitle").value = "";
    document.getElementById("nText").value = "";
    fillNotices();
    showMsg("nMsg", "Notice posted. Students can see it now.", true);
});
function deleteNotice(id) {
    if (!confirm("Delete this notice?")) return;
    var keep = [];
    for (var i = 0; i < db.notices.length; i++) {
        if (db.notices[i].id != id) keep.push(db.notices[i]);
    }
    db.notices = keep;
    saveDB();
    fillNotices();
}

// ---------- PROFILE ----------
function fillProfile() {
    document.getElementById("profileInfo").innerHTML =
        "<p><span>Name</span><b>" + me.name + "</b></p>" +
        "<p><span>Teacher ID</span><b>" + me.id + "</b></p>" +
        "<p><span>Subjects</span><b>" + me.subject + "</b></p>" +
        "<p><span>Email</span><b>" + me.email + "</b></p>" +
        "<p><span>Courses</span><b>" + getMyCourses().length + "</b></p>";
    document.getElementById("pEmail").value = me.email;
    document.getElementById("pOld").value = "";
    document.getElementById("pNew").value = "";
}
document.getElementById("saveProfile").addEventListener("click", function () {
    var email = document.getElementById("pEmail").value.trim();
    var oldPass = document.getElementById("pOld").value;
    var newPass = document.getElementById("pNew").value;
    if (email.indexOf("@") == -1) { showMsg("profileMsg", "Please enter a valid email.", false); return; }
    if (newPass != "") {
        if (oldPass != me.password) { showMsg("profileMsg", "Current password is wrong.", false); return; }
        if (newPass.length < 4) { showMsg("profileMsg", "New password must be at least 4 letters.", false); return; }
        me.password = newPass;
    }
    me.email = email;
    saveDB();
    fillProfile();
    showMsg("profileMsg", "Profile updated.", true);
});

// ---------- logout, menu button, theme ----------
document.getElementById("logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem("srms_user");
    window.location.href = "teacher-login.html";
});
document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("open");
});

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

// ---------- start ----------
if (me == null) {
    window.location.href = "teacher-login.html";
} else {
    document.getElementById("userName").innerHTML = me.name;
    document.getElementById("avatar").innerHTML = me.name.replace("Dr. ", "").replace("Prof. ", "").charAt(0);
    document.getElementById("aDate").value = todayText();
    fillMarkSelects();
    clearMarkForm();
    fillHome();
    fillMarksTable();
    fillAttendanceSummary();
    fillStudents();
    fillNotices();
    fillProfile();
}
