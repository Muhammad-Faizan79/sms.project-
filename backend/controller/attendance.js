import mongoose from "mongoose";
import Attendance from "../model/attendance.js";
import Course from "../model/courses.js";
import students from "../model/student.js";

function parseDate(date) {
    const text = date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const value = new Date(`${text}T00:00:00.000Z`);
    return Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== text ? null : value;
}

export const getAttendance = async (req, res) => {
    try {
        const filter = {};
        if (req.student) filter.studentId = req.student.studentId;
        if (req.query.studentId) {
            if (!mongoose.isValidObjectId(req.query.studentId)) return res.status(400).json({ message: "Invalid student ID", status: false });
            if (req.student && String(req.student.studentId) !== req.query.studentId) return res.status(403).json({ message: "Access denied", status: false });
            filter.studentId = req.query.studentId;
        }
        if (req.query.courseId) {
            if (!mongoose.isValidObjectId(req.query.courseId)) return res.status(400).json({ message: "Invalid course ID", status: false });
            filter.courseId = req.query.courseId;
        }
        if (req.query.date) {
            const date = parseDate(req.query.date);
            if (!date) return res.status(400).json({ message: "Date must be a valid YYYY-MM-DD date", status: false });
            filter.date = date;
        }
        if (req.teacher) {
            const assignedCourses = await Course.find({ assignedTeacher: req.teacher.id }).select("_id");
            const assignedIds = assignedCourses.map((course) => course._id);
            if (filter.courseId && !assignedIds.some((id) => String(id) === String(filter.courseId))) {
                return res.status(403).json({ message: "You can only view attendance for your courses", status: false });
            }
            if (!filter.courseId) filter.courseId = { $in: assignedIds };
        }

        const attendance = await Attendance.find(filter)
            .populate("studentId", "name className group rollNo")
            .populate("courseId", "courseCode courseName")
            .sort({ date: -1 });
        return res.json({ status: true, attendance, count: attendance.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch attendance", status: false, error: error.message });
    }
};

export const markAttendance = async (req, res) => {
    try {
        const { courseId } = req.body;
        const date = parseDate(req.body.date);
        const records = Array.isArray(req.body.records)
            ? req.body.records
            : [{ studentId: req.body.studentId, status: req.body.status }];

        if (!courseId || !mongoose.isValidObjectId(courseId) || !date || records.length === 0) {
            return res.status(400).json({ message: "Course, valid date, and attendance records are required", status: false });
        }
        const course = await Course.findById(courseId).select("assignedTeacher");
        if (!course) return res.status(404).json({ message: "Course not found", status: false });
        if (req.teacher && String(course.assignedTeacher) !== String(req.teacher.id)) {
            return res.status(403).json({ message: "You can only mark attendance for your courses", status: false });
        }

        const seen = new Set();
        for (const record of records) {
            if (!mongoose.isValidObjectId(record.studentId) || !["present", "absent", "late"].includes(record.status)) {
                return res.status(400).json({ message: "Each record needs a valid studentId and a present/absent/late status", status: false });
            }
            if (seen.has(String(record.studentId))) return res.status(400).json({ message: "Duplicate student in attendance records", status: false });
            seen.add(String(record.studentId));
        }

        const studentCount = await students.countDocuments({ _id: { $in: [...seen] } });
        if (studentCount !== seen.size) return res.status(404).json({ message: "One or more students were not found", status: false });

        const operations = records.map(({ studentId, status }) => ({
            updateOne: {
                filter: { studentId, courseId, date },
                update: { $set: { status } },
                upsert: true
            }
        }));
        const result = await Attendance.bulkWrite(operations, { ordered: true });
        return res.status(200).json({
            message: "Attendance saved",
            status: true,
            saved: result.upsertedCount + result.modifiedCount
        });
    } catch (error) {
        return res.status(400).json({ message: "Unable to save attendance", status: false, error: error.message });
    }
};