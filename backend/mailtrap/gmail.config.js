import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
});

export const sender = {
    email: process.env.GMAIL_USER,
    name: "FoodHub",
};

// Test the connection
transporter.verify((error, success) => {
    if (error) {
        console.log("Gmail configuration error:", error);
    } else {
        console.log("Gmail server is ready to take our messages");
    }
});
