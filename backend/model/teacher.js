import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
    teacherCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    subject: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    role: { type: String, default: "teacher", immutable: true }
}, {
    timestamps: true,
    toJSON: {
        transform(_document, record) {
            delete record.password;
            return record;
        }
    }
});

const Teacher = mongoose.model("Teacher", teacherSchema);

export default Teacher;