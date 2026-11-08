import express from "express"
import authRouter from "./authAdmin.js";
import studentrouter from "./student.js";
import teacherRouter from "./teacher.js";


const router =express.Router();




router.use("/auth" ,authRouter);
router.use("/student" ,studentrouter);
router.use("/teacher", teacherRouter);

    


export default router;