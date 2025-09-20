import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(apiKey);

// Updated sender configuration
export const sender = {
    email: process.env.NODE_ENV === 'production' && process.env.VERIFIED_DOMAIN === 'true'
        ? `noreply@${process.env.EMAIL_DOMAIN}`
        : 'onboarding@resend.dev',
    name: "FoodHub",
};

export const testResendConnection = async () => {
    try {
        console.log("Testing email with sender:", sender);
        console.log("API Key exists:", !!apiKey);
        console.log("Environment:", process.env.NODE_ENV);
        console.log("Verified Domain:", process.env.VERIFIED_DOMAIN);
        
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: "yakabukosama@gmail.com", 
            subject: "Test Email from FoodHub",
            html: `<p>Test email from: ${sender.email}</p><p>Environment: ${process.env.NODE_ENV}</p>`,
        });
        console.log("Test email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Failed to send test email:", error);
        throw error;
    }
};