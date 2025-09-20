import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(apiKey);

export const sender = {
    email: process.env.VERIFIED_DOMAIN === 'true' 
        ? `noreply@${process.env.EMAIL_DOMAIN}` 
        : `onboarding@resend.dev`,
    name: "FoodHub",
};

// Add a test function to verify your setup
export const testResendConnection = async () => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: "yakabukosama@gmail.com", 
            subject: "Test Email from FoodHub Domain",
            html: `<p>This is a test email from your verified domain: ${sender.email}</p>`,
        });
        console.log("Test email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Failed to send test email:", error);
        throw error;
    }
};