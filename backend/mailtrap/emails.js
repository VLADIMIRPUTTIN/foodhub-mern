import { VERIFICATION_EMAIL_TEMPLATE } from "./emailTemplates.js";
import { sender, resend } from "./resend.config.js";

export const sendVerificationEmail = async (email, name, verificationCode) => {
    try {
        console.log("Attempting to send verification email:");
        console.log("To:", email);
        console.log("From:", sender.email);
        console.log("Code:", verificationCode);

        if (!email) {
            throw new Error("No email provided for verification");
        }

        const profileImageSection = `<div style="width: 100%; height: 100%; background-color: #CF996C; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px; font-weight: bold; color: white;">${name.charAt(0).toUpperCase()}</span>
        </div>`;

        const htmlContent = VERIFICATION_EMAIL_TEMPLATE
            .replace(/{userName}/g, name)
            .replace(/{verificationCode}/g, verificationCode)
            .replace(/{profileImageSection}/g, profileImageSection);

        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Verify Your FoodHub Account",
            html: htmlContent,
        });

        console.log("Verification email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try {
        if (!email) {
            throw new Error("No email provided for welcome email");
        }

        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Welcome to FoodHub!",
            html: `<p>Hello ${name},</p><p>Thank you for joining FoodHub! We're excited to have you on board.</p>`,
        });

        console.log("Welcome email sent:", data);
        return data;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
    try {
        if (!email) {
            throw new Error("No email provided for password reset");
        }

        const resetUrl = `${process.env.CLIENT_URL || 'https://www.foodhubrecipe.shop'}/reset-password/${resetToken}`;
        
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Reset Your FoodHub Password",
            html: `<p>Hello ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
        });

        console.log("Password reset email sent:", data);
        return data;
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

export const sendResetSuccessEmail = async (email, name) => {
    try {
        if (!email) {
            throw new Error("No email provided for reset success email");
        }

        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Password Reset Successful",
            html: `<p>Hello ${name},</p><p>Your password has been successfully reset. If you did not make this change, please contact our support team immediately.</p>`,
        });

        console.log("Reset success email sent:", data);
        return data;
    } catch (error) {
        console.error("Error sending reset success email:", error);
        throw error;
    }
};