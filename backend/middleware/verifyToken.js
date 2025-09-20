import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Add rate limiting for no-token logs
let lastNoTokenLog = 0;
const LOG_INTERVAL = 5000; // 5 seconds

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        // Rate limit logging to prevent spam
        const now = Date.now();
        if (now - lastNoTokenLog > LOG_INTERVAL) {
            console.log("No token provided");
            lastNoTokenLog = now;
        }
        return res.status(401).json({ 
            success: false, 
            message: "Unauthorized - no token provided" 
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            console.log("Invalid token");
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized - invalid token" 
            });
        }

        // Get user and check status
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log("User not found:", decoded.userId);
            // Clear the invalid cookie
            res.clearCookie("token");
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check if banned
        if (user.status === "banned") {
            console.log("User is banned:", user._id);
            // Clear cookie for banned user
            res.clearCookie("token");
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
                console.log("User is suspended:", user._id, "for", timeRemaining, "minutes");
                // Clear cookie for suspended user
                res.clearCookie("token");
                return res.status(403).json({ 
                    success: false, 
                    message: `Your account is suspended for ${timeRemaining} more minute(s).`,
                    statusData: {
                        status: 'suspended',
                        message: `Your account is temporarily suspended.`,
                        timeRemaining: timeRemaining,
                        suspendedUntil: user.suspendedUntil
                    }
                });
            } else {
                // Suspension expired, reactivate
                console.log("Suspension expired, reactivating user:", user._id);
                user.status = "active";
                user.suspendedUntil = null;
                await user.save();
            }
        }

        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        console.log("Error in verifyToken:", error);
        
        // Clear invalid cookie
        res.clearCookie("token");
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: "Token expired" 
            });
        }
        
        return res.status(401).json({ 
            success: false, 
            message: "Invalid token" 
        });
    }
};
