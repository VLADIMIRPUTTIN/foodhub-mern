import { resend, sender as resendSender } from './resend.config.js';
import { 
    VERIFICATION_EMAIL_TEMPLATE, 
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE 
} from './emailTemplates.js';

// Helper: send via Gmail (SMTP)
const sendViaGmail = async ({ to, subject, html }) => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (!gmailUser || !gmailPass) {
        throw new Error('GMAIL_USER or GMAIL_PASS not set');
    }
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: gmailUser, pass: gmailPass },
        tls: { rejectUnauthorized: false },
    });
    const result = await transporter.sendMail({
        from: `FoodHub <${gmailUser}>`,
        to,
        subject,
        html,
    });
    console.log('✅ Email sent via Gmail:', result.messageId);
    return result;
};

// Helper: send via Resend (HTTPS — always works on Railway/cloud)
const sendViaResend = async ({ to, subject, html }) => {
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
};

// In production: Resend first (HTTPS, no SMTP firewall issues on Railway),
// Gmail second. In development: Gmail first, Resend second.
const sendEmail = async ({ to, subject, html }) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const providers = isProduction
        ? [
            { name: 'Resend', fn: sendViaResend },
            { name: 'Gmail', fn: sendViaGmail },
          ]
        : [
            { name: 'Gmail', fn: sendViaGmail },
            { name: 'Resend', fn: sendViaResend },
          ];

    for (const provider of providers) {
        try {
            return await provider.fn({ to, subject, html });
        } catch (err) {
            console.error(`❌ ${provider.name} failed:`, err.message);
            if (err.code) console.error(`   code: ${err.code}`);
            if (err.response) console.error(`   response: ${err.response}`);
        }
    }

    // Both failed
    if (!isProduction) {
        console.warn('⚠️  DEV MODE: Both providers failed. Check logs above.');
        return { devFallback: true };
    }
    throw new Error('Failed to send email — both Resend and Gmail failed.');
};
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