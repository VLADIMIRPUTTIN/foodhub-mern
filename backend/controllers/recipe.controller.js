import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/recipes/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'recipe-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export const uploadMiddleware = upload.single('image');

export const createRecipe = async (req, res) => {
    try {
        const { title, description, ingredients, instructions, category, cookingTime, servings, difficulty } = req.body;
        
        // Validate required fields
        if (!title || !description || !ingredients || !instructions) {
            return res.status(400).json({ 
                success: false, 
                message: "Title, description, ingredients, and instructions are required." 
            });
        }

        // Parse JSON strings
        let parsedIngredients, parsedInstructions;
        try {
            parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;
        } catch (parseError) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid ingredients or instructions format." 
            });
        }

        // Handle image upload
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/recipes/${req.file.filename}`;
        }

        // Get user info to determine visibility
        const user = await User.findById(req.userId);
        const isPublic = user.role === 'admin'; // Only admin recipes are public

        const recipe = new Recipe({
            title,
            description,
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            category: category || '',
            cookingTime: cookingTime ? parseInt(cookingTime) : null,
            servings: servings ? parseInt(servings) : null,
            difficulty: difficulty || 'Easy',
            imageUrl,
            createdBy: req.userId,
            isPublic: isPublic // Add this field
        });

        await recipe.save();
        
        // Populate the createdBy field with user info
        await recipe.populate('createdBy', 'name email');
        
        res.status(201).json({ success: true, recipe });
    } catch (error) {
        console.error('Create recipe error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Modified: Only return public recipes (admin-created)
export const getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ isPublic: true })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRecipesByUser = async (req, res) => {
    try {
        const recipes = await Recipe.find({ createdBy: req.userId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// New function: Get all recipes for admin dashboard
export const getAllRecipesForAdmin = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }

        // Check if user owns this recipe or is admin
        const user = await User.findById(req.userId);
        const isOwner = recipe.createdBy.toString() === req.userId;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "You can only edit your own recipes" });
        }

        // Parse JSON fields if sent as string
        let ingredients = req.body.ingredients;
        let instructions = req.body.instructions;
        if (typeof ingredients === 'string') ingredients = JSON.parse(ingredients);
        if (typeof instructions === 'string') instructions = JSON.parse(instructions);

        // Handle image upload
        let imageUrl = recipe.imageUrl;
        if (req.file) {
            imageUrl = `/uploads/recipes/${req.file.filename}`;
        }

        // Update fields
        recipe.title = req.body.title || recipe.title;
        recipe.category = req.body.category || recipe.category;
        recipe.description = req.body.description || recipe.description;
        recipe.ingredients = ingredients || recipe.ingredients;
        recipe.instructions = instructions || recipe.instructions;
        recipe.cookingTime = req.body.cookingTime || recipe.cookingTime;
        recipe.servings = req.body.servings || recipe.servings;
        recipe.difficulty = req.body.difficulty || recipe.difficulty;
        recipe.imageUrl = imageUrl;

        await recipe.save();

        const updated = await Recipe.findById(id).populate('createdBy', 'name email');

        res.json({ success: true, recipe: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};