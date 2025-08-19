import { Ingredient } from "../models/ingredient.model.js";
import { User } from "../models/user.model.js";

export const createIngredient = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: "Ingredient name is required" 
            });
        }

        // Check if user is admin (optional - remove if all users can create ingredients)
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check if ingredient already exists
        const existingIngredient = await Ingredient.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingIngredient) {
            return res.status(400).json({ 
                success: false, 
                message: "Ingredient already exists" 
            });
        }

        const ingredient = new Ingredient({
            name: name.trim()
        });

        await ingredient.save();
        
        res.status(201).json({ 
            success: true, 
            ingredient,
            message: "Ingredient created successfully" 
        });
    } catch (error) {
        console.error('Create ingredient error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const getAllIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort({ name: 1 });
        res.status(200).json({ 
            success: true, 
            ingredients 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const searchIngredients = async (req, res) => {
    try {
        const { query } = req.query; // Changed from 'q' to 'query'
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: "Search query is required" 
            });
        }

        const ingredients = await Ingredient.find({
            name: { $regex: query, $options: 'i' } // Changed from 'q' to 'query'
        }).limit(10);

        res.status(200).json({ 
            success: true, 
            ingredients 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const updateIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: "Ingredient name is required" 
            });
        }

        // Check if user exists
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check if ingredient exists
        const ingredient = await Ingredient.findById(id);
        if (!ingredient) {
            return res.status(404).json({ 
                success: false, 
                message: "Ingredient not found" 
            });
        }

        // Check if another ingredient with the same name exists (excluding current one)
        const existingIngredient = await Ingredient.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            _id: { $ne: id }
        });
        
        if (existingIngredient) {
            return res.status(400).json({ 
                success: false, 
                message: "An ingredient with this name already exists" 
            });
        }

        // Update the ingredient
        ingredient.name = name.trim();
        await ingredient.save();
        
        res.status(200).json({ 
            success: true, 
            ingredient,
            message: "Ingredient updated successfully" 
        });
    } catch (error) {
        console.error('Update ingredient error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const deleteIngredient = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: "Ingredient ID is required" 
            });
        }

        // Check if user exists
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        // Check if ingredient exists
        const ingredient = await Ingredient.findById(id);
        if (!ingredient) {
            return res.status(404).json({ 
                success: false, 
                message: "Ingredient not found" 
            });
        }

        // Delete the ingredient
        await Ingredient.findByIdAndDelete(id);
        
        res.status(200).json({ 
            success: true, 
            message: "Ingredient deleted successfully" 
        });
    } catch (error) {
        console.error('Delete ingredient error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};