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

export default router;
