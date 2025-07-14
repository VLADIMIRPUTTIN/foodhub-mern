import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.GMAIL_USER, // ✅ match .env
		pass: process.env.GMAIL_PASS, // ✅ match .env
	},
});

export const sender = {
	email: process.env.GMAIL_USER,
	name: "FoodHub",
};
