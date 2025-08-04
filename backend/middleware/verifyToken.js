import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized - no token provided" });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized - invalid token" });

        // Get user and check status
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ success: false, message: "User not found" });

        // Check if banned
        if (user.status === "banned") {
            return res.status(403).json({ 
                success: false, 
                message: "Your account has been banned.",
                statusData: {
                    status: 'banned',
                    message: "Your account has been permanently banned from accessing FoodHub.",
                    banReason: user.banReason,
                    bannedAt: user.updatedAt
                }
            });
        }

        // Check if suspended
        if (user.status === "suspended") {
            if (user.suspendedUntil && user.suspendedUntil > new Date()) {
                const timeRemaining = Math.ceil((user.suspendedUntil - new Date()) / 60000);
                return res.status(403).json({ 
                    success: false, 
                    message: `Your account is suspended for ${timeRemaining} more minute(s).`,
                    statusData: {
                        status: 'suspended',
                        message: `Your account is temporarily suspended from accessing FoodHub.`,
                        timeRemaining: timeRemaining,
                        suspendedUntil: user.suspendedUntil,
                        suspensionReason: "Account suspended by administrator"
                    }
                });
            } else {
                // Suspension expired, reactivate
                user.status = "active";
                user.suspendedUntil = null;
                await user.save();
            }
        }

        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in verifyToken ", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
