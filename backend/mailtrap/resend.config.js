import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

// Create Resend instance with the API key from your environment variables
const apiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(apiKey);

export const sender = {
    email: `onboarding@resend.dev`, // Use this for testing
    name: "FoodHub",
};

// Add a test function to verify your setup
export const testResendConnection = async () => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: "yakabukosama@gmail.com", 
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