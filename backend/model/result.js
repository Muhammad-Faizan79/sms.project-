
import mongoose from "mongoose";
// mongoose.Schema.Types.ObjectId,
//         ref: "Teacher",

// mongoose.Schema.Types.ObjectId,
//         ref: "students",
const resultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "students",
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
    },
    examType: {
        type: String,
        required: true
    },
    marksObtained: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        default: null
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Results = mongoose.model("Results", resultSchema);

export default Results