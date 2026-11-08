import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import SchoolAttendance from "../model/schoolAttendance.js";
import students from "../model/student.js";

const classValues = new Set(Array.from({ length: 10 }, (_value, index) => String(index + 1)));

function parseClassName(value) {
    const match = String(value ?? "").trim().match(/^(?:class\s*)?([1-9]|10)$/i);
    return match && classValues.has(match[1]) ? match[1] : null;
}

function parseDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function attendanceQrSecret() {
    if (!process.env.QR_ATTENDANCE_SECRET) {
        throw new Error("QR_ATTENDANCE_SECRET is not configured");
    }
    return process.env.QR_ATTENDANCE_SECRET;
}

export function createAttendanceQrPayload(studentId) {
    return jwt.sign(
        { studentId: String(studentId), purpose: "school-attendance" },
        attendanceQrSecret(),
        { noTimestamp: true }
    );
}

function isFutureDate(date) {
    return date.getTime() > parseDate(new Date().toISOString().slice(0, 10)).getTime();
}

function monthlyCounts(records) {
    const months = new Map();
    for (const record of records) {
        const month = record.date.toISOString().slice(0, 7);
        const counts = months.get(month) || { month, present: 0, late: 0, absent: 0, total: 0 };
        counts[record.status] += 1;
        counts.total += 1;
        months.set(month, counts);
    }
    return [...months.values()]
        .sort((left, right) => right.month.localeCompare(left.month))
        .map((counts) => ({
            ...counts,
            attended: counts.present + counts.late,
            percentage: counts.total ? Math.round(((counts.present + counts.late) / counts.total) * 100) : 0
        }));
}

export const getStudentAttendanceQr = async (req, res) => {
    if (!process.env.QR_ATTENDANCE_SECRET) {
        return res.status(503).json({ message: "Student QR attendance is not configured", status: false });
    }
    try {
        const student = await students.findById(req.student.studentId).select("name rollNo className");
        if (!student) return res.status(404).json({ message: "Student not found", status: false });
        const token = createAttendanceQrPayload(student._id);
        return res.json({
            status: true,
            qrPayload: token,
            student: { name: student.name, rollNo: student.rollNo, className: student.className }
        });
    } catch (error) {
        console.error("Unable to create student attendance QR:", error.message);
        return res.status(500).json({ message: "Unable to create student attendance QR", status: false });
    }
};

export const getSchoolAttendanceForStudent = async (req, res) => {
    try {
        const attendance = await SchoolAttendance.find({ studentId: req.student.studentId })
            .sort({ date: -1 })
            .lean();
        return res.json({
            status: true,
            attendance,
            count: attendance.length,
            monthlySummary: monthlyCounts(attendance)
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch school attendance", status: false });
    }
};

export const getSchoolAttendanceForTeacher = async (req, res) => {
    const className = parseClassName(req.query.className);
    const date = parseDate(req.query.date);
    if (!className || !date) {
        return res.status(400).json({ message: "Choose a class from 1 to 10 and a valid date", status: false });
    }
    try {
        const attendance = await SchoolAttendance.find({ className, date })
            .populate("studentId", "name rollNo className")
            .sort({ createdAt: 1 });
        return res.json({ status: true, attendance, count: attendance.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch school attendance", status: false });
    }
};

export const markSchoolAttendanceByQr = async (req, res) => {
    const body = req.body || {};
    const { qrPayload } = body;
    const className = parseClassName(body.className);
    const date = parseDate(body.date);
    if (typeof qrPayload !== "string" || !qrPayload || !className || !date) {
        return res.status(400).json({ message: "A student QR code, class from 1 to 10, and valid date are required", status: false });
    }
    if (isFutureDate(date)) return res.status(400).json({ message: "Future attendance cannot be recorded", status: false });

    let decoded;
    try {
        decoded = jwt.verify(qrPayload, attendanceQrSecret());
    } catch (error) {
        if (error.message === "QR_ATTENDANCE_SECRET is not configured") {
            console.error("Unable to verify student attendance QR:", error.message);
            return res.status(503).json({ message: "Student QR attendance is not configured", status: false });
        }
        return res.status(400).json({ message: "Invalid or expired student QR code", status: false });
    }
    if (decoded.purpose !== "school-attendance" || !mongoose.isValidObjectId(decoded.studentId)) {
        return res.status(400).json({ message: "Invalid student QR code", status: false });
    }

    try {
        const student = await students.findById(decoded.studentId).select("name rollNo className");
        if (!student) return res.status(404).json({ message: "Student account not found", status: false });
        if (parseClassName(student.className) !== className) {
            return res.status(403).json({ message: `This student belongs to Class ${student.className}`, status: false });
        }
        const existing = await SchoolAttendance.findOne({ studentId: student._id, date }).select("status");
        if (existing && existing.status !== "absent") {
            return res.status(409).json({ message: "Attendance is already recorded for this student today", status: false });
        }
        const attendance = existing
            ? await SchoolAttendance.findOneAndUpdate(
                { studentId: student._id, date, status: "absent" },
                { $set: { className, status: "present", markedBy: req.teacher.id, method: "qr" } },
                { new: true, runValidators: true }
            )
            : await SchoolAttendance.create({
                studentId: student._id,
                className,
                date,
                status: "present",
                markedBy: req.teacher.id,
                method: "qr"
            });
        if (!attendance) {
            return res.status(409).json({ message: "Attendance is already recorded for this student today", status: false });
        }
        return res.status(201).json({
            message: "Attendance marked present",
            status: true,
            attendance: { ...attendance.toObject(), studentId: student }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Attendance is already recorded for this student today", status: false });
        }
        return res.status(500).json({ message: "Unable to mark QR attendance", status: false });
    }
};

export const saveSchoolAttendance = async (req, res) => {
    const body = req.body || {};
    const { records } = body;
    const className = parseClassName(body.className);
    const date = parseDate(body.date);
    if (!className || !date || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "Choose a class, date, and at least one attendance record", status: false });
    }
    if (isFutureDate(date)) return res.status(400).json({ message: "Future attendance cannot be recorded", status: false });

    const seen = new Set();
    for (const record of records) {
        if (!record || typeof record !== "object" || !mongoose.isValidObjectId(record.studentId) || !["present", "absent", "late"].includes(record.status)) {
            return res.status(400).json({ message: "Each record needs a valid student and present/absent/late status", status: false });
        }
        if (seen.has(String(record.studentId))) {
            return res.status(400).json({ message: "A student appears more than once", status: false });
        }
        seen.add(String(record.studentId));
    }

    try {
        const roster = await students.find({ _id: { $in: [...seen] }, className }).select("_id");
        if (roster.length !== seen.size) {
            return res.status(400).json({ message: "Every student must belong to the selected class", status: false });
        }
        const operations = records.map(({ studentId, status }) => ({
            updateOne: {
                filter: { studentId, date },
                update: { $set: { className, status, markedBy: req.teacher.id, method: "manual" } },
                upsert: true
            }
        }));
        await SchoolAttendance.bulkWrite(operations, { ordered: true });
        return res.json({ message: "School attendance saved", status: true, saved: records.length });
    } catch (error) {
        return res.status(500).json({ message: "Unable to save school attendance", status: false });
    }
};
