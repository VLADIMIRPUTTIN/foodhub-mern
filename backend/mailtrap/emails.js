import { resend, sender } from './resend.config.js';
import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE 
} from './emailTemplates.js';

// Import Gmail as fallback
const getGmailTransporter = async () => {
    const { transporter, sender: gmailSender } = await import('./gmail.config.js');
    return { transporter, gmailSender };
};

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
            profileImageSection = `
                <i class="bx bx-user" style="font-size: 36px; color: white;"></i>
            `;
        }

        const htmlContent = VERIFICATION_EMAIL_TEMPLATE
            .replace(/{userName}/g, userName)
            .replace(/{verificationCode}/g, verificationToken)
            .replace(/{profileImageSection}/g, profileImageSection);

        try {
            // Try Resend first
            const result = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: email,
                subject: "Verify Your FoodHub Account",
                html: htmlContent,
            });
            
            // Check if Resend failed due to domain restrictions
            if (result.error && result.error.statusCode === 403) {
                console.log("Resend failed due to domain restrictions, falling back to Gmail...");
                throw new Error("Domain restriction error");
            }
            
            console.log("Verification email sent successfully via Resend:", result);
            return result;
        } catch (resendError) {
            console.log("Resend failed, attempting Gmail fallback:", resendError.message);
            
            // Fallback to Gmail
            const { transporter, gmailSender } = await getGmailTransporter();
            
            const mailOptions = {
                from: `${gmailSender.name} <${gmailSender.email}>`,
                to: email,
                subject: "Verify Your FoodHub Account",
                html: htmlContent,
            };

            const gmailResult = await transporter.sendMail(mailOptions);
            console.log("Verification email sent successfully via Gmail:", gmailResult.messageId);
            return gmailResult;
        }
        
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error(`Error sending verification email: ${error.message}`);
    }
};

export const sendWelcomeEmail = async (email, name) => {
    try {
        if (!email) {
            throw new Error("Email is required");
        }

        try {
            const result = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: email,
                subject: "Welcome to FoodHub!",
                html: `<p>Hello ${name},</p><p>Thank you for joining FoodHub! We're excited to have you on board.</p>`,
            });
            
            if (result.error && result.error.statusCode === 403) {
                throw new Error("Domain restriction error");
            }
            
            console.log("Welcome email sent via Resend:", result);
            return result;
        } catch (resendError) {
            console.log("Resend failed for welcome email, using Gmail fallback");
            
            const { transporter, gmailSender } = await getGmailTransporter();
            
            const mailOptions = {
                from: `${gmailSender.name} <${gmailSender.email}>`,
                to: email,
                subject: "Welcome to FoodHub!",
                html: `<p>Hello ${name},</p><p>Thank you for joining FoodHub! We're excited to have you on board.</p>`,
            };

            const gmailResult = await transporter.sendMail(mailOptions);
            console.log("Welcome email sent via Gmail:", gmailResult.messageId);
            return gmailResult;
        }
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

        try {
            const result = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: email,
                subject: "Reset Your FoodHub Password",
                html: htmlContent,
            });
            
            if (result.error && result.error.statusCode === 403) {
                throw new Error("Domain restriction error");
            }
            
            console.log("Password reset email sent via Resend:", result);
            return result;
        } catch (resendError) {
            console.log("Resend failed for reset email, using Gmail fallback");
            
            const { transporter, gmailSender } = await getGmailTransporter();
            
            const mailOptions = {
                from: `${gmailSender.name} <${gmailSender.email}>`,
                to: email,
                subject: "Reset Your FoodHub Password",
                html: htmlContent,
            };

            const gmailResult = await transporter.sendMail(mailOptions);
            console.log("Password reset email sent via Gmail:", gmailResult.messageId);
            return gmailResult;
        }
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error(`Error sending password reset email: ${error.message}`);
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

        try {
            const result = await resend.emails.send({
                from: `${sender.name} <${sender.email}>`,
                to: email,
                subject: "Password Reset Successful",
                html: htmlContent,
            });
            
            if (result.error && result.error.statusCode === 403) {
                throw new Error("Domain restriction error");
            }
            
            console.log("Reset success email sent via Resend:", result);
            return result;
        } catch (resendError) {
            console.log("Resend failed for reset success email, using Gmail fallback");
            
            const { transporter, gmailSender } = await getGmailTransporter();
            
            const mailOptions = {
                from: `${gmailSender.name} <${gmailSender.email}>`,
                to: email,
                subject: "Password Reset Successful",
                html: htmlContent,
            };

            const gmailResult = await transporter.sendMail(mailOptions);
            console.log("Reset success email sent via Gmail:", gmailResult.messageId);
            return gmailResult;
        }
    } catch (error) {
        console.error("Error sending reset success email:", error);
        throw new Error(`Error sending reset success email: ${error.message}`);
    }
};