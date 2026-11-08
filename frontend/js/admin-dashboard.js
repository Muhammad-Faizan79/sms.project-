// // =====================================================
// //  Admin dashboard
// //  Har section me: form (add/edit) + table (list) + delete
// // =====================================================

import { baseUrl } from "./baseUrl.js";

const authantication=async()=>{
    try {
     const responce =await fetch(`${baseUrl}/auth/meadmin`,{
        method:"GET",
        headers:{
        "Content-Type":"application/json"
    },
        credentials:"include"
     }).then(res=>res.json())   
     console.log(responce)
     localStorage.setItem("data",JSON.stringify(responce))
     if(!responce.status){
        console.log("not login" ,responce.status)
        // window.location.replace("admin-login.html")
     }

    } catch (error) {
        alert(error.message)
    }
}
authantication()




var themeBtn = document.getElementById("themeBtn");
var theme = localStorage.getItem("srms_theme") || "light";
document.documentElement.setAttribute("data-theme", theme);
themeBtn.innerHTML = theme = "dark" ? "☀️ Light" : "🌙 Dark";
themeBtn.addEventListener("click", function () {
    theme = (theme == "dark") ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("srms_theme", theme);
    themeBtn.innerHTML = theme == "dark" ? "☀️ Light" : "🌙 Dark";
});

document.getElementById("menuBtn").addEventListener("click", function () {
    document.getElementById("sidebar").classList.toggle("open");
});


// ---------- menu ----------
var menuItems = document.querySelectorAll("#menu li");
var sections = ["home", "students", "teachers", "courses", "results", "exams", "notices", "feedback", "settings"];
var titles = { home: "Dashboard", students: "Students", teachers: "Teachers", courses: "Courses", results: "Results", exams: "Exams", notices: "Notices", feedback: "Feedback", settings: "Settings" };

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



function clearStudentForm() {
    editStudentId = null;
    document.getElementById("sRoll").value = "";
    document.getElementById("sName").value = "";
    document.getElementById("sEmail").value = "";
    document.getElementById("sPass").value = "student123";
    document.getElementById("sPass").disabled = false;
    document.getElementById("sCourse").value = "B.Tech CSE";
    document.getElementById("sYear").value = "1";   
    document.getElementById("sPhone").value = "";
    document.getElementById("sFormTitle").innerHTML = "Add Student";
    document.getElementById("sSave").innerHTML = "Save Student";
    document.getElementById("sCancel").classList.add("hide");
}
// parseInt() text convert in to number 
let editStudentId = null

document.getElementById("sSave").addEventListener("click",async function () {
    // form se data lo
    var rollNo = document.getElementById("sRoll").value.trim();
    var name = document.getElementById("sName").value.trim();
    var email = document.getElementById("sEmail").value.trim();
    var password = document.getElementById("sPass").value.trim();
    var className = document.getElementById("sCourse").value.trim();
    var group = document.getElementById("sYear").value.trim();
    var phone = document.getElementById("sPhone").value;


    if(!rollNo || !name || !email || !password || !className || !group || !phone){
        return alert("required filed or messing");
    }
    
    if(phone.length !== 11){
         return alert("please enter a valid phone number")
    }
    if (roll == "" || name == "" || email == "" || pass == "") { showMsg("sMsg", "Roll no, name, email and password are required.", false); return; }
    if (email.indexOf("@") == -1) { showMsg("sMsg", "Please enter a valid email.", false); return; }
    if (pass.length < 4) { showMsg("sMsg", "Password must be at least 4 letters.", false); return; }

    // duplicate check
    for (var i = 0; i < db.students.length; i++) {
        var other = db.students[i];
        if (other.id == editStudentId) continue;
        if (other.roll.toLowerCase() == roll.toLowerCase()) { showMsg("sMsg", "This roll no already exists.", false); return; }
        if (other.email.toLowerCase() == email.toLowerCase()) { showMsg("sMsg", "This email is already used.", false); return; }
    }

    var message;
    if (editStudentId == null) {
        const studentObj ={
            rollNo,
            email,
            name,
            password,
            className,
            group,
            phone
        };
         const responce =await fetch(`${baseUrl}/auth/createstudent`,{
        method:"POST",
        headers:{
        "Content-Type":"application/json"
    },
        credentials:"include",
        body:JSON.stringify(studentObj)
     }).then(res=>res.json())   


     responce.status ? message = "Student added." :message = responce.message 
        
        
    } else {
        console.log("hello word")
        var s = findById(db.students, editStudentId);
        s.roll = roll; s.name = name; s.email = email; s.password = pass; s.course = course; s.year = year; s.phone = phone;
        message = "Student updated.";
    }
    // saveDB();
    clearStudentForm();
    // fillStudents(); fillSelects(); fillHome();
    showMsg("sMsg", message, true);
});


// var db = JSON.parse(localStorage.getItem("srms_db"));
// var session = JSON.parse(sessionStorage.getItem("srms_user"));
// var loggedIn = (session != null && session.role == "admin");
// console.log(loggedIn)
// let editStudentId = null;   
// var editTeacherId = null;
// var editCourseId = null;

// // ---------- chhote helper ----------
// function saveDB() {
//     localStorage.setItem("srms_db", JSON.stringify(db));
// }
// function findById(list, id) {
//     for (var i = 0; i < list.length; i++) {
//         if (list[i].id == id) return list[i];
//     }
//     return null;
// }
// // list me se wo items nikaal do jinki key == value
// function removeFrom(list, key, value) {
//     var keep = [];
//     for (var i = 0; i < list.length; i++) {
//         if (list[i][key] != value) keep.push(list[i]);
//     }
//     return keep;
// }
// function getGrade(p) {
//     if (p >= 90) return "A+";
//     if (p >= 80) return "A";
//     if (p >= 70) return "B+";
//     if (p >= 60) return "B";
//     if (p >= 50) return "C";
//     if (p >= 40) return "D";
//     return "F";
// }
// function gradeBadge(g) {
//     var cls = "grade";
//     if (g == "B+" || g == "B") cls = "grade mid";
//     if (g == "C" || g == "D") cls = "grade low";
//     if (g == "F") cls = "grade fail";
//     return '<span class="' + cls + '">' + g + '</span>';
// }
// function showDate(d) {
//     var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     var p = d.split("-");
//     return parseInt(p[2]) + " " + months[parseInt(p[1]) - 1] + " " + p[0];
// }
// function todayText() {
//     var d = new Date();
//     var m = d.getMonth() + 1;
//     var day = d.getDate();
//     return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
// }
function showMsg(id, text, ok) {
    var el = document.getElementById(id);
    el.className = ok ? "msg ok" : "msg err";
    el.innerHTML = text;
}
// function studentName(id) {
//     var s = findById(db.students, id);
//     return s ? s.name : "(deleted)";
// }
// function courseName(id) {
//     var c = findById(db.courses, id);
//     return c ? c.name : "(deleted)";
// }
// function teacherName(id) {
//     var t = findById(db.teachers, id);
//     return t ? t.name : "Not assigned";
// }
// // student ka average percentage (saare results ka)
async function studentAverage(studentId) {
    console.log("hell0")
    var sum = 0, count = 0;

 const db_Data =await fetch(`${baseUrl}/auth/allresults`,{
    method:"GET",
    credentials:"include"
 }).then(res=>res.json())

 for (var i = 0; i < db_Data.data.length; i++) {
        var r = db_Data.data[i];
        if (r.studentId == studentId) {
           const me = sum += (r.marksObtained / r.totalMarks) * 100;
            count++;
        }
    }
    return count == 0 ? 0 : sum / count;
}

// // ================= HOME =================
// function fillHome() {
//     var h = new Date().getHours();
//     document.getElementById("greeting").innerHTML = (h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening") + " 👋";

//     var passed = 0;
//     for (var i = 0; i < db.results.length; i++) {
//         if ((db.results[i].marks / db.results[i].total) * 100 >= 40) passed++;
//     }
//     
//     document.getElementById("stTeachers").innerHTML = db.teachers.length;
//     document.getElementById("stCourses").innerHTML = db.courses.length;
//     document.getElementById("stResults").innerHTML = db.results.length;
//     document.getElementById("stPass").innerHTML = (db.results.length == 0 ? 0 : Math.round(passed * 100 / db.results.length)) + "%";

//     // top 5 students (average ke hisaab se)
//     var list = db.students.slice();
//     list.sort(function (a, b) { return studentAverage(b.id) - studentAverage(a.id); });
//     var html = "";
//     for (var k = 0; k < list.length && k < 5; k++) {
//         html += "<tr><td>" + (k + 1) + "</td><td>" + list[k].name + "</td><td>" + list[k].roll + "</td><td><b>" + studentAverage(list[k].id).toFixed(1) + "%</b></td></tr>";
//     }
//     document.getElementById("topBody").innerHTML = html || '<tr><td class="empty" colspan="4">No students yet.</td></tr>';

//     // grade bar chart
//     var grades = ["A+", "A", "B+", "B", "C", "D", "F"];
//     var counts = [0, 0, 0, 0, 0, 0, 0];
//     for (var r = 0; r < db.results.length; r++) {
//         var g = getGrade((db.results[r].marks / db.results[r].total) * 100);
//         counts[grades.indexOf(g)]++;
//     }
//     var max = Math.max.apply(null, counts.concat([1]));
//     var bars = "";
//     for (var b = 0; b < grades.length; b++) {
//         bars += "<div><b>" + counts[b] + '</b><i style="height:' + Math.round(counts[b] / max * 100) + '%"></i><span>' + grades[b] + "</span></div>";
//     }
//     document.getElementById("gradeBars").innerHTML = bars;

//     // latest 3 notices
//     var notices = db.notices.slice();
//     notices.sort(function (a, b) { return b.date.localeCompare(a.date); });
//     var nh = "";
//     for (var n = 0; n < notices.length && n < 3; n++) {
//         nh += '<div class="notice"><b>' + notices[n].title + "</b><p>" + notices[n].text + "</p><small>" + showDate(notices[n].date) + " • " + notices[n].by + "</small></div>";
//     }
//     document.getElementById("homeNotices").innerHTML = nh || "<p class='muted'>No notices.</p>";
// }

// // ================= STUDENTS =================
// studentAverage(s.id).toFixed(1)






document.getElementById("sCancel").addEventListener("click", clearStudentForm);

async function editStudent(id) {
    const db_Data = await fetch(`${baseUrl}/student/getstudents?id=${id}`,{
        method:"GET",
        credentials:"include"
    }).then(res=>res.json())


    var s = db_Data.students;
    console.log(s)
    editStudentId = id;
    document.getElementById("sRoll").value = s.rollNo;
    document.getElementById("sName").value = s.name;
    document.getElementById("sEmail").value = s.email;
    document.getElementById("sPass").value = "";
    document.getElementById("sPass").disabled =true;
    document.getElementById("sCourse").value = s.className;
    document.getElementById("sYear").value = s.group;
    document.getElementById("sPhone").value = s.phone || "";
    document.getElementById("sFormTitle").innerHTML = "Edit Student";
    document.getElementById("sSave").innerHTML = "Update Student";
    document.getElementById("sCancel").classList.remove("hide");
    document.querySelector(".content").scrollTop = 0;
}
function deleteStudent(id) {
    if (!confirm("Delete this student and all his/her results, attendance and feedback?")) return;
    db.students = removeFrom(db.students, "id", id);
    db.results = removeFrom(db.results, "studentId", id);
    db.attendance = removeFrom(db.attendance, "studentId", id);
    db.feedback = removeFrom(db.feedback, "studentId", id);
    saveDB();
    fillStudents(); fillResults(); fillFeedback(); fillSelects(); fillHome();
}
window.editStudent =editStudent


// avalirage function
const fillStudents=async()=> {
    var html = "";
    const db_Data = await fetch(`${baseUrl}/student/getstudents`,{
        method:"GET",
        credentials:"include"
    }).then(res=>res.json())

    document.getElementById("stStudents").innerHTML = db_Data.students.length;
    
    for (var i = 0; i < db_Data.students.length; i++) {
        var s = db_Data.students[i];
        html += "<tr><td><b>" + s.rollNo + "</b></td><td>" + s.name + "</td><td>" + s.email + "</td><td>" + s.className + "</td><td>" + s.group + "</td><td>" + (await studentAverage(s._id)).toFixed(1) + "%</td>" +
            '<td><button class="btn small" onclick="editStudent(\'' + s._id + '\')">Edit</button><button class="btn small danger" onclick="deleteStudent(\'' + s._id + '\')">Delete</button></td></tr>';
    }
    document.getElementById("studentsBody").innerHTML = html || '<tr><td class="empty" colspan="7">No students yet.</td></tr>';
}
// cencel

// // ================= TEACHERS =================
// function fillTeachers() {
//     var html = "";
//     for (var i = 0; i < db.teachers.length; i++) {
//         var t = db.teachers[i];
//         var count = 0;
//         for (var c = 0; c < db.courses.length; c++) {
//             if (db.courses[c].teacherId == t.id) count++;
//         }
//         html += "<tr><td><b>" + t.id + "</b></td><td>" + t.name + "</td><td>" + t.email + "</td><td>" + t.subject + "</td><td>" + count + "</td>" +
//             '<td><button class="btn small" onclick="editTeacher(\'' + t.id + '\')">Edit</button><button class="btn small danger" onclick="deleteTeacher(\'' + t.id + '\')">Delete</button></td></tr>';
//     }
//     document.getElementById("teachersBody").innerHTML = html || '<tr><td class="empty" colspan="6">No teachers yet.</td></tr>';
// }
// function clearTeacherForm() {
//     editTeacherId = null;
//     document.getElementById("tId").value = "";
//     document.getElementById("tId").disabled = false;
//     document.getElementById("tName").value = "";
//     document.getElementById("tEmail").value = "";
//     document.getElementById("tPass").value = "teacher123";
//     document.getElementById("tSubject").value = "";
//     document.getElementById("tFormTitle").innerHTML = "Add Teacher";
//     document.getElementById("tSave").innerHTML = "Save Teacher";
//     document.getElementById("tCancel").classList.add("hide");
// }
// document.getElementById("tSave").addEventListener("click", function () {
//     var id = document.getElementById("tId").value.trim();
//     var name = document.getElementById("tName").value.trim();
//     var email = document.getElementById("tEmail").value.trim();
//     var pass = document.getElementById("tPass").value;
//     var subject = document.getElementById("tSubject").value.trim();

//     if (id == "" || name == "" || email == "" || pass == "") { showMsg("tMsg", "ID, name, email and password are required.", false); return; }
//     if (email.indexOf("@") == -1) { showMsg("tMsg", "Please enter a valid email.", false); return; }
//     if (pass.length < 4) { showMsg("tMsg", "Password must be at least 4 letters.", false); return; }

//     for (var i = 0; i < db.teachers.length; i++) {
//         var other = db.teachers[i];
//         if (other.id == editTeacherId) continue;
//         if (other.id.toLowerCase() == id.toLowerCase()) { showMsg("tMsg", "This teacher ID already exists.", false); return; }
//         if (other.email.toLowerCase() == email.toLowerCase()) { showMsg("tMsg", "This email is already used.", false); return; }
//     }

//     var message;
//     if (editTeacherId == null) {
//         db.teachers.push({ id: id, name: name, email: email, password: pass, subject: subject });
//         message = "Teacher added.";
//     } else {
//         var t = findById(db.teachers, editTeacherId);
//         t.name = name; t.email = email; t.password = pass; t.subject = subject;
//         message = "Teacher updated.";
//     }
//     saveDB();
//     clearTeacherForm();
//     fillTeachers(); fillSelects(); fillCourses(); fillHome();
//     showMsg("tMsg", message, true);
// });
// document.getElementById("tCancel").addEventListener("click", clearTeacherForm);

// function editTeacher(id) {
//     var t = findById(db.teachers, id);
//     editTeacherId = id;
//     document.getElementById("tId").value = t.id;
//     document.getElementById("tId").disabled = true;      // id badal nahi sakte
//     document.getElementById("tName").value = t.name;
//     document.getElementById("tEmail").value = t.email;
//     document.getElementById("tPass").value = t.password;
//     document.getElementById("tSubject").value = t.subject;
//     document.getElementById("tFormTitle").innerHTML = "Edit Teacher";
//     document.getElementById("tSave").innerHTML = "Update Teacher";
//     document.getElementById("tCancel").classList.remove("hide");
//     document.querySelector(".content").scrollTop = 0;
// }
// function deleteTeacher(id) {
//     if (!confirm("Delete this teacher? His/her courses will become 'Not assigned'.")) return;
//     db.teachers = removeFrom(db.teachers, "id", id);
//     for (var i = 0; i < db.courses.length; i++) {
//         if (db.courses[i].teacherId == id) db.courses[i].teacherId = "";
//     }
//     saveDB();
//     fillTeachers(); fillCourses(); fillSelects(); fillHome();
// }

// // ================= COURSES =================
// function fillCourses() {
//     var html = "";
//     for (var i = 0; i < db.courses.length; i++) {
//         var c = db.courses[i];
//         html += "<tr><td><b>" + c.code + "</b></td><td>" + c.name + "</td><td>" + teacherName(c.teacherId) + "</td>" +
//             '<td><button class="btn small" onclick="editCourse(\'' + c.id + '\')">Edit</button><button class="btn small danger" onclick="deleteCourse(\'' + c.id + '\')">Delete</button></td></tr>';
//     }
//     document.getElementById("coursesBody").innerHTML = html || '<tr><td class="empty" colspan="4">No courses yet.</td></tr>';
// }
// function clearCourseForm() {
//     editCourseId = null;
//     document.getElementById("cCode").value = "";
//     document.getElementById("cName").value = "";
//     document.getElementById("cTeacher").value = "";
//     document.getElementById("cFormTitle").innerHTML = "Add Course";
//     document.getElementById("cSave").innerHTML = "Save Course";
//     document.getElementById("cCancel").classList.add("hide");
// }
// document.getElementById("cSave").addEventListener("click", function () {
//     var code = document.getElementById("cCode").value.trim();
//     var name = document.getElementById("cName").value.trim();
//     var teacherId = document.getElementById("cTeacher").value;
//     if (code == "" || name == "") { showMsg("cMsg", "Course code and name are required.", false); return; }
//     for (var i = 0; i < db.courses.length; i++) {
//         if (db.courses[i].id != editCourseId && db.courses[i].code.toLowerCase() == code.toLowerCase()) {
//             showMsg("cMsg", "This course code already exists.", false);
//             return;
//         }
//     }
//     var message;
//     if (editCourseId == null) {
//         db.courses.push({ id: "C" + Date.now(), code: code, name: name, teacherId: teacherId });
//         message = "Course added.";
//     } else {
//         var c = findById(db.courses, editCourseId);
//         c.code = code; c.name = name; c.teacherId = teacherId;
//         message = "Course updated.";
//     }
//     saveDB();
//     clearCourseForm();
//     fillCourses(); fillTeachers(); fillSelects(); fillResults(); fillExams();
//     showMsg("cMsg", message, true);
// });
// document.getElementById("cCancel").addEventListener("click", clearCourseForm);

// function editCourse(id) {
//     var c = findById(db.courses, id);
//     editCourseId = id;
//     document.getElementById("cCode").value = c.code;
//     document.getElementById("cName").value = c.name;
//     document.getElementById("cTeacher").value = c.teacherId;
//     document.getElementById("cFormTitle").innerHTML = "Edit Course";
//     document.getElementById("cSave").innerHTML = "Update Course";
//     document.getElementById("cCancel").classList.remove("hide");
//     document.querySelector(".content").scrollTop = 0;
// }
// function deleteCourse(id) {
//     if (!confirm("Delete this course with its results, attendance and exams?")) return;
//     db.courses = removeFrom(db.courses, "id", id);
//     db.results = removeFrom(db.results, "courseId", id);
//     db.attendance = removeFrom(db.attendance, "courseId", id);
//     db.exams = removeFrom(db.exams, "courseId", id);
//     saveDB();
//     fillCourses(); fillTeachers(); fillResults(); fillExams(); fillSelects(); fillHome();
// }

// // ================= RESULTS =================
// function fillResults() {
//     var list = db.results.slice();
//     list.sort(function (a, b) { return b.date.localeCompare(a.date); });
//     var html = "";
//     for (var i = 0; i < list.length; i++) {
//         var r = list[i];
//         html += "<tr><td>" + studentName(r.studentId) + "</td><td>" + courseName(r.courseId) + "</td><td>" + r.examType + "</td><td>" + r.marks + "/" + r.total + "</td><td>" +
//             gradeBadge(getGrade((r.marks / r.total) * 100)) + "</td><td>" + showDate(r.date) + '</td><td><button class="btn small danger" onclick="deleteResult(\'' + r.id + '\')">Delete</button></td></tr>';
//     }
//     document.getElementById("resultsBody").innerHTML = html || '<tr><td class="empty" colspan="7">No results yet.</td></tr>';
// }
// document.getElementById("rSave").addEventListener("click", function () {
//     var studentId = document.getElementById("rStudent").value;
//     var courseId = document.getElementById("rCourse").value;
//     var examType = document.getElementById("rExam").value;
//     var marksText = document.getElementById("rMarks").value;
//     var totalText = document.getElementById("rTotal").value;
//     var date = document.getElementById("rDate").value;

//     if (studentId == "" || courseId == "") { showMsg("rMsg", "Please add students and courses first.", false); return; }
//     if (marksText == "" || totalText == "" || date == "") { showMsg("rMsg", "Please fill marks, total and date.", false); return; }
//     var marks = parseFloat(marksText);
//     var total = parseFloat(totalText);
//     if (total <= 0 || marks < 0 || marks > total) { showMsg("rMsg", "Marks must be between 0 and total marks.", false); return; }

//     db.results.push({ id: "R" + Date.now(), studentId: studentId, courseId: courseId, examType: examType, marks: marks, total: total, date: date });
//     saveDB();
//     document.getElementById("rMarks").value = "";
//     fillResults(); fillStudents(); fillHome();
//     showMsg("rMsg", "Result added.", true);
// });
// function deleteResult(id) {
//     if (!confirm("Delete this result?")) return;
//     db.results = removeFrom(db.results, "id", id);
//     saveDB();
//     fillResults(); fillStudents(); fillHome();
// }

// // ================= EXAMS =================
// function fillExams() {
//     var list = db.exams.slice();
//     list.sort(function (a, b) { return a.date.localeCompare(b.date); });
//     var html = "";
//     for (var i = 0; i < list.length; i++) {
//         var e = list[i];
//         html += "<tr><td>" + courseName(e.courseId) + "</td><td>" + e.type + "</td><td>" + showDate(e.date) + "</td><td>" + e.time + "</td><td>" + e.room + '</td><td><button class="btn small danger" onclick="deleteExam(\'' + e.id + '\')">Delete</button></td></tr>';
//     }
//     document.getElementById("examsBody").innerHTML = html || '<tr><td class="empty" colspan="6">No exams scheduled.</td></tr>';
// }
// document.getElementById("eSave").addEventListener("click", function () {
//     var courseId = document.getElementById("eCourse").value;
//     var type = document.getElementById("eType").value;
//     var date = document.getElementById("eDate").value;
//     var time = document.getElementById("eTime").value.trim();
//     var room = document.getElementById("eRoom").value.trim();
//     if (courseId == "" || date == "" || time == "" || room == "") { showMsg("eMsg", "Please fill all the fields.", false); return; }
//     db.exams.push({ id: "E" + Date.now(), courseId: courseId, type: type, date: date, time: time, room: room });
//     saveDB();
//     document.getElementById("eRoom").value = "";
//     fillExams();
//     showMsg("eMsg", "Exam added. Students can see it now.", true);
// });
// function deleteExam(id) {
//     if (!confirm("Delete this exam?")) return;
//     db.exams = removeFrom(db.exams, "id", id);
//     saveDB();
//     fillExams();
// }

// // ================= NOTICES =================
// function fillNotices() {
//     var list = db.notices.slice();
//     list.sort(function (a, b) { return b.date.localeCompare(a.date); });
//     var html = "";
//     for (var i = 0; i < list.length; i++) {
//         var n = list[i];
//         html += "<tr><td><b>" + n.title + "</b></td><td>" + n.text + "</td><td>" + n.by + "</td><td>" + showDate(n.date) + '</td><td><button class="btn small danger" onclick="deleteNotice(\'' + n.id + '\')">Delete</button></td></tr>';
//     }
//     document.getElementById("noticesBody").innerHTML = html || '<tr><td class="empty" colspan="5">No notices.</td></tr>';
// }
// document.getElementById("nSave").addEventListener("click", function () {
//     var title = document.getElementById("nTitle").value.trim();
//     var text = document.getElementById("nText").value.trim();
//     if (title == "" || text == "") { showMsg("nMsg", "Please write title and message.", false); return; }
//     db.notices.push({ id: "N" + Date.now(), title: title, text: text, date: todayText(), by: "Administrator", byId: "admin" });
//     saveDB();
//     document.getElementById("nTitle").value = "";
//     document.getElementById("nText").value = "";
//     fillNotices(); fillHome();
//     showMsg("nMsg", "Notice posted.", true);
// });
// function deleteNotice(id) {
//     if (!confirm("Delete this notice?")) return;
//     db.notices = removeFrom(db.notices, "id", id);
//     saveDB();
//     fillNotices(); fillHome();
// }

// // ================= FEEDBACK =================
// function fillFeedback() {
//     var html = "";
//     for (var i = db.feedback.length - 1; i >= 0; i--) {
//         var f = db.feedback[i];
//         html += "<tr><td>" + studentName(f.studentId) + "</td><td><b>" + f.subject + "</b></td><td>" + f.rating + "/5 ★</td><td>" + f.message + "</td><td>" + showDate(f.date) + '</td><td><button class="btn small danger" onclick="deleteFeedback(\'' + f.id + '\')">Delete</button></td></tr>';
//     }
//     document.getElementById("feedbackBody").innerHTML = html || '<tr><td class="empty" colspan="6">No feedback yet.</td></tr>';
// }
// function deleteFeedback(id) {
//     db.feedback = removeFrom(db.feedback, "id", id);
//     saveDB();
//     fillFeedback();
// }

// // ================= SETTINGS =================
// document.getElementById("passSave").addEventListener("click", function () {
//     var oldPass = document.getElementById("oldPass").value;
//     var newPass = document.getElementById("newPass").value;
//     var newPass2 = document.getElementById("newPass2").value;
//     if (oldPass != db.admin.password) { showMsg("passMsg", "Current password is wrong.", false); return; }
//     if (newPass.length < 4) { showMsg("passMsg", "New password must be at least 4 letters.", false); return; }
//     if (newPass != newPass2) { showMsg("passMsg", "Passwords do not match.", false); return; }
//     db.admin.password = newPass;
//     saveDB();
//     document.getElementById("oldPass").value = "";
//     document.getElementById("newPass").value = "";
//     document.getElementById("newPass2").value = "";
//     showMsg("passMsg", "Password updated.", true);
// });
// document.getElementById("backupBtn").addEventListener("click", function () {
//     var blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
//     var link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = "srms-backup.json";
//     link.click();
// });
// document.getElementById("resetBtn").addEventListener("click", function () {
//     if (!confirm("Delete ALL data and load the demo data again?")) return;
//     localStorage.removeItem("srms_db");
//     sessionStorage.removeItem("srms_user");
//     window.location.href = "admin-login.html";
// });

// // ================= dropdowns (select boxes) =================
// function fillSelects() {
//     var teachers = '<option value="">- Not assigned -</option>';
//     for (var i = 0; i < db.teachers.length; i++) teachers += '<option value="' + db.teachers[i].id + '">' + db.teachers[i].name + "</option>";
//     var oldTeacher = document.getElementById("cTeacher").value;
//     document.getElementById("cTeacher").innerHTML = teachers;
//     document.getElementById("cTeacher").value = oldTeacher;

//     var students = "";
//     for (var s = 0; s < db.students.length; s++) students += '<option value="' + db.students[s].id + '">' + db.students[s].roll + " - " + db.students[s].name + "</option>";
//     document.getElementById("rStudent").innerHTML = students;

//     var courses = "";
//     for (var c = 0; c < db.courses.length; c++) courses += '<option value="' + db.courses[c].id + '">' + db.courses[c].code + " - " + db.courses[c].name + "</option>";
//     document.getElementById("rCourse").innerHTML = courses;
//     document.getElementById("eCourse").innerHTML = courses;
// }

// // ---------- logout, menu button, theme ----------
// document.getElementById("logoutBtn").addEventListener("click", function () {
//     sessionStorage.removeItem("srms_user");
//     window.location.href = "admin-login.html";
// });




// // ---------- start ----------
// if (!loggedIn) {
//     window.location.href = "admin-login.html";
// } else {
//     document.getElementById("rDate").value = todayText();
//     document.getElementById("eDate").value = todayText();
//     fillSelects();
//     fillHome();
    fillStudents();
//     fillTeachers();
//     fillCourses();
//     fillResults();
//     fillExams();
//     fillNotices();
//     fillFeedback();
// }
