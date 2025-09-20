import express from 'express';
import { Favorite } from '../models/Favorite.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get user's favorite recipes
router.get('/', verifyToken, async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.userId })
            .populate({
                path: 'recipe',
                match: { _id: { $ne: null } },
                select: '_id title description category imageUrl cookingTime createdAt createdBy averageRating ratings price'
            })
            .sort({ createdAt: -1 });

        // Filter out favorites where recipe is null (deleted recipes)
        const validFavorites = favorites.filter(favorite => favorite.recipe !== null);

        res.json({
            success: true,
            favorites: validFavorites,
            count: validFavorites.length
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching favorites',
            error: error.message
        });
    }
});

// Add recipe to favorites
router.post('/', verifyToken, async (req, res) => {
    try {
        const { recipeId } = req.body;

        if (!recipeId) {
            return res.status(400).json({
                success: false,
                message: 'Recipe ID is required'
            });
        }

        // Check if recipe exists - use dynamic import
        const { Recipe } = await import('../models/recipe.model.js');
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found'
            });
        }

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            user: req.userId,
            recipe: recipeId
        });

        if (existingFavorite) {
            return res.status(400).json({
                success: false,
                message: 'Recipe already in favorites'
            });
        }

        const favorite = new Favorite({
            user: req.userId,
            recipe: recipeId
        });

        await favorite.save();

        res.json({
            success: true,
            message: 'Recipe added to favorites',
            favorite
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to favorites',
            error: error.message
        });
    }
});

// Remove recipe from favorites
router.delete('/:recipeId', verifyToken, async (req, res) => {
    try {
        const { recipeId } = req.params;

        const result = await Favorite.findOneAndDelete({
            user: req.userId,
            recipe: recipeId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.json({
            success: true,
            message: 'Recipe removed from favorites'
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing from favorites'
        });
    }
});

export default router;