import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";
import cloudinary from '../utils/cloudinary.js';

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
        const userId = req.userId; // from verifyToken middleware
        const { bio, profileImage } = req.body;

        const updateData = {};

        if (bio !== undefined) {
            updateData.bio = bio;
        }

        // ✅ Upload to Cloudinary if base64 image is provided
        if (profileImage && profileImage.startsWith('data:image')) {
            try {
                console.log("📸 Uploading profile image to Cloudinary...");
                
                const uploadResponse = await cloudinary.uploader.upload(profileImage, {
                    folder: 'foodhub/profiles',
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ],
                    public_id: `user_${userId}_profile`,
                    overwrite: true, // ✅ Replace old profile pic
                });

                console.log("✅ Cloudinary upload success:", uploadResponse.secure_url);
                updateData.profileImage = uploadResponse.secure_url;

            } catch (uploadError) {
                console.error("❌ Cloudinary upload error:", uploadError);
                return res.status(500).json({ 
                    success: false, 
                    message: "Failed to upload profile image" 
                });
            }
        }

        // ✅ Update user in DB
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Add new function for updating preferences
export const updatePreferences = async (req, res) => {
    try {
        const { dietaryPreferences, allergies, preferredCuisines, hasCompletedOnboarding } = req.body;
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Update preferences
        user.dietaryPreferences = dietaryPreferences || [];
        user.allergies = allergies || [];
        user.preferredCuisines = preferredCuisines || [];
        user.hasCompletedOnboarding = hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : user.hasCompletedOnboarding;

        await user.save();

        res.json({ 
            success: true, 
            message: "Preferences updated successfully",
            user: { ...user._doc, password: undefined } 
        });
    } catch (error) {
        console.error('updatePreferences error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};