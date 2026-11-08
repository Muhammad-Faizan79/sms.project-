import express from "express"
import {
	changeAdminPassword,
	loginAdmin,
	logoutAdmin,
	signupAdmin,
	verifyMe
} from "../controller/authAdmin.js";
import {
	createAdminNotice,
	createResult,
	createStudent,
	createTeacher,
	deleteCourse,
	deleteExam,
	deleteFeedback,
	deleteNotice,
	deleteResult,
	deleteStudent,
	deleteTeacher,
	getBackup,
	listCourses,
	listExams,
	listFeedback,
	listNotices,
	listResults,
	listStudents,
	listTeachers,
	saveCourse,
	saveExam,
	updateStudent,
	updateTeacher
} from "../controller/admin.js";
import { getAttendance, markAttendance } from "../controller/attendance.js";
import { requireAdmin } from "../middleware/roleAuth.js";


const authRouter = express.Router();

authRouter.post("/signup", signupAdmin);
authRouter.post("/singup", signupAdmin);
authRouter.post("/loginadmin", loginAdmin);
authRouter.post("/logoutadmin", logoutAdmin);
authRouter.get("/meadmin", requireAdmin, verifyMe);

authRouter.use(requireAdmin);
authRouter.patch("/password", changeAdminPassword);
authRouter.get("/backup", getBackup);

authRouter.get("/students", listStudents);
authRouter.post("/students", createStudent);
authRouter.patch("/students/:id", updateStudent);
authRouter.delete("/students/:id", deleteStudent);
authRouter.post("/createstudent", createStudent);

authRouter.get("/teachers", listTeachers);
authRouter.post("/teachers", createTeacher);
authRouter.patch("/teachers/:id", updateTeacher);
authRouter.delete("/teachers/:id", deleteTeacher);

authRouter.get("/courses", listCourses);
authRouter.post("/courses", saveCourse);
authRouter.patch("/courses/:id", saveCourse);
authRouter.delete("/courses/:id", deleteCourse);

authRouter.get("/results", listResults);
authRouter.get("/allresults", listResults);
authRouter.post("/results", createResult);
authRouter.delete("/results/:id", deleteResult);

authRouter.get("/exams", listExams);
authRouter.post("/exams", saveExam);
authRouter.patch("/exams/:id", saveExam);
authRouter.delete("/exams/:id", deleteExam);

authRouter.get("/notices", listNotices);
authRouter.post("/notices", createAdminNotice);
authRouter.delete("/notices/:id", deleteNotice);

authRouter.get("/feedback", listFeedback);
authRouter.delete("/feedback/:id", deleteFeedback);

authRouter.get("/attendance", getAttendance);
authRouter.post("/attendance", markAttendance);


export default authRouter;