import { resend, sender } from './resend.config.js';
import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE 
} from './emailTemplates.js';

export const sendVerificationEmail = async (email, verificationToken, userName, profileImage = null) => {
    try {
        console.log("Attempting to send verification email via Resend:");
        console.log("To:", email);
        console.log("From:", sender.email);
        console.log("Code:", verificationToken);
        console.log("Name:", userName);

        if (!email) {
            throw new Error("Email is required");
        }

        // Create profile image section
        let profileImageSection = '';
        
        if (profileImage) {
            // If user has a profile image (Google photo or uploaded image)
            profileImageSection = `
                <img src="${profileImage}" 
                     alt="${userName}'s profile" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(255,255,255,0.1);">
                    <i class="bx bx-user" style="font-size: 32px; color: white;"></i>
                </div>
            `;
        } else {
            // Default icon if no profile image
            profileImageSection = `
                <i class="bx bx-user" style="font-size: 36px; color: white;"></i>
            `;
        }

        const htmlContent = VERIFICATION_EMAIL_TEMPLATE
            .replace(/{userName}/g, userName)
            .replace(/{verificationCode}/g, verificationToken)
            .replace(/{profileImageSection}/g, profileImageSection);

        // Use Resend instead of Gmail
        const result = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Verify Your FoodHub Account",
            html: htmlContent,
        });
        
        console.log("Verification email sent successfully:", result);
        return result;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try {
        if (!email) {
            throw new Error("Email is required");
        }

        const result = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Welcome to FoodHub!",
            html: `<p>Hello ${name},</p><p>Thank you for joining FoodHub! We're excited to have you on board.</p>`,
        });
        
        console.log("Welcome email sent:", result);
        return result;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        throw error;
    }
};

export const sendPasswordResetEmail = async (email, resetURL, userName, profileImage = null) => {
    try {
        if (!email) {
            throw new Error("Email is required");
        }

        // Create profile image section
        let profileImageSection = '';
        
        if (profileImage) {
            profileImageSection = `
                <img src="${profileImage}" 
                     alt="${userName}'s profile" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(255,255,255,0.1);">
                    <i class="bx bx-key" style="font-size: 32px; color: white;"></i>
                </div>
            `;
        } else {
            profileImageSection = `
                <i class="bx bx-key" style="font-size: 36px; color: white;"></i>
            `;
        }

        const htmlContent = PASSWORD_RESET_REQUEST_TEMPLATE
            .replace(/{userName}/g, userName)
            .replace(/{resetURL}/g, resetURL)
            .replace(/{profileImageSection}/g, profileImageSection);

        const result = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Reset Your FoodHub Password",
            html: htmlContent,
        });
        
        console.log("Password reset email sent:", result);
        return result;
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
};

export const sendResetSuccessEmail = async (email, userName, profileImage = null) => {
    try {
        if (!email) {
            throw new Error("Email is required");
        }

        // Create profile image section  
        let profileImageSection = '';
        
        if (profileImage) {
            profileImageSection = `
                <img src="${profileImage}" 
                     alt="${userName}'s profile" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: rgba(255,255,255,0.1);">
                    <i class="bx bx-shield-check" style="font-size: 32px; color: white;"></i>
                </div>
            `;
        } else {
            profileImageSection = `
                <i class="bx bx-shield-check" style="font-size: 36px; color: white;"></i>
            `;
        }

        const htmlContent = PASSWORD_RESET_SUCCESS_TEMPLATE
            .replace(/{userName}/g, userName)
            .replace(/{profileImageSection}/g, profileImageSection);

        const result = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to: email,
            subject: "Password Reset Successful",
            html: htmlContent,
        });
        
        console.log("Reset success email sent:", result);
        return result;
    } catch (error) {
        console.error("Error sending reset success email:", error);
        throw new Error(`Error sending reset success email: ${error}`);
    }
};