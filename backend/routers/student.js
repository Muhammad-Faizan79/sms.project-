import express from "express";
import {
	createStudentFeedback,
	getStudentCourses,
	getStudentExams,
	getStudentFeedback,
	getStudentNotices,
	getStudentRanking,
	getStudentResults,
	logoutStudent,
	studentlogin,
	updateStudentProfile,
	verifyStd
} from "../controller/student.js";
import { getAttendance } from "../controller/attendance.js";
import { getStudentAttendanceQr, getSchoolAttendanceForStudent } from "../controller/schoolAttendance.js";
import { studentMIddlewate } from "../middleware/studentMiddle.js";

const studentrouter = express.Router();

studentrouter.post("/login", studentlogin);
studentrouter.post("/studentlogin", studentlogin);
studentrouter.post("/logout", logoutStudent);
studentrouter.post("/lougout", logoutStudent);
studentrouter.get("/me", studentMIddlewate, verifyStd);
studentrouter.post("/verify", studentMIddlewate, verifyStd);

studentrouter.use(studentMIddlewate);
studentrouter.get("/profile", verifyStd);
studentrouter.patch("/profile", updateStudentProfile);
studentrouter.get("/courses", getStudentCourses);
studentrouter.get("/results", getStudentResults);
studentrouter.get("/ranking", getStudentRanking);
studentrouter.get("/attendance", getAttendance);
studentrouter.get("/attendance/qr", getStudentAttendanceQr);
studentrouter.get("/school-attendance", getSchoolAttendanceForStudent);
studentrouter.get("/exams", getStudentExams);
studentrouter.get("/notices", getStudentNotices);
studentrouter.get("/feedback", getStudentFeedback);
studentrouter.post("/feedback", createStudentFeedback);


export default studentrouter;