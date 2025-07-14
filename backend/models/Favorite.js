import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true
    }
}, {
    timestamps: true
});

// Ensure a user can only favorite a recipe once
favoriteSchema.index({ user: 1, recipe: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);