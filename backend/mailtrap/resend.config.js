import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(apiKey);

// Fixed sender configuration to prevent the double noreply@ issue
export const sender = {
    email: process.env.NODE_ENV === 'production' && process.env.VERIFIED_DOMAIN === 'true'
        ? (process.env.EMAIL_FROM || `noreply@${process.env.EMAIL_DOMAIN}`)
        : 'onboarding@resend.dev',
    name: "FoodHub",
};

// Updated test function to debug sender address
export const testResendConnection = async () => {
    try {
        const senderAddress = `${sender.name} <${sender.email}>`;
        console.log("Testing email with sender address:", senderAddress);
        console.log("API Key exists:", !!apiKey);
        console.log("Environment:", process.env.NODE_ENV);
        console.log("Verified Domain:", process.env.VERIFIED_DOMAIN);
        console.log("Email Domain:", process.env.EMAIL_DOMAIN);
        
        const data = await resend.emails.send({
            from: senderAddress,
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