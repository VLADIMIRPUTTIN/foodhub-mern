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
    shareStatus: { 
        type: String, 
        enum: ['not_shared', 'pending', 'approved', 'rejected'], 
        default: 'not_shared' 
    },
    rejectionReason: { type: String },
    price: { type: Number, default: 0 },
    ratings: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rating: { type: Number, min: 1, max: 5, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    averageRating: { type: Number, default: 0 },
    
    dietaryTags: {
        type: [String],
        default: []
    },
    cuisine: {
        type: String,
        default: 'Filipino'
    },
    allergens: {
        type: [String],
        default: []
    }
}, { timestamps: true });

export const Recipe = mongoose.model("Recipe", recipeSchema);