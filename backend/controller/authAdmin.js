import User from "../model/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    // maxAge: 24 * 60 * 60 * 1000
};

function setAdminCookie(res, user) {
    const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email, role: "admin" },
        process.env.adminSgret,
        // { expiresIn: "1d" }
    );
    res.cookie("tokenAdmin", token, cookieOptions);
}

export const signupAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
            return res.status(400).json({ message: "Name, email, and a password of at least 8 characters are required", status: false });
        }
        if (await User.exists({})) {
            return res.status(403).json({ message: "Admin setup is already complete", status: false });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: await bcrypt.hash(password, 12),
            role: "admin"
        });
        setAdminCookie(res, user);
        return res.status(201).json({ message: "Admin account created", status: true, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        return res.status(500).json({ message: "Unable to create admin account", status: false, error: error.message });
    }
};

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email?.trim() || !password) {
            return res.status(400).json({ message: "Email and password are required", status: false });
        }
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password", status: false });
        }
        setAdminCookie(res, user);
        return res.status(200).json({ message: "Admin login successful", status: true, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        return res.status(500).json({ message: "Unable to log in", status: false, error: error.message });
    }
};

export const logoutAdmin = (req, res) => {
    res.clearCookie("tokenAdmin", { ...cookieOptions, maxAge: undefined });
    return res.status(200).json({ message: "Logged out", status: true });
};

export const verifyMe = (req, res) => {
    return res.status(200).json({
        message: "Authenticated",
        status: true,
        user: { id: req.admin.id, name: req.admin.name, email: req.admin.email, role: "admin" }
    });
};

export const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: "Current password and a new password of at least 8 characters are required", status: false });
        }
        const user = await User.findById(req.admin.id).select("+password");
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: "Current password is incorrect", status: false });
        }
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        return res.status(200).json({ message: "Password updated", status: true });
    } catch (error) {
        return res.status(500).json({ message: "Unable to update password", status: false, error: error.message });
    }
};
