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
                match: { _id: { $ne: null } }, // Only populate if recipe exists
                select: '_id title description category imageUrl cookingTime createdAt createdBy'
            })
            .sort({ createdAt: -1 });

        // Filter out favorites where recipe is null (deleted recipes)
        const validFavorites = favorites.filter(favorite => favorite.recipe !== null);

        res.json({
            success: true,
            favorites: validFavorites
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching favorites'
        });
    }
});

// Get user's favorite count
router.get('/count', verifyToken, async (req, res) => {
    try {
        // Count favorites that have valid recipe references
        const favorites = await Favorite.find({ user: req.userId })
            .populate('recipe');
        
        const validCount = favorites.filter(favorite => favorite.recipe !== null).length;
        
        res.json({
            success: true,
            count: validCount
        });
    } catch (error) {
        console.error('Error fetching favorite count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching favorite count'
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

        // Check if already favorited
        const existingFavorite = await Favorite.findOne({
            user: req.userId,
            recipe: recipeId
        });

        if (existingFavorite) {
            return res.status(200).json({  // Changed from 400 to 200 to avoid breaking the client
                success: true,
                message: 'Recipe already in favorites',
                favorite: existingFavorite
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
            message: 'Error adding to favorites: ' + error.message
        });
    }
});

// Remove recipe from favorites
router.delete('/:recipeId', verifyToken, async (req, res) => {
    try {
        const { recipeId } = req.params;

        if (!recipeId) {
            return res.status(400).json({
                success: false,
                message: 'Recipe ID is required'
            });
        }

        const result = await Favorite.findOneAndDelete({
            user: req.userId,
            recipe: recipeId
        });

        if (!result) {
            return res.status(200).json({  // Changed from 404 to 200
                success: true,
                message: 'Favorite already removed'
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
            message: 'Error removing from favorites: ' + error.message
        });
    }
});

export default router;