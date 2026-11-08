import mongoose from "mongoose";

const schoolAttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "students",
        required: true
    },
    className: {
        type: String,
        required: true,
        enum: Array.from({ length: 10 }, (_value, index) => String(index + 1))
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["present", "absent", "late"],
        required: true
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null
    },
    method: {
        type: String,
        enum: ["qr", "manual"],
        required: true
    }
}, { timestamps: true });

schoolAttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
schoolAttendanceSchema.index({ className: 1, date: 1 });

const SchoolAttendance = mongoose.model("SchoolAttendance", schoolAttendanceSchema);

export default SchoolAttendance;
