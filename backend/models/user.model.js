import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		status: {
			type: String,
			enum: ["active", "suspended", "banned"],
			default: "active",
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		verificationToken: String,
		verificationTokenExpiresAt: Date,
		banReason: { type: String, default: null },
		suspendedUntil: { type: Date, default: null },
		profileImage: { type: String, default: null },
		bio: { type: String, default: "" }, // <-- this line must exist
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);
