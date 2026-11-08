import express from "express";
import {
    createTeacherNotice,
    deleteTeacherNotice,
    deleteTeacherResult,
    getTeacherCourses,
    getTeacherNotices,
    getTeacherResults,
    getTeacherStudents,
    saveTeacherResult,
    teacherLogout,
    teacherMe,
    teacherlogin,
    updateTeacherProfile
} from "../controller/authTeacher.js";
import { getAttendance, markAttendance } from "../controller/attendance.js";
import {
    getSchoolAttendanceForTeacher,
    markSchoolAttendanceByQr,
    saveSchoolAttendance
} from "../controller/schoolAttendance.js";
import { requireTeacher } from "../middleware/roleAuth.js";

const teacherRouter = express.Router();

teacherRouter.post("/login", teacherlogin);
teacherRouter.post("/logout", teacherLogout);
teacherRouter.get("/me", requireTeacher, teacherMe);

teacherRouter.use(requireTeacher);
teacherRouter.get("/profile", teacherMe);
teacherRouter.patch("/profile", updateTeacherProfile);
teacherRouter.get("/courses", getTeacherCourses);
teacherRouter.get("/students", getTeacherStudents);
teacherRouter.get("/results", getTeacherResults);
teacherRouter.post("/results", saveTeacherResult);
teacherRouter.patch("/results/:id", saveTeacherResult);
teacherRouter.delete("/results/:id", deleteTeacherResult);
teacherRouter.get("/attendance", getAttendance);
teacherRouter.post("/attendance", markAttendance);
teacherRouter.get("/school-attendance", getSchoolAttendanceForTeacher);
teacherRouter.post("/school-attendance", saveSchoolAttendance);
teacherRouter.post("/school-attendance/scan", markSchoolAttendanceByQr);
teacherRouter.get("/notices", getTeacherNotices);
teacherRouter.post("/notices", createTeacherNotice);
teacherRouter.delete("/notices/:id", deleteTeacherNotice);

export default teacherRouter;