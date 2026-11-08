// data.js - har page me sabse pehle load hota hai.
// Agar browser (localStorage) me data nahi hai to yeh demo data bana deta hai.
// Baaki sab pages khud localStorage se data padhte hain:
//     var db = JSON.parse(localStorage.getItem("srms_db"));

if (localStorage.getItem("srms_db") == null) {

    // aaj se n din aage/peeche ki date "YYYY-MM-DD" me
    function dateAfter(n) {
        var d = new Date();
        d.setDate(d.getDate() + n);
        var m = d.getMonth() + 1;
        var day = d.getDate();
        return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
    }

    var seed = {
        admin: { username: "admin", password: "admin123" },
        teachers: [
            { id: "T001", name: "Dr. Rakesh Sharma", email: "rakesh@srms.edu", password: "teacher123", subject: "Data Structures, Networks" },
            { id: "T002", name: "Prof. Neha Gupta", email: "neha@srms.edu", password: "teacher123", subject: "DBMS" },
            { id: "T003", name: "Dr. Amit Singh", email: "amit@srms.edu", password: "teacher123", subject: "Operating Systems" },
            { id: "T004", name: "Prof. Pooja Mehta", email: "pooja@srms.edu", password: "teacher123", subject: "Software Engineering" }
        ],
        courses: [
            { id: "C1", code: "CS301", name: "Data Structures", teacherId: "T001" },
            { id: "C2", code: "CS302", name: "Database Management Systems", teacherId: "T002" },
            { id: "C3", code: "CS303", name: "Operating Systems", teacherId: "T003" },
            { id: "C4", code: "CS304", name: "Computer Networks", teacherId: "T001" },
            { id: "C5", code: "CS305", name: "Software Engineering", teacherId: "T004" }
        ],
        students: [],
        results: [],
        attendance: [],
        exams: [],
        notices: [
            { id: "N1", title: "End Semester Exam Schedule", text: "The end semester exams will begin soon. Check the Exams section.", date: dateAfter(-2), by: "Administrator", byId: "admin" },
            { id: "N2", title: "Result Declaration Notice", text: "Results for Mid Semester exams have been declared.", date: dateAfter(-5), by: "Administrator", byId: "admin" },
            { id: "N3", title: "Project Submission Deadline", text: "Final project submission is due next week.", date: dateAfter(-8), by: "Prof. Pooja Mehta", byId: "T004" }
        ],
        feedback: []
    };

    var names = ["Abhishek Verma", "Priya Sharma", "Rohan Mehta", "Sneha Patel", "Aman Khan", "Neha Singh"];
    var abhishekMarks = [86, 91, 78, 85, 92];

    for (var i = 0; i < names.length; i++) {
        var sid = "S" + (i + 1);
        seed.students.push({
            id: sid,
            roll: "CSE" + (2101 + i),
            name: names[i],
            email: names[i].split(" ")[0].toLowerCase() + "@student.srms.edu",
            password: "student123",
            course: "B.Tech CSE",
            year: 3,
            phone: "98765" + (10000 + i * 111)
        });

        for (var c = 0; c < seed.courses.length; c++) {
            // Mid Sem result
            var marks = (i == 0) ? abhishekMarks[c] : 48 + Math.floor(Math.random() * 47);
            seed.results.push({ id: "R" + i + "_" + c, studentId: sid, courseId: seed.courses[c].id, examType: "Mid Sem", marks: marks, total: 100, date: dateAfter(-30 + c * 3) });

            // last 10 days attendance
            for (var d = 1; d <= 10; d++) {
                var chance = (i == 0) ? 0.87 : 0.75;
                seed.attendance.push({ studentId: sid, courseId: seed.courses[c].id, date: dateAfter(-d), present: Math.random() < chance });
            }
        }
    }

    for (var e = 0; e < seed.courses.length; e++) {
        seed.exams.push({ id: "E" + (e + 1), courseId: seed.courses[e].id, type: "End Sem", date: dateAfter(15 + e * 2), time: "10:00 AM", room: "Hall " + (e + 1) });
    }

    localStorage.setItem("srms_db", JSON.stringify(seed));
}
