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

// Update the test route to use Gmail
router.get("/test-email", async (req, res) => {
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
            message: "Failed to send test email", 
            error: error.message 
        });
    }
});

export default router;
