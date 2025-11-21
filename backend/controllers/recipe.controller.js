import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from '../utils/cloudinary.js';

// Update the file upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : './uploads/temp';
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadMiddleware = upload.single('image');

export const createRecipe = async (req, res) => {
    try {
        const { 
            title, description, ingredients, instructions, category, 
            cookingTime, servings, difficulty, price,
            dietaryTags, cuisine, allergens
        } = req.body;
        
        console.log("Recipe creation request received:", {
            userId: req.userId,
            title,
            hasFile: !!req.file
        });
        
        if (!title || !description || !ingredients || !instructions) {
            return res.status(400).json({ 
                success: false, 
                message: "Title, description, ingredients, and instructions are required." 
            });
        }

        let parsedIngredients, parsedInstructions;
        try {
            parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;
            
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

        let parsedDietaryTags = [];
        let parsedAllergens = [];
        
        try {
            parsedDietaryTags = dietaryTags ? JSON.parse(dietaryTags) : [];
            parsedAllergens = allergens ? JSON.parse(allergens) : [];
        } catch (parseError) {
            console.log("Optional fields parsing error:", parseError);
        }

        // ✅ FIX: Handle Cloudinary image upload correctly
        let imageUrl = null;
        if (req.file) {
            try {
                console.log("Uploading image to Cloudinary:", req.file.path);
                
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'foodhub/recipes',
                    resource_type: 'image'
                });
                
                // ✅ Store the secure_url from Cloudinary (full HTTPS URL)
                imageUrl = result.secure_url;
                
                console.log("✅ Cloudinary upload successful:", imageUrl);
                
                // Clean up temp file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Error removing temp file:", err);
                });
            } catch (err) {
                console.error("❌ Cloudinary upload error:", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Image upload failed: " + (err.message || "Unknown error") 
                });
            }
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        const isPublic = user.role === 'admin';

        const recipe = new Recipe({
            title,
            description,
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            category: category || '',
            cookingTime: cookingTime ? parseInt(cookingTime) : null,
            servings: servings ? parseInt(servings) : null,
            difficulty: difficulty || 'Easy',
            imageUrl, // ✅ This is now the full Cloudinary URL
            createdBy: req.userId,
            isPublic: isPublic,
            price: price ? parseFloat(price) : 0,
            dietaryTags: parsedDietaryTags,
            cuisine: cuisine || 'Filipino',
            allergens: parsedAllergens
        });

        await recipe.save();
        console.log("✅ Recipe saved successfully:", recipe._id);
        console.log("✅ Recipe image URL:", recipe.imageUrl);
        
        await recipe.populate('createdBy', 'name email');
        
        res.status(201).json({ success: true, recipe });
    } catch (error) {
        console.error('❌ Create recipe error:', error);
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

        const user = await User.findById(req.userId);
        const isOwner = recipe.createdBy.toString() === req.userId;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "You can only edit your own recipes" });
        }

        let ingredients = req.body.ingredients;
        let instructions = req.body.instructions;
        if (typeof ingredients === 'string') ingredients = JSON.parse(ingredients);
        if (typeof instructions === 'string') instructions = JSON.parse(instructions);

        // ✅ FIX: Handle Cloudinary image upload on update
        let imageUrl = recipe.imageUrl;
        if (req.file) {
            try {
                // Delete old image from Cloudinary if exists
                if (recipe.imageUrl && recipe.imageUrl.includes('cloudinary')) {
                    const publicId = recipe.imageUrl.split('/').slice(-2).join('/').split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                }
                
                // Upload new image
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'foodhub/recipes',
                    resource_type: 'image'
                });
                
                imageUrl = result.secure_url;
                
                // Clean up temp file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Error removing temp file:", err);
                });
            } catch (err) {
                console.error("Cloudinary upload error on update:", err);
            }
        }

        recipe.title = req.body.title || recipe.title;
        recipe.category = req.body.category || recipe.category;
        recipe.description = req.body.description || recipe.description;
        recipe.ingredients = ingredients || recipe.ingredients;
        recipe.instructions = instructions || recipe.instructions;
        recipe.cookingTime = req.body.cookingTime || recipe.cookingTime;
        recipe.servings = req.body.servings || recipe.servings;
        recipe.difficulty = req.body.difficulty || recipe.difficulty;
        recipe.imageUrl = imageUrl;
        
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
            .select('+imageUrl') // ✅ Ensure imageUrl is included
            .sort({ createdAt: -1 });
        
        console.log('Pending recipes found:', pendingRecipes.length);
        if (pendingRecipes.length > 0) {
            console.log('Sample recipe imageUrl:', pendingRecipes[0].imageUrl);
        }
        
        res.status(200).json({ success: true, recipes: pendingRecipes });
    } catch (error) {
        console.error('Error fetching pending recipes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update the moderateRecipe function
export const moderateRecipe = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, rejectionReason } = req.body;
        
        // ✅ FIX: Better validation for recipe ID
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid recipe ID" 
            });
        }

        const recipe = await Recipe.findById(id).populate('createdBy', 'name email');
        
        // ✅ FIX: If recipe not found, return 404 instead of crashing
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: "Recipe not found. It may have been deleted already." 
            });
        }

        const io = req.app.get('io');
        const connectedUsers = req.app.get('connectedUsers');

        if (action === 'approve') {
            recipe.shareStatus = 'approved';
            recipe.isShared = true;
            recipe.rejectionReason = undefined;
            
            io.emit('recipeApproved', { 
                recipeId: recipe._id,
                title: recipe.title || recipe.name,
                userId: recipe.createdBy._id || recipe.createdBy
            });
            
            const creatorUserId = (recipe.createdBy._id || recipe.createdBy).toString();
            const creatorSocketId = connectedUsers.get(creatorUserId);
            
            if (creatorSocketId) {
                io.to(creatorSocketId).emit('recipeApprovedPersonal', { 
                    recipeId: recipe._id,
                    title: recipe.title || recipe.name,
                    message: `Your recipe "${recipe.title}" has been approved and is now public!`
                });
            }
            
        } else if (action === 'reject') {
            recipe.shareStatus = 'rejected';
            recipe.isShared = false;
            recipe.rejectionReason = rejectionReason || 'No reason provided';
            
            io.emit('recipeRejected', { 
                recipeId: recipe._id,
                title: recipe.title || recipe.name,
                reason: rejectionReason,
                userId: recipe.createdBy._id || recipe.createdBy
            });
            
            const creatorUserId = (recipe.createdBy._id || recipe.createdBy).toString();
            const creatorSocketId = connectedUsers.get(creatorUserId);
            
            if (creatorSocketId) {
                io.to(creatorSocketId).emit('recipeRejectedPersonal', { 
                    recipeId: recipe._id,
                    title: recipe.title || recipe.name,
                    reason: rejectionReason,
                    message: `Your recipe "${recipe.title}" was not approved.`
                });
            }
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid action. Use 'approve' or 'reject'" 
            });
        }

        await recipe.save();
        res.json({ 
            success: true, 
            recipe,
            message: `Recipe ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
        });
    } catch (error) {
        console.error('Error in moderateRecipe:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to moderate recipe" 
        });
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