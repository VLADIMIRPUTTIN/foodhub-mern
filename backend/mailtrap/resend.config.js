import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

// Create Resend instance with API key from environment
export const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: Always use onboarding@resend.dev until domain verification is complete
export const sender = {
    email: 'onboarding@resend.dev',
    name: "FoodHub",
};

// Test connection function with better error handling
export const testResendConnection = async () => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: 'yakabukosama@gmail.com',
            subject: "Test Email from FoodHub",
            html: "<p>This is a test email to verify Resend is working.</p>",
        });
        
        if (data.error) {
            console.error("Resend API returned an error:", data.error);
            return data;
        }
        
        console.log("Test email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Failed to send test email:", error);
        throw error;
    }
};