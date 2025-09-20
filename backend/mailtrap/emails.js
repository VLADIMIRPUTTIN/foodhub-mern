import { VERIFICATION_EMAIL_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE } from "./emailTemplates.js";
import { resend, sender } from "./resend.config.js";

export const sendVerificationEmail = async (email, name, verificationCode) => {
    try {
        console.log(`📧 Attempting to send verification email to: ${email}`);
        
        // Create the profile image section for the email
        const profileImageSection = `<div style="width: 100%; height: 100%; background-color: #CF996C; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 28px; font-weight: bold; color: white;">${name.charAt(0).toUpperCase()}</span>
        </div>`;

        // Replace placeholders with actual content
        const htmlContent = VERIFICATION_EMAIL_TEMPLATE
            .replace(/{userName}/g, name)
            .replace(/{verificationCode}/g, verificationCode)
            .replace(/{profileImageSection}/g, profileImageSection);

        // Send the email using Resend
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: `Your FoodHub Verification Code: ${verificationCode}`,
            html: htmlContent,
        });
        
        console.log(`✅ Verification email sent successfully to ${email}`);
        console.log(`✅ Email ID: ${data.id}`);
        return data;
    } catch (error) {
        console.error("❌ Error sending verification email:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        throw error;
    }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        
        // Replace placeholder in template
        const htmlContent = PASSWORD_RESET_REQUEST_TEMPLATE
            .replace(/{resetURL}/g, resetURL);
            
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: `Reset Your FoodHub Password`,
            html: htmlContent,
        });

        console.log(`✅ Password reset email sent to ${email}`);
        return data;
    } catch (error) {
        console.error("❌ Error sending password reset email:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        throw error;
    }
};

export const sendResetSuccessEmail = async (email) => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: `Password Reset Successful`,
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        });

        console.log(`✅ Reset success email sent to ${email}`);
        return data;
    } catch (error) {
        console.error("❌ Error sending reset success email:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        throw error;
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try {
        const data = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: `Welcome to FoodHub!`,
            html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to FoodHub</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fef9f5;">
              <div style="background: linear-gradient(135deg, #CF996C, #BB8860); padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Welcome to FoodHub!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">We're excited to have you on board, ${name}!</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 20px rgba(207, 153, 108, 0.15);">
                <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Thank you for joining FoodHub! Your account is now verified and ready to use.</p>
                <p style="color: #666; margin-bottom: 25px;">Start exploring our delicious recipes and create your own culinary masterpieces!</p>
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #CF996C; font-weight: 600; margin: 0;">The FoodHub Team</p>
                </div>
              </div>
            </body>
            </html>
            `,
        });

        console.log(`✅ Welcome email sent to ${email}`);
        return data;
    } catch (error) {
        console.error("❌ Error sending welcome email:", error);
        console.error("❌ Error details:", JSON.stringify(error, null, 2));
        throw error;
    }
};