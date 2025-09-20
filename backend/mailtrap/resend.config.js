import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

// Create Resend instance with API key from environment
export const resend = new Resend(process.env.RESEND_API_KEY);

// Use your verified domain for the sender email
export const sender = {
    email: `noreply@foodhubrecipe.shop`, 
    name: "FoodHub",
};

// Test connection function
export const testResendConnection = async () => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: 'yakabukosama@gmail.com',
            subject: "FoodHub Email Service Test",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #CF996C;">FoodHub Email Service Test</h1>
                <p>This is a test email to verify that the Resend email service is working correctly.</p>
                <p>Current configuration:</p>
                <ul>
                    <li>Using verified domain: ${process.env.VERIFIED_DOMAIN === 'true' ? 'Yes' : 'No'}</li>
                    <li>Domain: ${process.env.EMAIL_DOMAIN || 'Not set'}</li>
                    <li>Sender: ${sender.email}</li>
                </ul>
                <p>If you received this email, your email service is working correctly!</p>
            </div>
            `,
        });
        
        console.log("Test email sent successfully:", data);
        return {
            success: true,
            data,
            sender: sender.email,
            config: {
                verifiedDomain: process.env.VERIFIED_DOMAIN,
                emailDomain: process.env.EMAIL_DOMAIN
            }
        };
    } catch (error) {
        console.error("Failed to send test email:", error);
        throw error;
    }
};