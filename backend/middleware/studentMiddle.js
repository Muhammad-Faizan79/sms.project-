import jwt from "jsonwebtoken"


export const studentMIddlewate =async(req, res , next)=>{
    const token = req.cookies?.studentToken;
    if(!token){
        return res.status(401).json({
            message:"UnAuthuser",
            status:false
        });
    };
    try {
      const verify = jwt.verify(token ,process.env.studentsgret)
            if (verify.role !== "student") {
                return res.status(403).json({ message: "Access denied", status: false });
            }

            req.student = verify;
            req.user = verify;
    return next()
      
    } catch (error) {
        return res.status(401).json({
            message:"server down",
            status:false,
            error:error.message
        });
    };
}