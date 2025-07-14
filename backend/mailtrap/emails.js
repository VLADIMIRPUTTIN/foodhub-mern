import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailTemplates.js";

dotenv.config();

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  throw new Error("❌ GMAIL_USER or GMAIL_PASS not set in .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Shared send function
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `\"FoodHub Team\" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`📤 Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message || error);
    throw error;
  }
};

export const sendVerificationEmail = async (email, verificationCode) => {
  console.log("🔥 Sending verification email to:", email);
  console.log("🔑 Code:", verificationCode);

  const html = VERIFICATION_EMAIL_TEMPLATE.replace(
    "{verificationCode}",
    verificationCode
  );

  await sendEmail({
    to: email,
    subject: "Verify your email - FoodHub",
    html,
  });
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const html = PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL);

  await sendEmail({
    to: email,
    subject: "Reset your password - FoodHub",
    html,
  });
};

export const sendResetSuccessEmail = async (email) => {
  await sendEmail({
    to: email,
    subject: "Password Reset Successful - FoodHub",
    html: PASSWORD_RESET_SUCCESS_TEMPLATE,
  });
};

export const sendWelcomeEmail = async (email, name) => {
  const html = `
    <h1>Welcome to FoodHub, ${name}!</h1>
    <p>Thanks for joining us. We're excited to have you on board.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to FoodHub!",
    html,
  });
};