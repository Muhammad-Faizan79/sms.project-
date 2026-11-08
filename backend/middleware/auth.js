import jwt from "jsonwebtoken";

export const middleware =async (req , res, next)=>{
    try {
        const token= req.cookies.tokenAdmin;

        if(!token){
        return res.json({
                message:"invalid user",
                status:false
            })
        }
        const decodeToken = jwt.verify(
            token,
            process.env.adminSgret
        )
        // console.log("decode",decodeToken)
        req.admin= decodeToken
        next()
    } catch (error) {
        console.log("error",error)
        res.json({
            error:error.message,
            status:false
        })
        console.log(error)
    }
}