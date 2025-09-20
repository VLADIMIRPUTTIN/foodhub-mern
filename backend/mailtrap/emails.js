import { VERIFICATION_EMAIL_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE } from "./emailTemplates.js";
import { transporter, sender } from "./gmail.config.js"; // Use Gmail instead of Resend

export const sendVerificationEmail = async (email, name, verificationCode) => {
    try {
        console.log("Attempting to send verification email:");
        console.log("To:", email);
        console.log("From:", sender.email);
        console.log("Code:", verificationCode);
        console.log("Name:", name);

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

        // Use Gmail transporter instead of Resend
        const mailOptions = {
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Verify Your FoodHub Account",
            html: htmlContent,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully:", result);
        return result;
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

        const mailOptions = {
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Welcome to FoodHub!",
            html: `<p>Hello ${name},</p><p>Thank you for joining FoodHub! We're excited to have you on board.</p>`,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Welcome email sent:", result);
        return result;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        if (!email) {
            throw new Error("No email provided for password reset");
        }

        const mailOptions = {
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Reset Your FoodHub Password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent:", result);
        return result;
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw error;
    }
};

export const sendResetSuccessEmail = async (email) => {
    try {
        if (!email) {
            throw new Error("No email provided for reset success email");
        }

        const mailOptions = {
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        };

        const result = await transporter.sendMail(mailOptions);
        console.log("Reset success email sent:", result);
        return result;
    } catch (error) {
        console.error("Error sending reset success email:", error);
        throw error;
    }
};