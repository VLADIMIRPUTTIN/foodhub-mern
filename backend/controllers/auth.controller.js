import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "cloudinary";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";

const client = new OAuth2Client("209979773198-fl8bvitq2b48gfj6mhnomgiqr1tkbb0f.apps.googleusercontent.com");

export const signup = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        if (!email || !password || !name) {
            throw new Error("All fields are required");
        }

        const userAlreadyExists = await User.findOne({ email });
        console.log("userAlreadyExists", userAlreadyExists);

        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        // Generate verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Check if this is the admin account
        let role = 'user';
        let isVerified = false;
        
        if (email === 'admin@foodhub.com') {
            role = 'admin';
            isVerified = true; // Admin is auto-verified
        }

        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: role,
            isVerified: isVerified,
            verificationToken: isVerified ? undefined : verificationToken,
            verificationTokenExpiresAt: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        await user.save();

        // Generate JWT token and set cookie
        generateTokenAndSetCookie(res, user._id);

        console.log("User created:", user.email);
        console.log("Is verified:", user.isVerified);
        console.log("Verification token:", user.verificationToken);

        // Send verification email for regular users
        if (!isVerified) {
            console.log("🚀 STARTING VERIFICATION EMAIL PROCESS");
            console.log(`📧 User email: ${user.email}`);
            console.log(`🔑 Generated token: ${verificationToken}`);
            console.log(`⏰ Token expires at: ${new Date(user.verificationTokenExpiresAt)}`);
            
            try {
                await sendVerificationEmail(user.email, verificationToken, user.name, user.profileImage);
                console.log("✅ Verification email process completed");
            } catch (emailError) {
                console.error("❌ Verification email process failed:", emailError.message);
                console.error("📋 Full error:", emailError);
            }
        } else {
            // Send welcome email for admin
            try {
                await sendWelcomeEmail(user.email, user.name);
                console.log("✅ Welcome email sent successfully");
            } catch (emailError) {
                console.error("❌ Welcome email failed:", emailError.message);
            }
        }

        res.status(201).json({
            success: true,
            message: isVerified ? "Admin account created successfully" : "User created successfully. Please check your email to verify your account.",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Add a function to create admin manually
export const createAdmin = async (req, res) => {
    try {
        const adminExists = await User.findOne({ email: 'admin@foodhub.com' });
        
        if (adminExists) {
            return res.status(400).json({ success: false, message: "Admin already exists" });
        }

        const hashedPassword = await bcryptjs.hash('FoodHub@Admin2024!', 10);

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
};

export const verifyEmail = async (req, res) => {
    const { code } = req.body;
    
    console.log("🔍 VERIFY EMAIL REQUEST:");
    console.log(`📋 Received code: ${code}`);
    console.log(`📋 Code type: ${typeof code}`);
    console.log(`📋 Code length: ${code?.length}`);
    
    try {
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                message: "Verification code is required" 
            });
        }

        // Find user with this verification token
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }, // Token should not be expired
        });

        console.log("🔍 Database search result:");
        console.log(`📋 User found: ${user ? 'YES' : 'NO'}`);
        
        if (user) {
            console.log(`📋 User email: ${user.email}`);
            console.log(`📋 User verification token: ${user.verificationToken}`);
            console.log(`📋 Token expires at: ${new Date(user.verificationTokenExpiresAt)}`);
            console.log(`📋 Current time: ${new Date()}`);
            console.log(`📋 Is verified: ${user.isVerified}`);
        }

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code",
            });
        }

        // Update user as verified
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        console.log("✅ User verified successfully");

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.name);
            console.log("✅ Welcome email sent");
        } catch (emailError) {
            console.log("❌ Welcome email failed:", emailError.message);
            // Don't fail the verification if welcome email fails
        }

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("❌ Verify email error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error during verification",
            error: error.message 
        });
    }
};

// Helper function to check account status
const checkAccountStatus = async (user) => {
    console.log("🔍 Checking account status for:", user.email);
    console.log("📋 User status:", user.status);
    console.log("📋 Suspended until:", user.suspendedUntil);
    console.log("📋 Current time:", new Date());
    
    if (user.status === 'banned') {
        console.log("❌ User is banned");
        return {
            isBlocked: true,
            status: 'banned',
            message: 'Your account has been permanently banned.',
            bannedAt: user.bannedAt,
            banReason: user.banReason
        };
    }
    
    if (user.status === 'suspended') {
        const now = new Date();
        if (user.suspendedUntil && now < user.suspendedUntil) {
            const timeRemaining = Math.ceil((user.suspendedUntil - now) / (1000 * 60)); // minutes
            console.log("❌ User is suspended, time remaining:", timeRemaining, "minutes");
            return {
                isBlocked: true,
                status: 'suspended',
                message: 'Your account is temporarily suspended.',
                suspendedUntil: user.suspendedUntil,
                timeRemaining: timeRemaining,
                suspensionReason: user.suspensionReason
            };
        } else {
            // Suspension expired, reactivate user
            console.log("✅ Suspension expired, reactivating user");
            user.status = 'active';
            user.suspendedUntil = null;
            user.suspensionReason = null;
            await user.save(); // Add await here
        }
    }
    
    console.log("✅ User account status is clear");
    return { isBlocked: false };
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw new Error("All fields are required");
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Check account status - add await
        const statusCheck = await checkAccountStatus(user);
        if (statusCheck.isBlocked) {
            return res.status(403).json({ 
                success: false, 
                message: statusCheck.message,
                accountStatus: statusCheck
            });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    try {
        const user = await User.findOne({ email });

        // Always return success, even if user is not found
        if (!user) {
            return res.status(200).json({ success: true, message: "Password reset link sent to your email" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetTokenExpiresAt;

        await user.save();

        // send email
        console.log("CLIENT_URL:", process.env.CLIENT_URL);
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        // update password
        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({ success: true, message: "Password reset successful" });
    } catch (error) {
        console.log("Error in resetPassword ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Check account status - add await
        const statusCheck = await checkAccountStatus(user);
        if (statusCheck.isBlocked) {
            // Clear the cookie and return status
            res.clearCookie("token");
            return res.status(403).json({ 
                success: false, 
                message: statusCheck.message,
                accountStatus: statusCheck
            });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log("Error in checkAuth ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const googleLogin = async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: "209979773198-fl8bvitq2b48gfj6mhnomgiqr1tkbb0f.apps.googleusercontent.com",
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (user) {
            // Check account status for existing user - add await
            const statusCheck = await checkAccountStatus(user);
            if (statusCheck.isBlocked) {
                return res.status(403).json({ 
                    success: false, 
                    message: statusCheck.message,
                    accountStatus: statusCheck
                });
            }
        } else {
            // Create new user
            user = new User({
                email,
                name,
                profileImage: picture,
                isVerified: true,
                role: 'user',
                status: 'active'
            });
            await user.save();
        }

        // Generate token and set cookie
        generateTokenAndSetCookie(res, user._id);

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.error("Google login error:", error);
        res.status(400).json({ success: false, message: "Google authentication failed" });
    }
};

export const resendVerification = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Email already verified" });
        }
        // Generate new code and expiry
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();
        await sendVerificationEmail(user.email, verificationToken, user.name, user.profileImage);
        res.status(200).json({ success: true, message: "Verification code resent" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
