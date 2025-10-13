import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    recipe: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Recipe', 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true, 
        trim: true 
    },
    // Optional rating within the comment
    rating: { 
        type: Number, 
        min: 1, 
        max: 5
    }
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema);