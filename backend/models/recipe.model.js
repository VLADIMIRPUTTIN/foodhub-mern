import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    ingredients: { type: Array, required: true },
    instructions: { type: Array, required: true },
    cookingTime: { type: Number },
    servings: { type: Number },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    imageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    isShared: { type: Boolean, default: false },
    // Add new field for moderation
    shareStatus: { 
        type: String, 
        enum: ['not_shared', 'pending', 'approved', 'rejected'], 
        default: 'not_shared' 
    },
    rejectionReason: { type: String }
}, { timestamps: true });

export const Recipe = mongoose.model("Recipe", recipeSchema);