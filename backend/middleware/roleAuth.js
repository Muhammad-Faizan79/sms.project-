import jwt from "jsonwebtoken";

function authorizeCookie(cookieName, secretName, role, requestProperty) {
    return (req, res, next) => {
        const token = req.cookies?.[cookieName];
        if (!token) {
            console.log("Token not found in cookies");
            return res.status(401).json({ message: "Authentication required", status: false });
        }

        try {
            const secret = process.env[secretName] || (role === "teacher" ? process.env.adminSgret : undefined);
            const decoded = jwt.verify(token, secret);
            if (decoded.role !== role) {
                return res.status(403).json({ message: "Access denied", status: false });
            }
            req[requestProperty] = decoded;
            return next();
        } catch {
            console.log("Invalid token");
            return res.status(401).json({ message: "Session expired. Please log in again", status: false });
        }
    };
}

export const requireAdmin = authorizeCookie("tokenAdmin", "adminSgret", "admin", "admin");
export const requireTeacher = authorizeCookie("teacherToken", "teacherSgret", "teacher", "teacher");