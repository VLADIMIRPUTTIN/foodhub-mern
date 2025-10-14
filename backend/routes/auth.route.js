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
	setPreferences,
	getPreferences,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { testResendConnection } from "../mailtrap/resend.config.js";

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
router.post("/set-preferences", verifyToken, setPreferences);
router.get("/get-preferences", verifyToken, getPreferences);

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
                   <p>Environment: ${process.env.NODE_ENV}</p>`,
        };

        const result = await transporter.sendMail(mailOptions);
        
        res.status(200).json({ 
            success: true, 
            message: "Test email sent successfully using Gmail", 
            result: {
                messageId: result.messageId,
                accepted: result.accepted,
                rejected: result.rejected
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to send test email with Gmail", 
            error: error.message 
        });
    }
});

export default router;
