// =====================================================
//  Student dashboard
//  Data localStorage se aata hai:  db.students, db.results ...
// =====================================================

var db = JSON.parse(localStorage.getItem("srms_db"));
var session = JSON.parse(sessionStorage.getItem("srms_user"));
var me = null;           // login hua student
var calYear, calMonth;   // calendar ka month

// login check: student ka record dhoondo
if (session != null && session.role == "student") {
    for (var i = 0; i < db.students.length; i++) {
        if (db.students[i].id == session.id) {
            me = db.students[i];
        }
    }
}

// ---------- chhote helper (sirf is page ke liye) ----------
function saveDB() {
    localStorage.setItem("srms_db", JSON.stringify(db));
}
function getCourse(id) {
    for (var i = 0; i < db.courses.length; i++) {
        if (db.courses[i].id == id) return db.courses[i];
    }
    return { name: "(deleted)", code: "-", teacherId: "" };
}
function getTeacherName(id) {
    for (var i = 0; i < db.teachers.length; i++) {
        if (db.teachers[i].id == id) return db.teachers[i].name;
    }
    return "-";
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
function getPoint(p) {
    if (p >= 90) return 10;
    if (p >= 80) return 9;
    if (p >= 70) return 8;
    if (p >= 60) return 7;
    if (p >= 50) return 6;
    if (p >= 40) return 5;
    return 0;
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

// ---------- calculation ----------
// kisi student ke har course ka percentage nikalta hai
function getCourseRows(studentId) {
    var rows = [];
    for (var c = 0; c < db.courses.length; c++) {
        var sumMarks = 0, sumTotal = 0;
        for (var r = 0; r < db.results.length; r++) {
            var res = db.results[r];
            if (res.studentId == studentId && res.courseId == db.courses[c].id) {
                sumMarks += res.marks;
                sumTotal += res.total;
            }
        }
        var percent = sumTotal > 0 ? (sumMarks / sumTotal) * 100 : null;
        rows.push({ course: db.courses[c], percent: percent });
    }
    return rows;
}
function getCgpa(studentId) {
    var rows = getCourseRows(studentId);
    var sum = 0, count = 0;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].percent != null) {
            sum += getPoint(rows[i].percent);
            count++;
        }
    }
    return count == 0 ? 0 : sum / count;
}
function getAttendance(studentId, courseId) {
    var total = 0, present = 0;
    for (var i = 0; i < db.attendance.length; i++) {
        var a = db.attendance[i];
        if (a.studentId == studentId && (courseId == null || a.courseId == courseId)) {
            total++;
            if (a.present) present++;
        }
    }
    return { total: total, present: present, percent: total == 0 ? 0 : Math.round(present * 100 / total) };
}
function getRank(studentId) {
    var mine = getCgpa(studentId);
    var rank = 1;
    for (var i = 0; i < db.students.length; i++) {
        if (db.students[i].id != studentId && getCgpa(db.students[i].id) > mine) rank++;
    }
    return rank;
}
function getMyResults() {
    var list = [];
    for (var i = 0; i < db.results.length; i++) {
        if (db.results[i].studentId == me.id) list.push(db.results[i]);
    }
    list.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return list;
}
function getNotices() {
    var list = db.notices.slice();
    list.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return list;
}
function noticeHtml(n) {
    return '<div class="notice"><b>' + n.title + '</b><p>' + n.text + '</p><small>' + showDate(n.date) + ' • ' + n.by + '</small></div>';
}

// ---------- menu (sections show / hide) ----------
var menuItems = document.querySelectorAll("#menu li");
var sections = ["home", "profile", "courses", "results", "attendance", "exams", "notices", "feedback"];
var titles = { home: "Dashboard", profile: "Profile", courses: "Courses", results: "Results", attendance: "Attendance", exams: "Exams", notices: "Notice Board", feedback: "Feedback" };

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

// ---------- fill every section ----------
function fillHome() {
    var h = new Date().getHours();
    document.getElementById("greeting").innerHTML = (h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening") + " 👋";
    document.getElementById("bannerName").innerHTML = me.name + "!";

    var results = getMyResults();
    document.getElementById("stCgpa").innerHTML = getCgpa(me.id).toFixed(2);
    document.getElementById("stCourses").innerHTML = db.courses.length;
    document.getElementById("stExams").innerHTML = results.length;
    document.getElementById("stRank").innerHTML = getRank(me.id);
    document.getElementById("stRankOf").innerHTML = "out of " + db.students.length;
    document.getElementById("stAtt").innerHTML = getAttendance(me.id, null).percent + "%";

    var html = "";
    for (var i = 0; i < results.length && i < 5; i++) {
        var r = results[i];
        var p = (r.marks / r.total) * 100;
        html += "<tr><td>" + getCourse(r.courseId).name + "</td><td>" + r.examType + "</td><td>" + gradeBadge(getGrade(p)) + "</td><td>" + r.marks + "/" + r.total + "</td><td>" + showDate(r.date) + "</td></tr>";
    }
    document.getElementById("recentBody").innerHTML = html || '<tr><td class="empty" colspan="5">No results yet.</td></tr>';

    var notices = getNotices();
    var nh = "";
    for (var n = 0; n < notices.length && n < 3; n++) nh += noticeHtml(notices[n]);
    document.getElementById("homeNotices").innerHTML = nh || "<p class='muted'>No notices.</p>";

    // performance donut
    var rows = getCourseRows(me.id);
    var ex = 0, gd = 0, av = 0, nd = 0, sum = 0, cnt = 0;
    for (var k = 0; k < rows.length; k++) {
        var pc = rows[k].percent;
        if (pc == null) continue;
        cnt++; sum += pc;
        if (pc >= 80) ex++; else if (pc >= 60) gd++; else if (pc >= 40) av++; else nd++;
    }
    var avg = cnt == 0 ? 0 : Math.round(sum / cnt);
    var total = cnt == 0 ? 1 : cnt;
    var a1 = ex / total * 100, a2 = a1 + gd / total * 100, a3 = a2 + av / total * 100;
    document.getElementById("donut").style.background = cnt == 0 ? "#ccc" :
        "conic-gradient(#22a45d 0 " + a1 + "%, #3b82f6 " + a1 + "% " + a2 + "%, #f59e0b " + a2 + "% " + a3 + "%, #ef4444 " + a3 + "% 100%)";
    document.getElementById("donutText").innerHTML = avg + "%";
    document.getElementById("legend").innerHTML =
        '<li><i style="background:#22a45d"></i>Excellent (80+): ' + ex + '</li>' +
        '<li><i style="background:#3b82f6"></i>Good (60-79): ' + gd + '</li>' +
        '<li><i style="background:#f59e0b"></i>Average (40-59): ' + av + '</li>' +
        '<li><i style="background:#ef4444"></i>Needs improvement: ' + nd + '</li>';
}

function drawCalendar() {
    var names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("calTitle").innerHTML = names[calMonth] + " " + calYear;

    var firstDay = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;   // Monday = 0
    var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    var prefix = calYear + "-" + (calMonth + 1 < 10 ? "0" : "") + (calMonth + 1) + "-";
    var today = todayText();

    var html = "";
    var dows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (var i = 0; i < 7; i++) html += '<div class="dow">' + dows[i] + "</div>";
    for (var b = 0; b < firstDay; b++) html += "<div></div>";
    for (var d = 1; d <= daysInMonth; d++) {
        var dateText = prefix + (d < 10 ? "0" + d : d);
        var cls = "day";
        if (dateText == today) cls += " today";
        for (var e = 0; e < db.exams.length; e++) {
            if (db.exams[e].date == dateText) cls += " exam";
        }
        html += '<div class="' + cls + '">' + d + "</div>";
    }
    document.getElementById("calGrid").innerHTML = html;
}

function fillProfile() {
    document.getElementById("profileInfo").innerHTML =
        "<p><span>Name</span><b>" + me.name + "</b></p>" +
        "<p><span>Roll No</span><b>" + me.roll + "</b></p>" +
        "<p><span>Course</span><b>" + me.course + "</b></p>" +
        "<p><span>Year</span><b>" + me.year + "</b></p>" +
        "<p><span>Email</span><b>" + me.email + "</b></p>" +
        "<p><span>Phone</span><b>" + (me.phone || "-") + "</b></p>";
    document.getElementById("pEmail").value = me.email;
    document.getElementById("pPhone").value = me.phone || "";
    document.getElementById("pOld").value = "";
    document.getElementById("pNew").value = "";
}

function fillCourses() {
    var rows = getCourseRows(me.id);
    var html = "";
    for (var i = 0; i < rows.length; i++) {
        var c = rows[i].course;
        var att = getAttendance(me.id, c.id).percent;
        var p = rows[i].percent;
        html += "<tr><td><b>" + c.code + "</b></td><td>" + c.name + "</td><td>" + getTeacherName(c.teacherId) + "</td><td>" + att + "%</td><td>" +
            (p == null ? "-" : p.toFixed(1) + "%") + "</td><td>" + (p == null ? "-" : gradeBadge(getGrade(p))) + "</td></tr>";
    }
    document.getElementById("coursesBody").innerHTML = html || '<tr><td class="empty" colspan="6">No courses.</td></tr>';
}

function fillResults() {
    document.getElementById("rCgpa").innerHTML = getCgpa(me.id).toFixed(2);
    document.getElementById("rRank").innerHTML = getRank(me.id) + " / " + db.students.length;

    var rows = getCourseRows(me.id);
    var html = "", sum = 0, cnt = 0;
    for (var i = 0; i < rows.length; i++) {
        var p = rows[i].percent;
        if (p != null) { sum += p; cnt++; }
        html += "<tr><td>" + rows[i].course.name + "</td><td>" + (p == null ? "-" : p.toFixed(1) + "%") + "</td><td>" +
            (p == null ? "-" : gradeBadge(getGrade(p))) + "</td><td>" + (p == null ? "-" : getPoint(p)) + "</td></tr>";
    }
    document.getElementById("summaryBody").innerHTML = html;
    document.getElementById("rAvg").innerHTML = (cnt == 0 ? 0 : sum / cnt).toFixed(1) + "%";

    var results = getMyResults();
    var all = "";
    for (var j = 0; j < results.length; j++) {
        var r = results[j];
        var pc = (r.marks / r.total) * 100;
        all += "<tr><td>" + getCourse(r.courseId).name + "</td><td>" + r.examType + "</td><td>" + r.marks + "/" + r.total + "</td><td>" + pc.toFixed(1) + "%</td><td>" + gradeBadge(getGrade(pc)) + "</td><td>" + showDate(r.date) + "</td></tr>";
    }
    document.getElementById("allResultsBody").innerHTML = all || '<tr><td class="empty" colspan="6">No results yet.</td></tr>';
}

function fillAttendance() {
    var html = "";
    for (var i = 0; i < db.courses.length; i++) {
        var c = db.courses[i];
        var a = getAttendance(me.id, c.id);
        var cls = a.percent >= 85 ? "" : (a.percent >= 75 ? "orange" : "red");
        html += '<div class="att-box"><div class="row"><b>' + c.name + '</b><b>' + a.percent + '%</b></div>' +
            '<div class="bar"><i class="' + cls + '" style="width:' + a.percent + '%"></i></div>' +
            '<small class="muted">' + a.present + ' present out of ' + a.total + ' classes</small></div>';
    }
    var all = getAttendance(me.id, null);
    var warn = (all.total > 0 && all.percent < 75) ? '<p class="msg err">Your overall attendance is below 75%!</p>' : "";
    document.getElementById("attList").innerHTML = '<p>Overall: <b>' + all.percent + '%</b></p>' + warn + html;
}

function fillExams() {
    var html = "";
    var list = db.exams.slice();
    list.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var today = todayText();
    for (var i = 0; i < list.length; i++) {
        var e = list[i];
        var status = e.date < today ? '<span class="pill">Completed</span>' : (e.date == today ? '<span class="pill red">Today</span>' : '<span class="pill purple">Upcoming</span>');
        html += "<tr><td>" + getCourse(e.courseId).name + "</td><td>" + e.type + "</td><td>" + showDate(e.date) + "</td><td>" + e.time + "</td><td>" + e.room + "</td><td>" + status + "</td></tr>";
    }
    document.getElementById("examsBody").innerHTML = html || '<tr><td class="empty" colspan="6">No exams scheduled.</td></tr>';
}

function fillNotices() {
    var list = getNotices();
    var html = "";
    for (var i = 0; i < list.length; i++) html += noticeHtml(list[i]);
    document.getElementById("allNotices").innerHTML = html || "<p class='muted'>No notices.</p>";
}

function fillFeedback() {
    var html = "";
    for (var i = db.feedback.length - 1; i >= 0; i--) {
        var f = db.feedback[i];
        if (f.studentId == me.id) {
            html += '<div class="notice"><b>' + f.subject + ' — ' + f.rating + '/5 ★</b><p>' + f.message + '</p><small>' + showDate(f.date) + '</small></div>';
        }
    }
    document.getElementById("myFeedback").innerHTML = html || "<p class='muted'>You have not sent any feedback yet.</p>";
}

// ---------- buttons ----------
document.getElementById("saveProfile").addEventListener("click", function () {
    var email = document.getElementById("pEmail").value.trim();
    var phone = document.getElementById("pPhone").value.trim();
    var oldPass = document.getElementById("pOld").value;
    var newPass = document.getElementById("pNew").value;

    if (email.indexOf("@") == -1) {
        showMsg("profileMsg", "Please enter a valid email.", false);
        return;
    }
    if (newPass != "") {
        if (oldPass != me.password) { showMsg("profileMsg", "Current password is wrong.", false); return; }
        if (newPass.length < 4) { showMsg("profileMsg", "New password must be at least 4 letters.", false); return; }
        me.password = newPass;
    }
    me.email = email;
    me.phone = phone;
    saveDB();
    fillProfile();
    showMsg("profileMsg", "Profile updated.", true);
});

document.getElementById("sendFeedback").addEventListener("click", function () {
    var subject = document.getElementById("fSubject").value.trim();
    var message = document.getElementById("fMessage").value.trim();
    if (subject == "" || message == "") {
        showMsg("feedbackMsg", "Please write subject and message.", false);
        return;
    }
    db.feedback.push({
        id: "F" + Date.now(),
        studentId: me.id,
        subject: subject,
        rating: parseInt(document.getElementById("fRating").value),
        message: message,
        date: todayText()
    });
    saveDB();
    document.getElementById("fSubject").value = "";
    document.getElementById("fMessage").value = "";
    fillFeedback();
    showMsg("feedbackMsg", "Thank you! Feedback submitted.", true);
});

document.getElementById("printBtn").addEventListener("click", function () {
    window.print();
});

document.getElementById("calPrev").addEventListener("click", function () {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    drawCalendar();
});
document.getElementById("calNext").addEventListener("click", function () {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    drawCalendar();
});

document.getElementById("logoutBtn").addEventListener("click", function () {
    sessionStorage.removeItem("srms_user");
    window.location.href = "student-login.html";
});
document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("open");
});

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

// ---------- start ----------
if (me == null) {
    window.location.href = "student-login.html";
} else {
    document.getElementById("userName").innerHTML = me.name;
    document.getElementById("avatar").innerHTML = me.name.charAt(0);
    var now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    fillHome();
    drawCalendar();
    fillProfile();
    fillCourses();
    fillResults();
    fillAttendance();
    fillExams();
    fillNotices();
    fillFeedback();
}
