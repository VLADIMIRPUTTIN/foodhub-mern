import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";

// Multer config for profile image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/profile-images/");
    },
    filename: function (req, file, cb) {
        cb(null, req.userId + "_" + Date.now() + path.extname(file.originalname));
    }
});
export const uploadProfileImage = multer({ storage });

export const getAllUsers = async (req, res) => {
    const users = await User.find();
    res.json({ users });
};

export const suspendUser = async (req, res) => {
    const { minutes } = req.body;
    const suspendedUntil = new Date(Date.now() + minutes * 60000);
    await User.findByIdAndUpdate(req.params.id, {
        status: "suspended",
        suspendedUntil
    });
    res.json({ success: true, message: `User suspended for ${minutes} minutes.` });
};

export const banUser = async (req, res) => {
    const { reason } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
        status: "banned",
        banReason: reason || "No reason provided"
    });
    res.json({ success: true, message: "User banned." });
};

export const activateUser = async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, {
        status: "active",
        suspendedUntil: null,
        banReason: null
    });
    res.json({ success: true, message: "User activated." });
};

export const deleteUser = async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted." });
};

// Update profile (bio and image)
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (typeof req.body.bio !== "undefined") user.bio = req.body.bio;
        if (req.body.profileImage) user.profileImage = req.body.profileImage; // base64 string

        await user.save();

        res.json({ success: true, user: { ...user._doc, password: undefined } });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};