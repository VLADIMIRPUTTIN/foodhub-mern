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

        // Generate verification token - 6 digits
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        // Check if this is the admin account
        let role = 'user';
        let isVerified = false;
        
        if (email === 'admin@foodhub.com') {
            role = 'admin';
            isVerified = true;
        }

        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: role,
            isVerified: isVerified,
            verificationToken: isVerified ? undefined : verificationToken,
            verificationTokenExpiresAt: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000,
        });

        await user.save();

        // Generate JWT token and set cookie
        generateTokenAndSetCookie(res, user._id);

        // Send verification email for regular users
        if (!isVerified) {
            await sendVerificationEmail(email, name, verificationToken);
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

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                success: false, 
                message: "Please verify your email before logging in.",
                requiresVerification: true,
                user: {
                    ...user._doc,
                    password: undefined
                }
            });
        }

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

        // Check if suspended and if suspension expired
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

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log("Error in checkAuth ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Update the googleLogin function to use verification with Resend

export const googleLogin = async (req, res) => {
    const { credential } = req.body;
    
    if (!credential) {
        return res.status(400).json({ 
            success: false, 
            message: "Google credential is required" 
        });
    }
    
    try {
        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: "209979773198-fl8bvitq2b48gfj6mhnomgiqr1tkbb0f.apps.googleusercontent.com",
        });
        
        const payload = ticket.getPayload();
        
        if (!payload) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid Google credential" 
            });
        }
        
        const { email, name, picture } = payload;
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (user) {
            // Existing user - check verification status
            if (!user.isVerified) {
                return res.status(200).json({
                    success: true,
                    message: "Please verify your email before logging in",
                    user: {
                        ...user._doc,
                        password: undefined
                    },
                    requiresVerification: true
                });
            }

            // Check if account is banned or suspended
            if (user.status === "banned") {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been banned",
                    statusData: {
                        status: 'banned',
                        message: "Your account has been permanently banned.",
                        banReason: user.banReason,
                        bannedAt: user.updatedAt
                    }
                });
            }
            
            if (user.status === "suspended" && user.suspendedUntil && user.suspendedUntil > new Date()) {
                const timeRemaining = Math.ceil((user.suspendedUntil - new Date()) / 60000);
                return res.status(403).json({
                    success: false,
                    message: "Your account is suspended",
                    statusData: {
                        status: 'suspended',
                        message: `Your account is temporarily suspended.`,
                        suspendedUntil: user.suspendedUntil,
                        timeRemaining
                    }
                });
            }

            // Update last login time
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Create new user - NOT VERIFIED
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcryptjs.hash(randomPassword, 10);
            
            // Generate verification token
            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            
            user = new User({
                email,
                password: hashedPassword,
                name,
                profileImage: picture,
                isVerified: false, // ← CHANGED: Google users also need verification
                verificationToken: verificationToken,
                verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            });
            
            await user.save();

            // Send verification email for Google signup users
            try {
                await sendVerificationEmail(email, name, verificationToken);
                console.log(`✅ Verification email sent to Google user: ${email}`);
            } catch (emailError) {
                console.error("❌ Failed to send verification email:", emailError);
                // Don't fail the signup if email fails
            }

            return res.status(200).json({
                success: true,
                message: "Account created with Google. Please verify your email address.",
                user: {
                    ...user._doc,
                    password: undefined
                },
                requiresVerification: true
            });
        }
        
        // Generate token and set cookie (only for verified users)
        generateTokenAndSetCookie(res, user._id);
        
        // Return user information
        return res.status(200).json({
            success: true,
            message: "Google login successful",
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error during Google login",
            error: error.message
        });
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
        await sendVerificationEmail(user.email, user.name, verificationToken);
        res.status(200).json({ success: true, message: "Verification code resent" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
