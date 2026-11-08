import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Attendance from "../model/attendance.js";
import Course from "../model/courses.js";
import Exam from "../model/exam.js";
import Feedback from "../model/feedback.js";
import Notice from "../model/notice.js";
import Results from "../model/result.js";
import students from "../model/student.js";
import SchoolAttendance from "../model/schoolAttendance.js";
import Teacher from "../model/teacher.js";
import User from "../model/user.js";
import { createAttendanceQrPayload } from "./schoolAttendance.js";

function invalidId(id) {
    return !mongoose.isValidObjectId(id);
}

function normalizeSchoolClass(value) {
    const match = String(value ?? "").trim().match(/^(?:class\s*)?([1-9]|10)$/i);
    return match ? match[1] : null;
}

function handleError(res, error, message) {
    const duplicate = error.code === 11000;
    return res.status(duplicate ? 409 : 400).json({
        message: duplicate ? "Email, roll number, or code is already in use" : message,
        status: false
    });
}

export const listStudents = async (_req, res) => {
    try {
        const data = await students.find().select("-password").sort({ name: 1 });
        return res.json({ status: true, students: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch students");
    }
};

export const createStudent = async (req, res) => {
    try {
        const { name, email, password, phone = "", className, group = "A", rollNo } = req.body;
        const schoolClass = normalizeSchoolClass(className);
        if (!name?.trim() || !email?.trim() || !password || password.length < 8 || !schoolClass || !rollNo?.trim()) {
            return res.status(400).json({ message: "Name, email, roll number, Class 1-10, and password (8+ characters) are required", status: false });
        }
        if (!process.env.QR_ATTENDANCE_SECRET) {
            return res.status(503).json({ message: "Student QR attendance is not configured", status: false });
        }
        const student = await students.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: await bcrypt.hash(password, 12),
            phone: String(phone).trim(),
            className: schoolClass,
            group: group.trim(),
            rollNo: rollNo.trim().toUpperCase()
        });
        return res.status(201).json({
            message: "Student created",
            status: true,
            student: student.toJSON(),
            qrPayload: createAttendanceQrPayload(student._id)
        });
    } catch (error) {
        return handleError(res, error, "Unable to create student");
    }
};

export const updateStudent = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid student ID", status: false });
    try {
        const { name, email, phone, className, group, rollNo } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (email !== undefined) updates.email = email.trim().toLowerCase();
        if (phone !== undefined) updates.phone = String(phone).trim();
        if (className !== undefined) {
            const schoolClass = normalizeSchoolClass(className);
            if (!schoolClass) return res.status(400).json({ message: "Class must be between 1 and 10", status: false });
            updates.className = schoolClass;
        }
        if (group !== undefined) updates.group = group.trim();
        if (rollNo !== undefined) updates.rollNo = rollNo.trim().toUpperCase();
        const student = await students.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
        if (!student) return res.status(404).json({ message: "Student not found", status: false });
        return res.json({ message: "Student updated", status: true, student });
    } catch (error) {
        return handleError(res, error, "Unable to update student");
    }
};

export const deleteStudent = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid student ID", status: false });
    try {
        const student = await students.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found", status: false });
        await Promise.all([
            Results.deleteMany({ studentId: student._id }),
            Attendance.deleteMany({ studentId: student._id }),
            SchoolAttendance.deleteMany({ studentId: student._id }),
            Feedback.deleteMany({ studentId: student._id })
        ]);
        return res.json({ message: "Student and related records deleted", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete student");
    }
};

export const listTeachers = async (_req, res) => {
    try {
        const data = await Teacher.find().sort({ name: 1 });
        return res.json({ status: true, teachers: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch teachers");
    }
};

export const createTeacher = async (req, res) => {
    try {
        const { teacherCode, name, email, password, subject = "", phone = "" } = req.body;
        if (!teacherCode?.trim() || !name?.trim() || !email?.trim() || !password || password.length < 8) {
            return res.status(400).json({ message: "Teacher ID, name, email, and password (8+ characters) are required", status: false });
        }
        const teacher = await Teacher.create({
            teacherCode: teacherCode.trim().toUpperCase(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: await bcrypt.hash(password, 12),
            subject: subject.trim(),
            phone: String(phone).trim()
        });
        return res.status(201).json({ message: "Teacher created", status: true, teacher });
    } catch (error) {
        return handleError(res, error, "Unable to create teacher");
    }
};

export const updateTeacher = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid teacher ID", status: false });
    try {
        const { teacherCode, name, email, subject, phone, password } = req.body;
        const updates = {};
        if (teacherCode !== undefined) updates.teacherCode = teacherCode.trim().toUpperCase();
        if (name !== undefined) updates.name = name.trim();
        if (email !== undefined) updates.email = email.trim().toLowerCase();
        if (subject !== undefined) updates.subject = subject.trim();
        if (phone !== undefined) updates.phone = String(phone).trim();
        if (password) {
            if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters", status: false });
            updates.password = await bcrypt.hash(password, 12);
        }
        const teacher = await Teacher.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!teacher) return res.status(404).json({ message: "Teacher not found", status: false });
        return res.json({ message: "Teacher updated", status: true, teacher });
    } catch (error) {
        return handleError(res, error, "Unable to update teacher");
    }
};

export const deleteTeacher = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid teacher ID", status: false });
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!teacher) return res.status(404).json({ message: "Teacher not found", status: false });
        const courses = await Course.find({ assignedTeacher: teacher._id }).select("_id");
        const courseIds = courses.map((course) => course._id);
        await Promise.all([
            Course.updateMany({ assignedTeacher: teacher._id }, { $set: { assignedTeacher: null } }),
            Results.updateMany({ teacherId: teacher._id }, { $set: { teacherId: null } }),
            SchoolAttendance.updateMany({ markedBy: teacher._id }, { $set: { markedBy: null } }),
            Results.deleteMany({ courseId: { $in: courseIds } }),
            Attendance.deleteMany({ courseId: { $in: courseIds } }),
            Exam.deleteMany({ courseId: { $in: courseIds } })
        ]);
        return res.json({ message: "Teacher deleted and courses unassigned", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete teacher");
    }
};

export const listCourses = async (_req, res) => {
    try {
        const data = await Course.find().populate("assignedTeacher", "teacherCode name email").sort({ courseCode: 1 });
        return res.json({ status: true, courses: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch courses");
    }
};

export const saveCourse = async (req, res) => {
    try {
        const { courseCode, courseName, assignedTeacher } = req.body;
        if (!courseCode?.trim() || !courseName?.trim() || (assignedTeacher && invalidId(assignedTeacher))) {
            return res.status(400).json({ message: "Course code and name are required, with a valid teacher if assigned", status: false });
        }
        if (assignedTeacher && !(await Teacher.exists({ _id: assignedTeacher }))) return res.status(404).json({ message: "Teacher not found", status: false });
        const teacherId = assignedTeacher || null;
        const course = req.params.id
            ? await Course.findByIdAndUpdate(req.params.id, { courseCode, courseName, assignedTeacher: teacherId }, { new: true, runValidators: true })
            : await Course.create({ courseCode, courseName, assignedTeacher: teacherId });
        if (!course && req.params.id) return res.status(404).json({ message: "Course not found", status: false });
        return res.status(req.params.id ? 200 : 201).json({ message: "Course saved", status: true, course });
    } catch (error) {
        return handleError(res, error, "Unable to save course");
    }
};

export const deleteCourse = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid course ID", status: false });
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: "Course not found", status: false });
        await Promise.all([
            Results.deleteMany({ courseId: course._id }),
            Attendance.deleteMany({ courseId: course._id }),
            Exam.deleteMany({ courseId: course._id })
        ]);
        return res.json({ message: "Course and related records deleted", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete course");
    }
};

export const listResults = async (_req, res) => {
    try {
        const data = await Results.find()
            .populate("studentId", "name rollNo")
            .populate("courseId", "courseCode courseName")
            .populate("teacherId", "name teacherCode")
            .sort({ date: -1 });
        return res.json({ status: true, results: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch results");
    }
};

export const createResult = async (req, res) => {
    try {
        const { studentId, courseId, teacherId = null, examType, marksObtained, totalMarks, date = new Date() } = req.body;
        if (!studentId || invalidId(studentId) || !courseId || invalidId(courseId) || !examType?.trim()) {
            return res.status(400).json({ message: "Student, course, and exam type are required", status: false });
        }
        const marks = Number(marksObtained);
        const total = Number(totalMarks);
        if (!Number.isFinite(marks) || !Number.isFinite(total) || total <= 0 || marks < 0 || marks > total) {
            return res.status(400).json({ message: "Marks must be between zero and total marks", status: false });
        }
        const [studentExists, courseExists, teacherExists] = await Promise.all([
            students.exists({ _id: studentId }),
            Course.exists({ _id: courseId }),
            teacherId && mongoose.isValidObjectId(teacherId) ? Teacher.exists({ _id: teacherId }) : Promise.resolve(!teacherId)
        ]);
        if (!studentExists || !courseExists || !teacherExists) {
            return res.status(404).json({ message: "Student, course, or teacher was not found", status: false });
        }
        const result = await Results.create({ studentId, courseId, teacherId, examType: examType.trim(), marksObtained: marks, totalMarks: total, date });
        return res.status(201).json({ message: "Result created", status: true, result });
    } catch (error) {
        return handleError(res, error, "Unable to create result");
    }
};

export const deleteResult = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid result ID", status: false });
    try {
        const result = await Results.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: "Result not found", status: false });
        return res.json({ message: "Result deleted", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete result");
    }
};

export const listExams = async (_req, res) => {
    try {
        const data = await Exam.find().populate("courseId", "courseCode courseName").sort({ date: 1 });
        return res.json({ status: true, exams: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch exams");
    }
};

export const saveExam = async (req, res) => {
    try {
        const { courseId, examType, date, time, room } = req.body;
        if (!courseId || invalidId(courseId) || !examType?.trim() || !date || !time?.trim() || !room?.trim()) {
            return res.status(400).json({ message: "Course, exam type, date, time, and room are required", status: false });
        }
        if (!(await Course.exists({ _id: courseId }))) return res.status(404).json({ message: "Course not found", status: false });
        const exam = req.params.id
            ? await Exam.findByIdAndUpdate(req.params.id, { courseId, examType, date, time, room }, { new: true, runValidators: true })
            : await Exam.create({ courseId, examType, date, time, room });
        if (!exam && req.params.id) return res.status(404).json({ message: "Exam not found", status: false });
        return res.status(req.params.id ? 200 : 201).json({ message: "Exam saved", status: true, exam });
    } catch (error) {
        return handleError(res, error, "Unable to save exam");
    }
};

export const deleteExam = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid exam ID", status: false });
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ message: "Exam not found", status: false });
        return res.json({ message: "Exam deleted", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete exam");
    }
};

export const listNotices = async (_req, res) => {
    try {
        const data = await Notice.find().sort({ createdAt: -1 });
        return res.json({ status: true, notices: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch notices");
    }
};

export const createAdminNotice = async (req, res) => {
    try {
        const { title, text } = req.body;
        if (!title?.trim() || !text?.trim()) return res.status(400).json({ message: "Title and message are required", status: false });
        const notice = await Notice.create({ title, text, authorId: req.admin.id, authorName: req.admin.name, authorRole: "admin" });
        return res.status(201).json({ message: "Notice posted", status: true, notice });
    } catch (error) {
        return handleError(res, error, "Unable to post notice");
    }
};

export const deleteNotice = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid notice ID", status: false });
    try {
        const notice = await Notice.findByIdAndDelete(req.params.id);
        if (!notice) return res.status(404).json({ message: "Notice not found", status: false });
        return res.json({ message: "Notice deleted", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete notice");
    }
};

export const listFeedback = async (_req, res) => {
    try {
        const data = await Feedback.find().populate("studentId", "name rollNo").sort({ createdAt: -1 });
        return res.json({ status: true, feedback: data, count: data.length });
    } catch (error) {
        return handleError(res, error, "Unable to fetch feedback");
    }
};

export const deleteFeedback = async (req, res) => {
    if (invalidId(req.params.id)) return res.status(400).json({ message: "Invalid feedback ID", status: false });
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);
        if (!feedback) return res.status(404).json({ message: "Feedback not found", status: false });
        return res.json({ message: "Feedback deleted", status: true });
    } catch (error) {
        return handleError(res, error, "Unable to delete feedback");
    }
};

export const getBackup = async (_req, res) => {
    try {
        const [studentList, teacherList, courses, results, attendance, schoolAttendance, exams, notices, feedback] = await Promise.all([
            students.find().select("-password"), Teacher.find(), Course.find(), Results.find(), Attendance.find(), SchoolAttendance.find(), Exam.find(), Notice.find(), Feedback.find()
        ]);
        return res.json({ status: true, data: { students: studentList, teachers: teacherList, courses, results, attendance, schoolAttendance, exams, notices, feedback } });
    } catch (error) {
        return handleError(res, error, "Unable to create backup");
    }
};