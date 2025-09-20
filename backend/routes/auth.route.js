import express from "express";
import {
	login,
	logout,
	signup,
	verifyEmail,
	forgotPassword,
	resetPassword,
	checkAuth,
	createAdmin,
	googleLogin,
	resendVerification,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { testResendConnection } from "../mailtrap/resend.config.js";
import { User } from "../models/user.model.js"; // ✅ Fixed import
import bcryptjs from "bcryptjs";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.post("/create-admin", createAdmin);
router.post("/google-login", googleLogin);
router.post("/resend-verification", resendVerification);

// Test route for Resend
router.get("/test-resend", async (req, res) => {
    try {
        const result = await testResendConnection();
        res.status(200).json({ 
            success: true, 
            message: "Test email sent successfully using Resend", 
            result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to send test email with Resend", 
            error: error.message 
        });
    }
});

// Keep Gmail test route for comparison
router.get("/test-gmail", async (req, res) => {
    try {
        const { transporter, sender } = await import("../mailtrap/gmail.config.js");
        
        const mailOptions = {
            from: `${sender.name} <${sender.email}>`,
            to: "yakabukosama@gmail.com",
            subject: "Test Email from FoodHub - Gmail",
            html: `<p>This is a test email from Gmail configuration.</p>
                   <p>Sender: ${sender.email}</p>
                   <p>Environment: ${process.env.NODE_ENV}</p>`
        };

        const result = await transporter.sendMail(mailOptions);
        res.status(200).json({ 
            success: true, 
            message: "Test email sent successfully using Gmail", 
            result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to send test email with Gmail", 
            error: error.message 
        });
    }
});

// Add this route for easy admin creation during development
router.post("/create-admin-dev", async (req, res) => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@foodhub.com' });
        
        if (adminExists) {
            return res.status(200).json({ 
                success: true, 
                message: "Admin already exists",
                admin: {
                    email: adminExists.email,
                    name: adminExists.name,
                    role: adminExists.role
                }
            });
        }

        const hashedPassword = await bcryptjs.hash('admin123', 10);

        const admin = new User({
            email: 'admin@foodhub.com',
            password: hashedPassword,
            name: 'FoodHub Administrator',
            role: 'admin',
            isVerified: true,
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            admin: {
                ...admin._doc,
                password: undefined,
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;
