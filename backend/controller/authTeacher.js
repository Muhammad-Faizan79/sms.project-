import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Course from "../model/courses.js";
import Notice from "../model/notice.js";
import Results from "../model/result.js";
import students from "../model/student.js";
import Teacher from "../model/teacher.js";

const cookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	path: "/",
	maxAge: 24 * 60 * 60 * 1000
};

function teacherSecret() {
	return process.env.teacherSgret || process.env.adminSgret;
}

async function getAssignedCourseIds(teacherId) {
	const courses = await Course.find({ assignedTeacher: teacherId }).select("_id");
	return courses.map((course) => course._id);
}

export const teacherlogin = async (req, res) => {
	try {
		const { login, email, password } = req.body;
		const identifier = String(login || email || "").trim().toLowerCase();
		if (!identifier || !password) return res.status(400).json({ message: "Teacher ID/email and password are required", status: false });
		const teacher = await Teacher.findOne({
			$or: [{ email: identifier }, { teacherCode: identifier.toUpperCase() }]
		}).select("+password");
		if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
			return res.status(401).json({ message: "Invalid teacher ID/email or password", status: false });
		}
		const token = jwt.sign(
			{ id: teacher._id, email: teacher.email, role: "teacher" },
			teacherSecret(),
			{ expiresIn: "1d" }
		);
		res.cookie("teacherToken", token, cookieOptions);
		return res.json({
			message: "Teacher login successful",
			status: true,
			user: { id: teacher._id, name: teacher.name, teacherCode: teacher.teacherCode, email: teacher.email, role: "teacher" }
		});
	} catch (error) {
		return res.status(500).json({ message: "Unable to log in", status: false, error: error.message });
	}
};

export const teacherLogout = (_req, res) => {
	res.clearCookie("teacherToken", { ...cookieOptions, maxAge: undefined });
	return res.json({ message: "Logged out", status: true });
};

export const teacherMe = async (req, res) => {
	try {
		const teacher = await Teacher.findById(req.teacher.id);
		if (!teacher) return res.status(401).json({ message: "Teacher account not found", status: false });
		return res.json({ status: true, user: teacher });
	} catch (error) {
		return res.status(500).json({ message: "Unable to load teacher profile", status: false, error: error.message });
	}
};

export const updateTeacherProfile = async (req, res) => {
	try {
		const teacher = await Teacher.findById(req.teacher.id).select("+password");
		if (!teacher) return res.status(404).json({ message: "Teacher not found", status: false });
		const { name, email, subject, phone, currentPassword, newPassword } = req.body;
		if (name !== undefined) teacher.name = name.trim();
		if (email !== undefined) teacher.email = email.trim().toLowerCase();
		if (subject !== undefined) teacher.subject = subject.trim();
		if (phone !== undefined) teacher.phone = String(phone).trim();
		if (newPassword) {
			if (!currentPassword || !(await bcrypt.compare(currentPassword, teacher.password))) {
				return res.status(400).json({ message: "Current password is incorrect", status: false });
			}
			if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters", status: false });
			teacher.password = await bcrypt.hash(newPassword, 12);
		}
		await teacher.save();
		return res.json({ message: "Profile updated", status: true, user: teacher.toJSON() });
	} catch (error) {
		return res.status(error.code === 11000 ? 409 : 400).json({ message: error.code === 11000 ? "Email already in use" : "Unable to update profile", status: false });
	}
};

export const getTeacherCourses = async (req, res) => {
	try {
		const courses = await Course.find({ assignedTeacher: req.teacher.id }).sort({ courseCode: 1 });
		return res.json({ status: true, courses, count: courses.length });
	} catch (error) {
		return res.status(500).json({ message: "Unable to fetch courses", status: false, error: error.message });
	}
};

export const getTeacherStudents = async (_req, res) => {
	try {
		const data = await students.find().select("-password").sort({ className: 1, rollNo: 1 });
		return res.json({ status: true, students: data, count: data.length });
	} catch (error) {
		return res.status(500).json({ message: "Unable to fetch students", status: false, error: error.message });
	}
};

export const getTeacherResults = async (req, res) => {
	try {
		const data = await Results.find({ teacherId: req.teacher.id })
			.populate("studentId", "name rollNo")
			.populate("courseId", "courseCode courseName")
			.sort({ date: -1 });
		return res.json({ status: true, results: data, count: data.length });
	} catch (error) {
		return res.status(500).json({ message: "Unable to fetch results", status: false, error: error.message });
	}
};

export const saveTeacherResult = async (req, res) => {
	try {
		const { studentId, courseId, examType, marksObtained, totalMarks, date = new Date() } = req.body;
		if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(courseId) || !examType?.trim()) {
			return res.status(400).json({ message: "Student, course, and exam type are required", status: false });
		}
		const course = await Course.findOne({ _id: courseId, assignedTeacher: req.teacher.id });
		if (!course) return res.status(403).json({ message: "You can only enter results for your assigned courses", status: false });
		if (!(await students.exists({ _id: studentId }))) return res.status(404).json({ message: "Student not found", status: false });
		const marks = Number(marksObtained);
		const total = Number(totalMarks);
		if (!Number.isFinite(marks) || !Number.isFinite(total) || total <= 0 || marks < 0 || marks > total) {
			return res.status(400).json({ message: "Marks must be between zero and total marks", status: false });
		}

		const values = { studentId, courseId, teacherId: req.teacher.id, examType: examType.trim(), marksObtained: marks, totalMarks: total, date };
		const result = req.params.id
			? await Results.findOneAndUpdate({ _id: req.params.id, teacherId: req.teacher.id }, { $set: values }, { new: true, runValidators: true })
			: await Results.create(values);
		if (!result && req.params.id) return res.status(404).json({ message: "Result not found", status: false });
		return res.status(req.params.id ? 200 : 201).json({ message: "Result saved", status: true, result });
	} catch (error) {
		return res.status(400).json({ message: "Unable to save result", status: false, error: error.message });
	}
};

export const deleteTeacherResult = async (req, res) => {
	if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid result ID", status: false });
	try {
		const result = await Results.findOneAndDelete({ _id: req.params.id, teacherId: req.teacher.id });
		if (!result) return res.status(404).json({ message: "Result not found", status: false });
		return res.json({ message: "Result deleted", status: true });
	} catch (error) {
		return res.status(500).json({ message: "Unable to delete result", status: false, error: error.message });
	}
};

export const getTeacherNotices = async (req, res) => {
	try {
		const notices = await Notice.find({ authorId: req.teacher.id, authorRole: "teacher" }).sort({ createdAt: -1 });
		return res.json({ status: true, notices, count: notices.length });
	} catch (error) {
		return res.status(500).json({ message: "Unable to fetch notices", status: false, error: error.message });
	}
};

export const createTeacherNotice = async (req, res) => {
	try {
		const { title, text } = req.body;
		if (!title?.trim() || !text?.trim()) return res.status(400).json({ message: "Title and message are required", status: false });
		const teacher = await Teacher.findById(req.teacher.id).select("name");
		const notice = await Notice.create({ title, text, authorId: teacher._id, authorName: teacher.name, authorRole: "teacher" });
		return res.status(201).json({ message: "Notice posted", status: true, notice });
	} catch (error) {
		return res.status(400).json({ message: "Unable to post notice", status: false, error: error.message });
	}
};

export const deleteTeacherNotice = async (req, res) => {
	if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid notice ID", status: false });
	try {
		const notice = await Notice.findOneAndDelete({ _id: req.params.id, authorId: req.teacher.id, authorRole: "teacher" });
		if (!notice) return res.status(404).json({ message: "Notice not found", status: false });
		return res.json({ message: "Notice deleted", status: true });
	} catch (error) {
		return res.status(500).json({ message: "Unable to delete notice", status: false, error: error.message });
	}
};
