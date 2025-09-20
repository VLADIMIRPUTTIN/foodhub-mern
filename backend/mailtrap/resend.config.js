import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

// Create Resend instance with API key from environment
export const resend = new Resend(process.env.RESEND_API_KEY);

// Use your verified domain for the sender email
export const sender = {
    // Use onboarding@resend.dev until your domain is verified
    email: process.env.VERIFIED_DOMAIN ? `noreply@${process.env.EMAIL_DOMAIN}` : 'onboarding@resend.dev',
    name: "FoodHub",
};

// Test connection function (keep for debugging only)
export const testResendConnection = async () => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: 'yakabukosama@gmail.com',
            subject: "Test Email",
            html: "<p>This is a test email to verify Resend is working.</p>",
        });
        console.log("Test email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Failed to send test email:", error);
        throw error;
    }
};