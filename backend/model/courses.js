
import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      uppercase: true
    },

    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true
    },

    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;
