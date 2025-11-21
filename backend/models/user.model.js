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
		suspendedUntil: {
			type: Date,
		},
		banReason: {
			type: String,
		},
		lastLogin: {
			type: Date,
			default: Date.now,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		verificationToken: String,
		verificationTokenExpiresAt: Date,
		resetPasswordToken: String,
		resetPasswordExpiresAt: Date,
		profileImage: {
			type: String,
			default: "",
		},
		bio: {
			type: String,
			default: "",
		},
		// Add these onboarding-related fields
		hasCompletedOnboarding: {
			type: Boolean,
			default: false,
		},
		dietaryPreferences: {
			type: [String],
			default: [],
		},
		allergies: {
			type: [String],
			default: [],
		},
		preferredCuisines: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);
