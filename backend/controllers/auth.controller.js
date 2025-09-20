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
                // FIX: Correct parameter order - email, name, verificationCode
                await sendVerificationEmail(user.email, user.name, verificationToken);
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

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
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

        const loginMessage = user.role === 'admin' 
            ? "Admin logged in successfully" 
            : "Logged in successfully";

        res.status(200).json({
            success: true,
            message: loginMessage,
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
    // Clear the cookie with the same settings used when creating it
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    });
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
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check account status
        if (user.status === "banned") {
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

        if (user.status === "suspended") {
            if (user.suspendedUntil && user.suspendedUntil > new Date()) {
                const timeRemaining = Math.ceil((user.suspendedUntil - new Date()) / 60000);
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
                user.status = "active";
                user.suspendedUntil = null;
                await user.save();
            }
        }

        res.status(200).json({ 
            success: true, 
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.log("Error in checkAuth ", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Update the googleLogin function to use verification with Resend

export const googleLogin = async (req, res) => {
    const { credential } = req.body;
    try {
        console.log("Google login attempt received");
        
        if (!credential) {
            return res.status(400).json({ 
                success: false, 
                message: "No Google credential provided" 
            });
        }
        
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: "209979773198-fl8bvitq2b48gfj6mhnomgiqr1tkbb0f.apps.googleusercontent.com"
        });
        
        const payload = ticket.getPayload();
        console.log("Google auth successful for email:", payload.email);
        
        // Extract profile image from Google payload
        const googleProfileImage = payload.picture;

        // Check if user exists
        let user = await User.findOne({ email: payload.email });
        console.log("User exists in database:", !!user);
        
        if (user) {
            console.log("Existing user - Role:", user.role, "Verification status:", user.isVerified);
            
            // Update profile image if not set
            if (!user.profileImage && googleProfileImage) {
                user.profileImage = googleProfileImage;
                await user.save();
                console.log("Updated existing user with Google profile image");
            }
            
            // Check account status
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

            if (user.status === "suspended") {
                if (user.suspendedUntil && user.suspendedUntil > new Date()) {
                    const timeRemaining = Math.ceil((user.suspendedUntil - new Date()) / 60000);
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
                    user.status = "active";
                    user.suspendedUntil = null;
                    await user.save();
                }
            }

            // Handle unverified existing user (except admin)
            if (!user.isVerified && user.role !== 'admin') {
                // Generate new verification code for existing unverified user
                const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationToken = verificationToken;
                user.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
                await user.save();
                
                // Send verification email
                await sendVerificationEmail(user.email, user.name, verificationToken);
                
                // Generate token for the session
                generateTokenAndSetCookie(res, user._id);
                
                return res.status(200).json({
                    success: true,
                    message: "Please verify your email to continue. A verification code has been sent.",
                    user: {
                        ...user._doc,
                        password: undefined
                    }
                });
            }
            
            // User is verified or is admin - complete login
            user.lastLogin = new Date();
            await user.save();
            
            // Generate token and return user
            generateTokenAndSetCookie(res, user._id);
            
            const loginMessage = user.role === 'admin' 
                ? "Admin logged in successfully with Google" 
                : "Logged in successfully with Google";
            
            return res.status(200).json({
                success: true,
                message: loginMessage,
                user: {
                    ...user._doc,
                    password: undefined
                }
            });
        } else {
            // Create new user with Google data
            console.log("Creating new user with Google data");
            
            // Check if this should be an admin account
            let role = 'user';
            let isVerified = false;
            
            // If the email is admin@foodhub.com, make it admin
            if (payload.email === 'admin@foodhub.com') {
                role = 'admin';
                isVerified = true;
            }
            
            const verificationToken = !isVerified ? Math.floor(100000 + Math.random() * 900000).toString() : undefined;
            
            // Create a random password for Google users
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcryptjs.hash(randomPassword, 10);
            
            user = new User({
                email: payload.email,
                password: hashedPassword,
                name: payload.name,
                role: role,
                verificationToken: verificationToken,
                verificationTokenExpiresAt: !isVerified ? Date.now() + 15 * 60 * 1000 : undefined,
                isVerified: isVerified,
                profileImage: googleProfileImage
            });
            
            await user.save();
            console.log("New Google user created:", user.email, "Role:", user.role);
            
            // Send verification email only if not admin
            if (!isVerified) {
                await sendVerificationEmail(user.email, user.name, verificationToken);
            }
            
            // Generate token
            generateTokenAndSetCookie(res, user._id);
            
            const successMessage = role === 'admin' 
                ? "Admin account created and logged in successfully with Google"
                : "Account created with Google. Please verify your email to continue.";
            
            return res.status(201).json({
                success: true,
                message: successMessage,
                user: {
                    ...user._doc,
                    password: undefined
                }
            });
        }
    } catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error logging in with Google: " + error.message 
        });
    }
};

export const resendVerification = async (req, res) => {
    const { email } = req.body;
    
    console.log("Resend verification request for email:", email);
    
    try {
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is required for resending verification code" 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        if (user.isVerified) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is already verified" 
            });
        }

        // Generate new verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationCode;
        user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        
        await user.save();

        // Send verification email
        await sendVerificationEmail(user.email, user.name, verificationCode);

        res.status(200).json({
            success: true,
            message: "Verification code sent successfully",
        });
    } catch (error) {
        console.error("Error in resendVerification:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};
