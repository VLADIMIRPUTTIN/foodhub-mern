import { Comment } from "../models/comment.model.js";
import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";

// Create a new comment
export const createComment = async (req, res) => {
    try {
        const { recipeId, text, rating } = req.body;
        const userId = req.userId;

        if (!recipeId || !text) {
            return res.status(400).json({
                success: false,
                message: "Recipe ID and comment text are required"
            });
        }

        // Check if recipe exists
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        const comment = new Comment({
            recipe: recipeId,
            user: userId,
            text,
            rating: rating || undefined
        });

        await comment.save();

        // Increment comment count on recipe
        await Recipe.findByIdAndUpdate(recipeId, {
            $inc: { commentCount: 1 }
        });

        // Populate user info before sending response
        await comment.populate('user', 'name profileImage');

        res.status(201).json({
            success: true,
            comment
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};

// Get all comments for a recipe
export const getRecipeComments = async (req, res) => {
    try {
        const { recipeId } = req.params;

        const comments = await Comment.find({ recipe: recipeId })
            .populate('user', 'name profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            comments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete a comment (only the author or admin can delete)
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        const comment = await Comment.findById(commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }

        // Check if user is the author of the comment
        if (comment.user.toString() !== userId) {
            // Check if user is admin
            const user = await User.findById(userId);
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "You can only delete your own comments"
                });
            }
        }

        // Decrement comment count on recipe
        await Recipe.findByIdAndUpdate(comment.recipe, {
            $inc: { commentCount: -1 }
        });

        await Comment.findByIdAndDelete(commentId);

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};