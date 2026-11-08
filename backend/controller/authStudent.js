import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import students from "../model/student.js";
import Results from "../model/result.js";
import Attendance from "../model/attendance.js";
import { get } from "mongoose";




export const createStudent =async (req , res)=>{
    try {
        const {name , email , phone, password, className , rollNo ,group} =req.body;
        if(!name , !email , !password , !phone ,!className ,!rollNo , !group){
           return res.json({
                message:"required filled or messing",
                status:false
            });
        };
        const obj={
            email
        }

        const student = await students.findOne(obj);
        if(student){
            return res.json({
                message:"student alrady created !",
                status:false
            });
        };
        const hash=await bcrypt.hash(password , 10)
        if(!hash){
            return res.json({
                message:"Server error",
                status:false
            });
        };
        const studentobj ={
            name ,
            email,
            phone,
            password:hash,
            className:className,
            group,
            rollNo
        }
        students.create(studentobj)
        res.json({
            message:"student created succefully!",
            status:true
        });


         
    } catch (error) {
        res.json({
            message:"server down please try again !",
            status:false,
            error:error.message
        });
    };
}




export const studentlogin = async (req ,res)=>{
    try {
        const {name , email , password} =req.body;
        if(!name, !email, !password){
            return res.json({
                message:"required filed or messing",
                status:false
            });
        };

        const student = await students.findOne({email});

        if(!student){
            return res.json({
                message:"email or password is encorected!",
                status:false
            });
        };

        const compaire = await bcrypt.compare(password, student.password);
        if(!compaire){
            return res.json({
                message:"email or password is encorected!",
                status:false
            });
        };
        const studentToken = await jwt.sign({
            studentId:student._id,
            email:student.email,
            role:student.role
        },process.env.studentsgret);

        res.cookie("studentToken" ,studentToken ,{
            httpOnly:true,
            secure:true,
            sameSite:"lax"
        }) ;

        res.json({
            message:"student login successfully!",
            status:true
        });

    } catch (error) {
        res.json({
            message:"server down try again later!",
            status:false,
            error:error.message
        })
    }
}


export const logoutStudent =async (req , res)=>{
    try {
        res.clearCookie("studentToken",{
            httpOnly:true,
            secure:true,
            sameSite:"lax"
        });

        res.json({
            message:"logout successfully",
            status:true
        })
    } catch (error) {
        res.json({
            message:"server down",
            status:false
        })
    }
}


export const verifyStd = (req , res)=>{
    try {
        res.json({
            message:"wellcome to Dashboard",
            status:true,
            user:req.user
        });
    } catch (error) {
     res.json({
        message:"server down",
        status:false,
        error:error.message
     })
     
        
    }
}

export const getStudents = async (req, res) => {
    try {
        const { id } = req.query;

        // Get single student by ID
        if (id) {
            const student = await students.findById(id).select("-password");

            if (!student) {
                return res.status(404).json({
                    message: "Student not found",
                    status: false,
                    students: null
                });
            }

            return res.status(200).json({
                message: "Get student successfully",
                status: true,
                students: student
            });
        }

        // Get all students
        const getstudents = await students.find({}).select("-password");

        return res.status(200).json({
            message: "Get all students successfully",
            status: true,
            count: getstudents.length,
            students: getstudents
        });

    } catch (error) {
        return res.status(500).json({
            message: "Cannot get students",
            status: false,
            students: null,
            error: error.message
        });
    }
};
export const getAllresults = async (req, res) => {
    try {
        const { id } = req.query;

        // Agar query params mein ID hai
        if (id) {
            const result = await Results.findById(id);

            if (!result) {
                return res.status(404).json({
                    message: "Result not found",
                    status: false,
                    data: null
                });
            }

            return res.status(200).json({
                message: "Get single result successfully",
                status: true,
                count: 1,
                data: result
            });
        }

        // Agar ID nahi hai to saare results
        const results = await Results.find({});

        return res.status(200).json({
            message: "Get all results successfully",
            status: true,
            count: results.length,
            data: results
        });

    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch results",
            status: false,
            error: error.message,
            data: null
        });
    }
};


export const setresutl =async(req , res)=>{
    try {
        const {studentId ,subject ,examType ,marksObtained,totalMarks ,teacherId,} =req.body

console.log("hello word")
        const obj={studentId,
            subject ,
            examType ,
            marksObtained,
            totalMarks ,
            teacherId,
        }

        await Results.create(obj)
        console.log("helo created")
        res.json({
            message:"hlelo created"
        })
    } catch (error) {
        // console.log("error",error)
        res.json({
            message:"eroro",
            error:error.message
        })
    }
}

export const markAttendance = async (req, res) => {
    try {
        const { studentId, status, date } = req.body;

        if (!studentId || !status) {
            return res.status(400).json({
                message: "studentId and status are required",
                status: false
            });
        }

        if (!["present", "absent", "late"].includes(status)) {
            return res.status(400).json({
                message: "status must be present, absent, or late",
                status: false
            });
        }

        const attendanceDate = date ? new Date(`${date}T00:00:00.000Z`) : new Date();
        if (Number.isNaN(attendanceDate.getTime()) || (date && attendanceDate.toISOString().slice(0, 10) !== date)) {
            return res.status(400).json({
                message: "date must be a valid YYYY-MM-DD date",
                status: false
            });
        }
        attendanceDate.setUTCHours(0, 0, 0, 0);

        const student = await students.findById(studentId).select("_id");
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                status: false
            });
        }

        const attendance = await Attendance.findOneAndUpdate(
            { studentId, date: attendanceDate },
            { $set: { status } },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            message: "Attendance saved successfully",
            status: true,
            attendance
        });
    } catch (error) {
        return res.status(400).json({
            message: "Unable to save attendance",
            status: false,
            error: error.message
        });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { studentId, date } = req.query;
        const filter = {};

        if (studentId) filter.studentId = studentId;
        if (date) {
            const attendanceDate = new Date(`${date}T00:00:00.000Z`);
            if (Number.isNaN(attendanceDate.getTime()) || attendanceDate.toISOString().slice(0, 10) !== date) {
                return res.status(400).json({
                    message: "date must be a valid YYYY-MM-DD date",
                    status: false
                });
            }
            filter.date = attendanceDate;
        }

        const attendance = await Attendance.find(filter)
            .populate("studentId", "name className rollNo")
            .sort({ date: -1 });

        return res.status(200).json({
            message: "Attendance fetched successfully",
            status: true,
            count: attendance.length,
            attendance
        });
    } catch (error) {
        return res.status(500).json({
            message: "Unable to fetch attendance",
            status: false,
            error: error.message
        });
    }
};