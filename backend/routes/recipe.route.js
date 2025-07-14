import express from "express";
import { createRecipe, getAllRecipes, updateRecipe, getRecipesByUser, uploadMiddleware, getAllRecipesForAdmin } from "../controllers/recipe.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const router = express.Router();

router.post("/", verifyToken, uploadMiddleware, createRecipe);
router.get("/", getAllRecipes); // Only public recipes (admin-created)
router.get("/admin/all", verifyToken, getAllRecipesForAdmin); // All recipes for admin dashboard
router.get("/user", verifyToken, getRecipesByUser);
router.get("/shared", async (req, res) => {
    try {
        // Populate createdBy so frontend can display user info
        const recipes = await Recipe.find({ isShared: true })
            .populate('createdBy', 'name email');
        res.json({ recipes });
    } catch (error) {
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
        // Handle case where createdBy might be null/undefined
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
router.post("/:id/share", verifyToken, async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            { isShared: true },
            { new: true }
        );
        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }
        res.json({ success: true, recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;