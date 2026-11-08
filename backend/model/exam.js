import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    examType: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true }
}, { timestamps: true });

const Exam = mongoose.model("Exam", examSchema);

export default Exam;