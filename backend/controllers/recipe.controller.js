import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from '../utils/cloudinary.js';

// Update the file upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use a directory that exists in both environments
        const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : './uploads/temp';
        fs.mkdirSync(uploadDir, { recursive: true }); // Create directory if it doesn't exist
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadMiddleware = upload.single('image');

export const createRecipe = async (req, res) => {
    try {
        const { title, description, ingredients, instructions, category, cookingTime, servings, difficulty, price } = req.body;
        
        console.log("Recipe creation request received:", {
            userId: req.userId,
            title,
            hasFile: !!req.file
        });
        
        // Validate required fields
        if (!title || !description || !ingredients || !instructions) {
            return res.status(400).json({ 
                success: false, 
                message: "Title, description, ingredients, and instructions are required." 
            });
        }

        // Parse JSON strings with better error handling
        let parsedIngredients, parsedInstructions;
        try {
            parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;
            
            // Additional validation
            if (!Array.isArray(parsedIngredients) || !Array.isArray(parsedInstructions)) {
                throw new Error("Ingredients and instructions must be arrays");
            }
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            return res.status(400).json({ 
                success: false, 
                message: "Invalid ingredients or instructions format." 
            });
        }

        // Handle image upload
        let imageUrl = null;
        if (req.file) {
            try {
                console.log("Uploading image to Cloudinary:", req.file.path);
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'foodhub/recipes',
                });
                imageUrl = result.secure_url;
                console.log("Cloudinary upload successful:", imageUrl);
                
                // Clean up the temp file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Error removing temp file:", err);
                });
            } catch (err) {
                console.error("Cloudinary upload error:", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Image upload failed: " + (err.message || "Unknown error") 
                });
            }
        }

        // Get user info to determine visibility
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
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
            isPublic: isPublic,
            price: price ? parseFloat(price) : 0
        });

        await recipe.save();
        console.log("Recipe saved successfully:", recipe._id);
        
        // Populate the createdBy field with user info
        await recipe.populate('createdBy', 'name email');
        
        res.status(201).json({ success: true, recipe });
    } catch (error) {
        console.error('Create recipe error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Server error: " + error.message 
        });
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
        
        // Add this line to handle price updates
        if (req.body.price !== undefined) {
            recipe.price = parseFloat(req.body.price);
        }

        await recipe.save();

        const updated = await Recipe.findById(id).populate('createdBy', 'name email');

        res.json({ success: true, recipe: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add new function to get pending recipes
export const getPendingRecipes = async (req, res) => {
    try {
        const pendingRecipes = await Recipe.find({ shareStatus: 'pending' })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes: pendingRecipes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add function to approve/reject recipes
export const moderateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, rejectionReason } = req.body;
        
        const recipe = await Recipe.findById(id).populate('createdBy', 'name email');
        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }

        if (action === 'approve') {
            recipe.shareStatus = 'approved';
            recipe.isShared = true;
            recipe.rejectionReason = undefined;
            
            // Emit real-time notification to the recipe owner
            const io = req.app.get('io');
            const connectedUsers = req.app.get('connectedUsers');
            const userSocketId = connectedUsers.get(recipe.createdBy._id.toString());
            
            if (userSocketId) {
                io.to(userSocketId).emit('recipeApproved', {
                    recipeId: recipe._id,
                    recipeName: recipe.title,
                    message: `Your recipe "${recipe.title}" has been approved and is now live in the community!`,
                    timestamp: new Date(),
                    shareStatus: 'approved',
                    isShared: true
                });
            }
            
        } else if (action === 'reject') {
            recipe.shareStatus = 'rejected';
            recipe.isShared = false;
            recipe.rejectionReason = rejectionReason || 'No reason provided';
            
            // Emit real-time notification for rejection
            const io = req.app.get('io');
            const connectedUsers = req.app.get('connectedUsers');
            const userSocketId = connectedUsers.get(recipe.createdBy._id.toString());
            
            if (userSocketId) {
                io.to(userSocketId).emit('recipeRejected', {
                    recipeId: recipe._id,
                    recipeName: recipe.title,
                    message: `Your recipe "${recipe.title}" was not approved.`,
                    reason: rejectionReason || 'No reason provided',
                    timestamp: new Date(),
                    shareStatus: 'rejected',
                    isShared: false
                });
            }
        }

        await recipe.save();
        res.json({ success: true, recipe });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add this new function after the existing functions
export const unshareRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }

        // Check if user owns this recipe
        if (recipe.createdBy.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "You can only unshare your own recipes" });
        }

        // Reset sharing status
        recipe.shareStatus = 'not_shared';
        recipe.isShared = false;
        recipe.rejectionReason = undefined;

        await recipe.save();
        res.json({ success: true, recipe, message: "Recipe removed from community" });
    } catch (error) {
        console.error('Error unsharing recipe:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};