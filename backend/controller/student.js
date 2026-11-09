import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Course from "../model/courses.js";
import Exam from "../model/exam.js";
import Feedback from "../model/feedback.js";
import Notice from "../model/notice.js";
import Results from "../model/result.js";
import students from "../model/student.js";

const cookieOptions = {
    httpOnly: true,
    sameSite: "none",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000
};

export const studentlogin = async (req, res) => {
    try {
        console.log("hello student login");
        const { login, email, password } = req.body;
        const identifier = String(login || email || "").trim();
        if (!identifier || !password) return res.status(400).json({ message: "Roll number/email and password are required", status: false });
        const student = await students.findOne({
            $or: [{ email: identifier.toLowerCase() }, { rollNo: identifier.toUpperCase() }]
        }).select("+password");
        if (!student || !(await bcrypt.compare(password, student.password))) {
            return res.status(401).json({ message: "Invalid roll number/email or password", status: false });
        }
        const token = jwt.sign(
            { id: student._id, studentId: student._id, email: student.email, role: "student" },
            process.env.studentsgret,
            { expiresIn: "1d" }
        );
        res.cookie("studentToken", token, cookieOptions);
        return res.json({
            message: "Student login successful",
            status: true,
            user: { id: student._id, name: student.name, email: student.email, rollNo: student.rollNo, role: "student" }
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to log in", status: false, error: error.message });
    }
};

export const logoutStudent = (_req, res) => {
    res.clearCookie("studentToken", { ...cookieOptions, maxAge: undefined });
    return res.json({ message: "Logged out", status: true });
};

export const verifyStd = async (req, res) => {
    try {
        const student = await students.findById(req.student.studentId).select("-password");
        if (!student) return res.status(401).json({ message: "Student account not found", status: false });
        return res.json({ message: "Authenticated", status: true, user: student });
    } catch (error) {
        return res.status(500).json({ message: "Unable to load student profile", status: false, error: error.message });
    }
};

export const updateStudentProfile = async (req, res) => {
    try {
        const student = await students.findById(req.student.studentId).select("+password");
        if (!student) return res.status(404).json({ message: "Student not found", status: false });
        const { email, phone, currentPassword, newPassword } = req.body;
        if (email !== undefined) student.email = email.trim().toLowerCase();
        if (phone !== undefined) student.phone = String(phone).trim();
        if (newPassword) {
            if (!currentPassword || !(await bcrypt.compare(currentPassword, student.password))) {
                return res.status(400).json({ message: "Current password is incorrect", status: false });
            }
            if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters", status: false });
            student.password = await bcrypt.hash(newPassword, 12);
        }
        await student.save();
        return res.json({ message: "Profile updated", status: true, user: student.toJSON() });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "Email already in use" : "Unable to update profile", status: false });
    }
};

export const getStudentCourses = async (_req, res) => {
    try {
        const courses = await Course.find().populate("assignedTeacher", "name teacherCode").sort({ courseCode: 1 });
        return res.json({ status: true, courses, count: courses.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch courses", status: false, error: error.message });
    }
};

export const getStudentResults = async (req, res) => {
    try {
        const results = await Results.find({ studentId: req.student.studentId })
            .populate("courseId", "courseCode courseName")
            .populate("teacherId", "name teacherCode")
            .sort({ date: -1 });
        return res.json({ status: true, results, count: results.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch results", status: false, error: error.message });
    }
};

export const getStudentExams = async (_req, res) => {
    try {
        const exams = await Exam.find().populate("courseId", "courseCode courseName").sort({ date: 1 });
        return res.json({ status: true, exams, count: exams.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch exams", status: false, error: error.message });
    }
};

export const getStudentNotices = async (_req, res) => {
    try {
        const notices = await Notice.find().sort({ createdAt: -1 });
        return res.json({ status: true, notices, count: notices.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch notices", status: false, error: error.message });
    }
};

export const getStudentFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find({ studentId: req.student.studentId }).sort({ createdAt: -1 });
        return res.json({ status: true, feedback, count: feedback.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch feedback", status: false, error: error.message });
    }
};

export const createStudentFeedback = async (req, res) => {
    try {
        const { subject, rating, message } = req.body;
        const score = Number(rating);
        if (!subject?.trim() || !message?.trim() || !Number.isInteger(score) || score < 1 || score > 5) {
            return res.status(400).json({ message: "Subject, message, and a rating from 1 to 5 are required", status: false });
        }
        const feedback = await Feedback.create({ studentId: req.student.studentId, subject, rating: score, message });
        return res.status(201).json({ message: "Feedback submitted", status: true, feedback });
    } catch (error) {
        return res.status(400).json({ message: "Unable to submit feedback", status: false, error: error.message });
    }
};

export const getStudentRanking = async (req, res) => {
    try {
        const student = await students.findById(req.student.studentId).select("className group");
        if (!student) return res.status(404).json({ message: "Student not found", status: false });
        const classmates = await students.find({ className: student.className, group: student.group }).distinct("_id");
        const scores = await Results.aggregate([
            { $match: { studentId: { $in: classmates } } },
            {
                $group: {
                    _id: "$studentId",
                    average: { $avg: { $multiply: [{ $divide: ["$marksObtained", "$totalMarks"] }, 100] } }
                }
            },
            { $sort: { average: -1 } }
        ]);
        const mine = scores.find((score) => String(score._id) === String(student._id));
        const average = mine?.average || 0;
        const rank = 1 + scores.filter((score) => score.average > average).length;
        return res.json({ status: true, rank, classSize: classmates.length, average: Number(average.toFixed(2)) });
    } catch (error) {
        return res.status(500).json({ message: "Unable to calculate class rank", status: false, error: error.message });
    }
};