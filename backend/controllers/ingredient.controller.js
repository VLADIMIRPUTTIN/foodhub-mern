import { Ingredient } from "../models/ingredient.model.js";

export const createIngredient = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Name is required" });

        const exists = await Ingredient.findOne({ name });
        if (exists) return res.status(400).json({ success: false, message: "Ingredient already exists" });

        const ingredient = new Ingredient({ name });
        await ingredient.save();
        res.status(201).json({ success: true, ingredient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort({ name: 1 });
        res.status(200).json({ success: true, ingredients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const searchIngredients = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(200).json({ success: true, ingredients: [] });
        }

        const ingredients = await Ingredient.find({
            name: { $regex: query, $options: 'i' }
        }).limit(10).sort({ name: 1 });

        res.status(200).json({ success: true, ingredients });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};