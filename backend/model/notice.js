import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, enum: ["admin", "teacher"], required: true }
}, { timestamps: true });

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;