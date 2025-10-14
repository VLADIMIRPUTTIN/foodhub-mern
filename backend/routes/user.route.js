import express from "express";
import { suspendUser, banUser, activateUser, getAllUsers, deleteUser, updateProfile, updatePreferences } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getAllUsers);
router.patch("/:id/suspend", verifyToken, suspendUser);
router.patch("/:id/ban", verifyToken, banUser);
router.patch("/:id/activate", verifyToken, activateUser);
router.delete("/:id", verifyToken, deleteUser);
router.put("/profile", verifyToken, updateProfile);
router.put("/preferences", verifyToken, updatePreferences); // Add this line

export default router;