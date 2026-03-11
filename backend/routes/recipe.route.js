import express from "express";
import { 
    createRecipe, 
    getAllRecipes, 
    updateRecipe, 
    getRecipesByUser, 
    uploadMiddleware, 
    getAllRecipesForAdmin, 
    getPendingRecipes, 
    moderateRecipe,
    unshareRecipe
} from "../controllers/recipe.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";import { sendPushToAdmins } from '../utils/webPush.js';import mongoose from "mongoose";

const router = express.Router();

router.post("/", verifyToken, uploadMiddleware, createRecipe);
router.get("/", getAllRecipes);
router.get("/admin/all", verifyToken, getAllRecipesForAdmin);
router.get("/user", verifyToken, getRecipesByUser);
router.get("/admin/pending", verifyToken, getPendingRecipes);
router.patch("/:id/moderate", verifyToken, moderateRecipe);

// Make sure this route comes BEFORE the /:id route to avoid conflicts
router.post("/:id/rate", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const userId = req.userId;

        console.log('Rating request:', { id, rating, userId }); // Debug log

        // Validate rating value
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid recipe ID format"
            });
        }

        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found"
            });
        }

        // Check if user has already rated this recipe
        const existingRatingIndex = recipe.ratings.findIndex(
            r => r.user.toString() === userId
        );

        if (existingRatingIndex !== -1) {
            // Update existing rating
            recipe.ratings[existingRatingIndex].rating = rating;
            recipe.ratings[existingRatingIndex].createdAt = Date.now();
        } else {
            // Add new rating
            recipe.ratings.push({
                user: userId,
                rating,
                createdAt: Date.now()
            });
        }

        // Calculate average rating
        if (recipe.ratings.length > 0) {
            const sum = recipe.ratings.reduce((total, r) => total + r.rating, 0);
            recipe.averageRating = sum / recipe.ratings.length;
        } else {
            recipe.averageRating = 0;
        }

        await recipe.save();

        res.json({
            success: true,
            message: "Rating submitted successfully",
            recipe: {
                ...recipe._doc,
                ratingCount: recipe.ratings.length,
                userRating: rating
            }
        });
    } catch (error) {
        console.error('Rate recipe error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update the shared recipes route to only show approved recipes
router.get("/shared", async (req, res) => {
    try {
        const recipes = await Recipe.find({ 
            shareStatus: 'approved',
            isShared: true 
        })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, recipes });
    } catch (error) {
        console.error('Error fetching shared recipes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update the share recipe route to set status as pending and emit socket event
router.post("/:id/share", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id).populate('createdBy', 'name email');

        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }

        // Check if user owns this recipe
        if (recipe.createdBy._id.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "You can only share your own recipes" });
        }

        // Set recipe to pending status
        recipe.shareStatus = 'pending';
        recipe.isShared = false; // Not public yet until approved
        await recipe.save();

        // Notify all admins via push notification
        sendPushToAdmins({
            title: '🍽️ New Recipe Pending Review',
            body: `${recipe.createdBy.name} submitted "${recipe.title}" for community sharing.`,
            icon: '/Img/logo.png',
            url: '/admin/pending',
        }).catch(err => console.error('Push to admins failed:', err));

        // ✅ Emit socket event with FULL recipe data including imageUrl
        const io = req.app.get('io');
        if (io) {
            io.emit('recipePending', {
                _id: recipe._id,
                title: recipe.title,
                description: recipe.description,
                category: recipe.category,
                imageUrl: recipe.imageUrl, // ✅ Include imageUrl
                createdBy: {
                    _id: recipe.createdBy._id,
                    name: recipe.createdBy.name,
                    email: recipe.createdBy.email
                },
                createdAt: recipe.createdAt,
                shareStatus: 'pending'
            });
            console.log('✅ Emitted recipePending event with imageUrl:', recipe.imageUrl);
        }

        res.json({ success: true, recipe });
    } catch (error) {
        console.error('Error sharing recipe:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('createdBy', 'name email');
        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }
        res.json({ success: true, recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.patch("/:id", verifyToken, uploadMiddleware, updateRecipe);

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid recipe ID format" });
        }
        
        // Find the recipe first
        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }
        
        // Get user info to check if admin
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        
        // Check if user owns this recipe OR is an admin
        const isOwner = recipe.createdBy && recipe.createdBy.toString() === req.userId;
        const isAdmin = user.role === 'admin';
        
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only delete your own recipes or must be an admin" 
            });
        }
        
        // Delete the recipe
        await Recipe.findByIdAndDelete(id);
        
        res.status(200).json({ 
            success: true, 
            message: "Recipe deleted successfully" 
        });
    } catch (error) {
        console.error('Delete recipe error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Server error while deleting recipe",
            error: error.message 
        });
    }
});

router.post("/:id/unshare", verifyToken, unshareRecipe);

export default router;