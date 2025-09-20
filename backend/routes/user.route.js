import express from "express";
import { suspendUser, banUser, activateUser, getAllUsers, deleteUser, updateProfile } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js"; // Create this middleware

const router = express.Router();

// Add admin verification middleware
const verifyAdminMiddleware = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Access denied. Admin privileges required." 
        });
    }
    next();
};

router.get("/", verifyToken, verifyAdminMiddleware, getAllUsers);
router.patch("/:id/suspend", verifyToken, verifyAdminMiddleware, suspendUser);
router.patch("/:id/ban", verifyToken, verifyAdminMiddleware, banUser);
router.patch("/:id/activate", verifyToken, verifyAdminMiddleware, activateUser);
router.delete("/:id", verifyToken, verifyAdminMiddleware, deleteUser);
router.put("/profile", verifyToken, updateProfile);

export default router;