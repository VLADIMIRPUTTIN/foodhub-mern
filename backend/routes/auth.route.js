import express from "express";
import {
	login,
	logout,
	signup,
	verifyEmail,
	forgotPassword,
	resetPassword,
	checkAuth,
	createAdmin, // <-- import mo ito
	googleLogin,
	resendVerification,
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

// ADD THIS ROUTE for admin creation
router.post("/create-admin", createAdmin);
router.post("/google-login", googleLogin);
router.post("/resend-verification", resendVerification);

// Add this new route
router.get("/test-email", async (req, res) => {
    try {
        const result = await testResendConnection();
        res.status(200).json({ 
            success: true, 
            message: "Test email sent successfully", 
            result 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to send test email", 
            error: error.message 
        });
    }
});

router.get("/debug-session", (req, res) => {
    try {
        res.json({
            cookies: req.cookies,
            hasToken: !!req.cookies.token,
            environment: process.env.NODE_ENV,
            clientUrl: process.env.CLIENT_URL,
            serverDomain: req.get('host')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
