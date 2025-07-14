import express from 'express';
import { Favorite } from '../models/Favorite.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get user's favorite recipes
router.get('/', verifyToken, async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.userId })
            .populate('recipe')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            favorites
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
        const count = await Favorite.countDocuments({ user: req.userId });
        
        res.json({
            success: true,
            count
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
            message: 'Error adding to favorites'
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