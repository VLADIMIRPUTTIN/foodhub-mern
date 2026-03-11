import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from '../utils/cloudinary.js';
import mongoose from "mongoose"; // ✅ ADD THIS IMPORT
import { sendPushToUser } from '../utils/webPush.js';

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
            title,
            category,
            description,
            ingredients,
            instructions,
            steps,
            price,
            servings,
            cookingTime,
            difficulty,
            dietaryTags,
            cuisine,
            allergens,
            // Add nutritional fields
            nutritionalInfo,
            dietCategory,
            servingSize,
            dietCategories
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
        let parsedDietCategories = [];
        
        try {
            parsedDietaryTags = dietaryTags ? JSON.parse(dietaryTags) : [];
            parsedAllergens = allergens ? JSON.parse(allergens) : [];
            if (Array.isArray(dietCategories)) {
                parsedDietCategories = dietCategories;
            } else if (typeof dietCategories === 'string' && dietCategories.trim()) {
                // accept JSON string or comma-separated
                try {
                    const maybeJson = JSON.parse(dietCategories);
                    parsedDietCategories = Array.isArray(maybeJson) ? maybeJson : [];
                } catch {
                    parsedDietCategories = dietCategories.split(',').map(s => s.trim()).filter(Boolean);
                }
            }
        } catch (parseError) {
            console.log("Optional fields parsing error:", parseError);
        }

        // ✅ Handle Cloudinary image upload correctly
        let imageUrl = null;
        if (req.file) {
            try {
                console.log("Uploading image to Cloudinary:", req.file.path);
                
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'foodhub/recipes',
                    resource_type: 'image'
                });
                
                // ✅ Store the FULL secure_url from Cloudinary
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
        
        const isPublic = user.role === 'admin'; // already computed sa itaas

        const newRecipe = new Recipe({
            title,
            name: title,
            category,
            description,
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            steps: parsedInstructions,
            imageUrl: imageUrl,
            createdBy: req.userId,
            price: price ? parseFloat(price) : undefined,
            servings: servings ? parseInt(servings) : undefined,
            cookingTime: cookingTime ? parseInt(cookingTime) : undefined,
            difficulty: difficulty || 'Easy',
            dietaryTags: parsedDietaryTags,
            cuisine: cuisine || 'Filipino',
            allergens: parsedAllergens,
            nutritionalInfo: nutritionalInfo ? JSON.parse(nutritionalInfo) : undefined,
            dietCategory: dietCategory || 'None',
            servingSize: servingSize || '1 serving',
            isPublic, // ADD THIS
            dietCategories: parsedDietCategories
        });

        await newRecipe.save();

        res.status(201).json({
            success: true,
            message: 'Recipe created successfully',
            recipe: newRecipe
        });
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Modified: Only return public recipes (admin-created)
export const getAllRecipes = async (req, res) => {
    try {
        const { diets } = req.query;
        const adminOnlyClause = { isPublic: true };
        let filter = adminOnlyClause;
        if (diets) {
            const list = Array.isArray(diets)
                ? diets
                : String(diets).split(',').map(s => s.trim()).filter(Boolean);
            filter = {
                $and: [
                    adminOnlyClause,
                    {
                        $or: [
                            { dietCategories: { $in: list } },              // new multi-select field
                            { dietCategory: { $in: list } },                // legacy single
                            { dietaryTags: { $in: list.map(s => s.toLowerCase()) } } // tags fallback
                        ]
                    }
                ]
            };
        }
        const recipes = await Recipe.find(filter)
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
        console.log("📝 Update recipe request received:", req.params.id);
        console.log("📦 Request body:", req.body);
        console.log("📸 Has file:", !!req.file);

        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid recipe ID format" });
        }

        const recipe = await Recipe.findById(id);
        if (!recipe) {
            return res.status(404).json({ success: false, message: "Recipe not found" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const isOwner = recipe.createdBy && recipe.createdBy.toString() === req.userId;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ success: false, message: "You can only edit your own recipes or must be an admin" });
        }

        // ✅ Handle image upload to Cloudinary
        let imageUrl = recipe.imageUrl; // Keep existing image by default
        
        if (req.file) {
            try {
                console.log("📤 Uploading image to Cloudinary:", req.file.path);
                
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'foodhub/recipes',
                    resource_type: 'image',
                    transformation: [
                        { width: 800, height: 600, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                
                imageUrl = result.secure_url;
                console.log("✅ Cloudinary upload successful:", imageUrl);
                
                // Delete old image from Cloudinary if it exists
                if (recipe.imageUrl && recipe.imageUrl.includes('cloudinary.com')) {
                    try {
                        // Extract public_id from the Cloudinary URL
                        // Example: https://res.cloudinary.com/duceirdeu/image/upload/v1234567890/foodhub/recipes/abc123.jpg
                        const urlParts = recipe.imageUrl.split('/');
                        const uploadIndex = urlParts.indexOf('upload');
                        if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
                            // Get everything after 'upload/' and remove file extension
                            const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/');
                            const publicId = publicIdWithVersion.split('.')[0].replace(/^v\d+\//, '');
                            
                            console.log("🗑️ Attempting to delete old image:", publicId);
                            await cloudinary.uploader.destroy(publicId);
                            console.log("✅ Old image deleted from Cloudinary");
                        }
                    } catch (deleteError) {
                        console.error("⚠️ Error deleting old image:", deleteError.message);
                        // Don't fail the update if old image deletion fails
                    }
                }
                
                // Clean up temp file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("⚠️ Error removing temp file:", err);
                });
            } catch (uploadError) {
                console.error("❌ Cloudinary upload error:", uploadError);
                
                // Clean up temp file even on error
                if (req.file && req.file.path) {
                    fs.unlink(req.file.path, (err) => {
                        if (err) console.error("⚠️ Error removing temp file:", err);
                    });
                }
                
                return res.status(500).json({ 
                    success: false, 
                    message: "Image upload failed: " + uploadError.message 
                });
            }
        }

        // ✅ Parse ingredients and instructions safely
        let parsedIngredients = recipe.ingredients;
        let parsedInstructions = recipe.instructions;
        let parsedDietaryTags = recipe.dietaryTags || [];
        
        try {
            if (req.body.ingredients) {
                parsedIngredients = typeof req.body.ingredients === 'string' 
                    ? JSON.parse(req.body.ingredients) 
                    : req.body.ingredients;
            }
            
            if (req.body.instructions) {
                parsedInstructions = typeof req.body.instructions === 'string' 
                    ? JSON.parse(req.body.instructions) 
                    : req.body.instructions;
            }

            if (req.body.dietaryTags) {
                parsedDietaryTags = typeof req.body.dietaryTags === 'string'
                    ? JSON.parse(req.body.dietaryTags)
                    : req.body.dietaryTags;
            }
        } catch (parseError) {
            console.error("❌ Parse error:", parseError);
            return res.status(400).json({ 
                success: false, 
                message: "Invalid data format: " + parseError.message 
            });
        }

        // ✅ Build update data object safely
        const updateData = {
            imageUrl: imageUrl, // Always include the image URL (either new or existing)
        };

        // Only update fields that are provided
        if (req.body.title) {
            updateData.title = req.body.title;
            updateData.name = req.body.title; // Keep name in sync with title
        }
        if (req.body.category) updateData.category = req.body.category;
        if (req.body.description) updateData.description = req.body.description;
        if (parsedIngredients && parsedIngredients.length > 0) updateData.ingredients = parsedIngredients;
        if (parsedInstructions && parsedInstructions.length > 0) {
            updateData.instructions = parsedInstructions;
            updateData.steps = parsedInstructions;
        }
        if (req.body.price !== undefined && req.body.price !== '') {
            updateData.price = parseFloat(req.body.price);
        }
        if (req.body.servings !== undefined) updateData.servings = parseInt(req.body.servings);
        if (req.body.cookingTime !== undefined && req.body.cookingTime !== '') {
            updateData.cookingTime = parseInt(req.body.cookingTime);
        }
        if (req.body.difficulty) updateData.difficulty = req.body.difficulty;
        if (parsedDietaryTags) updateData.dietaryTags = parsedDietaryTags;
        if (req.body.cuisine) updateData.cuisine = req.body.cuisine;

        console.log("🔄 Updating recipe with data:", {
            ...updateData,
            imageUrl: imageUrl ? 'CLOUDINARY_URL' : 'NO_IMAGE'
        });

        const updatedRecipe = await Recipe.findByIdAndUpdate(
            id, 
            updateData, 
            { 
                new: true,
                runValidators: true 
            }
        ).populate('createdBy', 'name email');

        if (!updatedRecipe) {
            return res.status(404).json({ 
                success: false, 
                message: "Recipe not found after update" 
            });
        }

        console.log("✅ Recipe updated successfully:", updatedRecipe._id);
        console.log("✅ Updated imageUrl:", updatedRecipe.imageUrl);

        res.status(200).json({ 
            success: true, 
            message: "Recipe updated successfully", 
            recipe: updatedRecipe 
        });
    } catch (error) {
        console.error('❌ Update recipe error:', error);
        console.error('Error stack:', error.stack);
        
        // Clean up temp file on error
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("⚠️ Error removing temp file:", err);
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: "Server error: " + error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

            // Push notification to recipe creator
            sendPushToUser(recipe.createdBy._id || recipe.createdBy, {
                title: '✅ Recipe Approved!',
                body: `Your recipe "${recipe.title || recipe.name}" has been approved and is now in the community!`,
                icon: '/Img/logo.png',
                url: '/community',
            }).catch(err => console.error('Push to user failed:', err));

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

            // Push notification to recipe creator
            sendPushToUser(recipe.createdBy._id || recipe.createdBy, {
                title: '❌ Recipe Not Approved',
                body: `Your recipe "${recipe.title || recipe.name}" was not approved. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`,
                icon: '/Img/logo.png',
                url: '/profile',
            }).catch(err => console.error('Push to user failed:', err));

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