import { resend, sender } from './resend.config.js';
import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE 
} from './emailTemplates.js';

// Helper: send via Resend first, fall back to Gmail on ANY error
const sendEmail = async ({ to, subject, html }) => {
    // Try Resend first
    try {
        const result = await resend.emails.send({
            from: `${sender.name} <${sender.email}>`,
            to,
            subject,
            html,
        });

        // Resend SDK returns errors in result.error instead of throwing
        if (result.error) {
            console.error('Resend returned an error:', result.error);
            throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
        }

        console.log('Email sent via Resend:', result.data?.id);
        return result;
    } catch (resendErr) {
        console.log('Resend failed, falling back to Gmail:', resendErr.message);
    }

    // Gmail fallback
    try {
        const { transporter, sender: gmailSender } = await import('./gmail.config.js');
        const gmailResult = await transporter.sendMail({
            from: `${gmailSender.name} <${gmailSender.email}>`,
            to,
            subject,
            html,
        });
        console.log('Email sent via Gmail:', gmailResult.messageId);
        return gmailResult;
    } catch (gmailErr) {
        console.error('Gmail also failed:', gmailErr.message);
        // In development, swallow the error so the endpoint still returns 200.
        // The verification code is logged by the caller for testing.
        if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️  DEV MODE: Both email providers failed. Use the code logged above.');
            return { devFallback: true };
        }
        throw gmailErr;
    }
};

// Import Gmail as fallback
const getGmailTransporter = async () => {
    const { transporter, sender: gmailSender } = await import('./gmail.config.js');
    return { transporter, gmailSender };
};

export const sendVerificationEmail = async (email, verificationToken, userName, profileImage = null) => {
    if (!email) throw new Error("Email is required");

    // Always log the code so it's visible in server logs (essential for local dev)
    console.log(`📧 Sending verification email to: ${email}`);
    console.log(`🔑 VERIFICATION CODE for ${email}: ${verificationToken}`);

    const profileImageSection = profileImage
        ? `<img src="${profileImage}" alt="${userName}'s profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';">`
        : `<i class="bx bx-user" style="font-size:36px;color:white;"></i>`;

    const html = VERIFICATION_EMAIL_TEMPLATE
        .replace(/{userName}/g, userName)
        .replace(/{verificationCode}/g, verificationToken)
        .replace(/{profileImageSection}/g, profileImageSection);

    return sendEmail({ to: email, subject: 'Verify Your FoodHub Account', html });
};

export const sendWelcomeEmail = async (email, name) => {
    if (!email) throw new Error("Email is required");

    const html = `<p>Hello ${name},</p><p>Thank you for joining FoodHub! We're excited to have you on board.</p>`;
    return sendEmail({ to: email, subject: 'Welcome to FoodHub!', html });
};

export const sendPasswordResetEmail = async (email, resetURL, userName, profileImage = null) => {
    if (!email) throw new Error("Email is required");

    const profileImageSection = profileImage
        ? `<img src="${profileImage}" alt="${userName}'s profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';">`
        : `<i class="bx bx-key" style="font-size:36px;color:white;"></i>`;

    const html = PASSWORD_RESET_REQUEST_TEMPLATE
        .replace(/{userName}/g, userName)
        .replace(/{resetURL}/g, resetURL)
        .replace(/{profileImageSection}/g, profileImageSection);

    return sendEmail({ to: email, subject: 'Reset Your FoodHub Password', html });
};

export const sendResetSuccessEmail = async (email, userName, profileImage = null) => {
    if (!email) throw new Error("Email is required");

    const profileImageSection = profileImage
        ? `<img src="${profileImage}" alt="${userName}'s profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';">`
        : `<i class="bx bx-shield-check" style="font-size:36px;color:white;"></i>`;

    const html = PASSWORD_RESET_SUCCESS_TEMPLATE
        .replace(/{userName}/g, userName)
        .replace(/{profileImageSection}/g, profileImageSection);

    return sendEmail({ to: email, subject: 'Password Reset Successful', html });
};