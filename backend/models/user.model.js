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
		},
		name: {
			type: String,
			required: true,
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
		profileImage: { type: String, default: null },
		bio: { type: String, default: "" },

		// User status for admin management
		status: {
			type: String,
			enum: ["active", "suspended", "banned"],
			default: "active",
		},
		suspendedUntil: { type: Date },
		banReason: { type: String },

		// User role
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},

		// Google OAuth fields
		googleId: { type: String, sparse: true },

		// ADD: Onboarding completion flag
		hasCompletedOnboarding: {
			type: Boolean,
			default: false,
		},

		// User Preferences for personalized recipes
		dietaryPreferences: {
			type: [String],
			enum: [
				"vegetarian",
				"vegan",
				"gluten-free",
				"dairy-free",
				"keto",
				"paleo",
				"halal",
				"kosher",
				"low-carb",
				"high-protein",
			],
			default: [],
		},
		allergies: {
			type: [String],
			default: [],
		},
		preferredCuisines: {
			type: [String],
			enum: [
				"Filipino",
				"Italian",
				"Chinese",
				"Japanese",
				"Korean",
				"Mexican",
				"Indian",
				"Thai",
				"American",
				"French",
				"Mediterranean",
			],
			default: [],
		},
	},
	{ timestamps: true }
);

export const User = mongoose.model("User", userSchema);
