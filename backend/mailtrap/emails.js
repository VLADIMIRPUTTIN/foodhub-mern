import { resend, sender as resendSender } from './resend.config.js';
import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE 
} from './emailTemplates.js';

// Helper: try Gmail first (no domain verification needed), then fall back to Resend
const sendEmail = async ({ to, subject, html }) => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    // ── 1. Gmail (primary) ──────────────────────────────────────────────────
    if (gmailUser && gmailPass) {
        try {
            const nodemailer = (await import('nodemailer')).default;
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: gmailUser, pass: gmailPass },
            });
            const gmailResult = await transporter.sendMail({
                from: `FoodHub <${gmailUser}>`,
                to,
                subject,
                html,
            });
            console.log('✅ Email sent via Gmail:', gmailResult.messageId);
            return gmailResult;
        } catch (gmailErr) {
            console.error('❌ Gmail failed:', gmailErr.message);
            console.error('❌ Gmail error code:', gmailErr.code);
            console.error('❌ Gmail response:', gmailErr.response);
            console.error('❌ Gmail responseCode:', gmailErr.responseCode);
        }
    } else {
        console.warn('⚠️ GMAIL_USER or GMAIL_PASS not set — skipping Gmail');
    }

    // ── 2. Resend (fallback) ────────────────────────────────────────────────
    try {
        const result = await resend.emails.send({
            from: `${resendSender.name} <${resendSender.email}>`,
            to,
            subject,
            html,
        });
        if (result.error) {
            throw new Error(`Resend error: ${result.error.message || JSON.stringify(result.error)}`);
        }
        console.log('✅ Email sent via Resend:', result.data?.id);
        return result;
    } catch (resendErr) {
        console.error('❌ Resend also failed:', resendErr.message);
    }

    // ── 3. Both failed ──────────────────────────────────────────────────────
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  DEV MODE: Both providers failed. Check the code in the logs above.');
        return { devFallback: true };
    }
    throw new Error('Failed to send email — both Gmail and Resend failed.');
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