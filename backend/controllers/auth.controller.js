import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "cloudinary";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/emails.js";
import { User } from "../models/user.model.js";

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
            isVerified = true;
        }

        const user = new User({
            email,
            password: hashedPassword,
            name,
            role: role,
            isVerified: isVerified,
            hasCompletedOnboarding: false, // Explicitly set to false for new users
            verificationToken: isVerified ? undefined : verificationToken,
            verificationTokenExpiresAt: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000,
        });

        await user.save();

        // Generate JWT token and set cookie
        generateTokenAndSetCookie(res, user._id);

        // Send verification email for non-admin users
        if (!isVerified) {
            await sendVerificationEmail(user.email, verificationToken, user.name);
        }

        res.status(201).json({
            success: true,
            message: isVerified ? "Admin account created successfully" : "User created successfully. Please verify your email.",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
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

        // If user is not verified, send a fresh verification code and redirect them
        if (!user.isVerified && user.role !== 'admin') {
            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationToken = verificationToken;
            user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
            await user.save();

            generateTokenAndSetCookie(res, user._id);

            // Fire-and-forget so response is instant
            sendVerificationEmail(user.email, verificationToken, user.name, user.profileImage)
                .catch(err => console.error('Failed to send verification email on login:', err));

            return res.status(200).json({
                success: true,
                message: "Please verify your email to continue. A verification code has been sent.",
                needsVerification: true,
                user: {
                    ...user._doc,
                    password: undefined,
                },
            });
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
    try {
        console.log("Logout request received");
        
        // Clear cookie with multiple configurations to ensure removal
        const cookieConfigs = [
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                path: "/",
                domain: process.env.NODE_ENV === "production" ? ".foodhubrecipes.site" : undefined
            },
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                path: "/"
            },
            // Fallback for development
            {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/"
            }
        ];

        // Clear with all configurations
        cookieConfigs.forEach(config => {
            res.clearCookie("token", config);
        });

        // Set response headers to prevent caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        console.log("Logout successful, cookies cleared");

        res.status(200).json({ 
            success: true, 
            message: "Logged out successfully",
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error during logout" 
        });
    }
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
        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`, user.name, user.profileImage);

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

        await sendResetSuccessEmail(user.email, user.name, user.profileImage);

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
    try {
        const { credential } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID environment variable is not set');
            return res.status(500).json({ success: false, message: 'Google login is not configured on the server.' });
        }

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;
        
        let user = await User.findOne({ email });
        
        if (!user) {
            // New Google user - requires email verification
            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

            user = new User({
                email,
                name,
                googleId,
                isVerified: false,
                profileImage: picture || null,
                authProvider: 'google',
                verificationToken,
                verificationTokenExpiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
            });
            await user.save();

            // Set cookie and respond immediately — send email in background so the
            // client doesn't have to wait for Resend/Gmail before being redirected.
            generateTokenAndSetCookie(res, user._id);

            // Fire-and-forget: don't await so response is instant
            sendVerificationEmail(user.email, verificationToken, user.name, user.profileImage)
                .catch(emailErr => console.error('Failed to send verification email to new Google user:', emailErr));

            return res.status(200).json({
                success: true,
                message: "Please verify your email to continue. A verification code has been sent.",
                needsVerification: true,
                user: {
                    ...user._doc,
                    password: undefined
                }
            });
        } else {
            let updated = false;
            
            // ✅ Update Google picture if user has no profile image yet
            if (!user.profileImage && picture) {
                user.profileImage = picture;
                updated = true;
            }
            
            // ✅ Always sync Google profile picture for Google users
            if (picture && user.authProvider === 'google' && user.profileImage !== picture) {
                user.profileImage = picture;
                updated = true;
            }
            
            if (!user.googleId && googleId) {
                user.googleId = googleId;
                updated = true;
            }
            
            if (updated) await user.save();
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
            user.verificationTokenExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
            await user.save();

            // Set cookie and respond immediately — send email in background
            generateTokenAndSetCookie(res, user._id);

            // Fire-and-forget: don't await so response is instant
            sendVerificationEmail(user.email, verificationToken, user.name, user.profileImage)
                .catch(emailErr => console.error('Failed to send verification email:', emailErr));

            return res.status(200).json({
                success: true,
                message: "Please verify your email to continue. A verification code has been sent.",
                needsVerification: true,
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
            },
            // Add flag to indicate if user needs onboarding
            needsOnboarding: !user.hasCompletedOnboarding && user.role !== 'admin'
        });
    } catch (error) {
        console.error("Google login error:", error.message || error);
        res.status(500).json({ success: false, message: "Google login failed", detail: error.message });
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
        await sendVerificationEmail(user.email, verificationCode, user.name, user.profileImage);

        res.status(200).json({
            success: true,
            message: "Verification code sent successfully",
        });
    } catch (error) {
        console.error("Error in resendVerification:", error);
        res.status(500).json({ 
            success: false, 
            message: process.env.NODE_ENV !== 'production' ? error.message : "Server error" 
        });
    }
};

export const setPreferences = async (req, res) => {
    try {
        const { preferences } = req.body;
        const userId = req.userId;

        const user = await User.findByIdAndUpdate(
            userId,
            { 
                preferences: {
                    ...preferences,
                    isPreferencesSet: true
                }
            },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.status(200).json({
            success: true,
            message: "Preferences saved successfully",
            user
        });
    } catch (error) {
        console.error("Set preferences error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

export const getPreferences = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("preferences");
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.status(200).json({
            success: true,
            preferences: user.preferences
        });
    } catch (error) {
        console.error("Get preferences error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};
