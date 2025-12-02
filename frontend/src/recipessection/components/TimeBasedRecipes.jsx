import { Recipe } from "../models/recipe.model.js";
import { User } from "../models/user.model.js";
import multer from "multer";
import path from "path";framer-motion';
import fs from "fs";ecipes.scss';
import cloudinary from '../utils/cloudinary.js';/imageUrls';
import { useAuthStore } from '../../store/authStore';
// Update the file upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {[]);
        const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : './uploads/temp';
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);= useState(null);
    },nst { user } = useAuthStore();
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }/ Function to check if recipe matches user's dietary preferences and allergies
}); const matchesUserPreferences = (recipe) => {
        if (!user || !user.hasCompletedOnboarding) return true;
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);yPreferences && user.dietaryPreferences.length > 0) {
    } else {const hasMatchingDietary = user.dietaryPreferences.some(pref => 
        cb(new Error('Only image files are allowed!'), false);des(pref)
    }       );
};          if (!hasMatchingDietary) return false;
        }
const upload = multer({ 
    storage, eck allergies - exclude recipes containing user's allergens
    fileFilter,r.allergies && user.allergies.length > 0) {
    limits: { fileSize: 5 * 1024 * 1024 }rgies.some(allergy => 
});             recipe.allergens && recipe.allergens.some(allergen => 
                    allergen.toLowerCase().includes(allergy.toLowerCase())
export const uploadMiddleware = upload.single('image');
                recipe.ingredients && recipe.ingredients.some(ingredient => 
export const createRecipe = async (req, res) => {' && 
    try {           ingredient.toLowerCase().includes(allergy.toLowerCase())
        const { )
            title,
            category,lergen) return false;
            description,
            ingredients,
            instructions,d cuisines
            steps,referredCuisines && user.preferredCuisines.length > 0) {
            price,cipe.cuisine && !user.preferredCuisines.includes(recipe.cuisine)) {
            servings,n false;
            cookingTime,
            difficulty,
            dietaryTags,
            cuisine,
            allergens,
            // Add nutritional fields
            nutritionalInfo,the top of the component (around line 25):
            dietCategory,recipe) => {
            servingSize,peImageUrl(recipe?.imageUrl);
            dietCategories
        } = req.body;
        ffect(() => {
        console.log("Recipe creation request received:", {
            userId: req.userId,e = () => {
            title,currentHour = new Date().getHours();
            hasFile: !!req.file
        }); // Time ranges for different meals
            if (currentHour >= 5 && currentHour < 11) {
        if (!title || !description || !ingredients || !instructions) {
            return res.status(400).json({ & currentHour < 15) {
                success: false, 
                message: "Title, description, ingredients, and instructions are required." 
            }); return 'Snack';
        }   } else {
                return 'Dinner';
        let parsedIngredients, parsedInstructions;
        try {
            parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
            parsedInstructions = typeof instructions === 'string' ? JSON.parse(instructions) : instructions;
            ealType(determinedMealType);
            if (!Array.isArray(parsedIngredients) || !Array.isArray(parsedInstructions)) {
                throw new Error("Ingredients and instructions must be arrays");
            } fetchRecipesByMealType = async () => {
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            return res.status(400).json({ 
                success: false, import.meta.env.MODE === "development"
                message: "Invalid ingredients or instructions format." 
            });     : "";
        }       
                const response = await axios.get(`${baseURL}/api/recipes`);
        let parsedDietaryTags = [];;
        let parsedAllergens = [];
        let parsedDietCategories = [];ess && response.data.recipes) {
                    allRecipes = response.data.recipes;
        try {   } else if (Array.isArray(response.data)) {
            parsedDietaryTags = dietaryTags ? JSON.parse(dietaryTags) : [];
            parsedAllergens = allergens ? JSON.parse(allergens) : [];
            if (Array.isArray(dietCategories)) {
                parsedDietCategories = dietCategories;
            } else if (typeof dietCategories === 'string' && dietCategories.trim()) {
                // accept JSON string or comma-separated) - case insensitive match
                try {ilteredRecipes = allRecipes.filter(recipe => 
                    const maybeJson = JSON.parse(dietCategories);e() === determinedMealType.toLowerCase()
                    parsedDietCategories = Array.isArray(maybeJson) ? maybeJson : [];
                } catch {
                    parsedDietCategories = dietCategories.split(',').map(s => s.trim()).filter(Boolean);
                }f (user && user.hasCompletedOnboarding) {
            }       // First, try to find recipes that match both time and preferences
        } catch (parseError) {redRecipes = filteredRecipes.filter(matchesUserPreferences);
            console.log("Optional fields parsing error:", parseError);
        }           // Sort by user's preferred cuisines
                    preferredRecipes.sort((a, b) => {
        // ✅ Handle Cloudinary image upload correctlye = user.preferredCuisines && 
        let imageUrl = null;user.preferredCuisines.includes(a.cuisine);
        if (req.file) { const bMatchesPreferredCuisine = user.preferredCuisines && 
            try {           user.preferredCuisines.includes(b.cuisine);
                console.log("Uploading image to Cloudinary:", req.file.path);
                        if (aMatchesPreferredCuisine && !bMatchesPreferredCuisine) return -1;
                const result = await cloudinary.uploader.upload(req.file.path, {e) return 1;
                    folder: 'foodhub/recipes',
                    resource_type: 'image'
                }); 
                    // If we have enough matching recipes, use those
                // ✅ Store the FULL secure_url from Cloudinary
                imageUrl = result.secure_url;ecipes.slice(0, 4));
                    } 
                console.log("✅ Cloudinary upload successful:", imageUrl);ill the spots
                    else {
                // Clean up temp fileerredTimeBasedRecipes = filteredRecipes.filter(
                fs.unlink(req.file.path, (err) => {references(recipe)
                    if (err) console.error("Error removing temp file:", err);
                });     
            } catch (err) {Recipes([
                console.error("❌ Cloudinary upload error:", err);
                return res.status(500).json({ eBasedRecipes
                    success: false, ));
                    message: "Image upload failed: " + (err.message || "Unknown error") 
                });lse {
            }       // For users without preferences, just show time-based recipes
        }           setRecipes(filteredRecipes.slice(0, 4));
                }
        const user = await User.findById(req.userId);
        if (!user) {f we still don't have enough recipes, use any recipes as fallback
            return res.status(401).json({ {
                success: false, Recipes = allRecipes;
                message: "User not found" mpletedOnboarding) {
            });         fallbackRecipes = allRecipes.filter(matchesUserPreferences);
        }           }
                    setRecipes(fallbackRecipes.slice(0, 4));
        const isPublic = user.role === 'admin'; // already computed sa itaas
            } catch (error) {
        const newRecipe = new Recipe({etching time-based recipes:', error);
            title,tError('Failed to load recipes. Please try again later.');
            name: title,es([]);
            category, {
            description,ng(false);
            ingredients: parsedIngredients,
            instructions: parsedInstructions,
            steps: parsedInstructions,
            imageUrl: imageUrl,);
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
            isPublic, // ADD THIS;
            dietCategories: parsedDietCategoriesour < 17) {
        }); return 'Good Afternoon';
        } else {
        await newRecipe.save();g';
        }
        res.status(201).json({
            success: true,
            message: 'Recipe created successfully',
            recipe: newRecipe {
        });tch(mealType.toLowerCase()) {
    } catch (error) {akfast': return "bx bx-coffee";
        console.error('Error creating recipe:', error);
        res.status(500).json({urn "bx bx-restaurant";
            success: false,eturn "bx bx-cookie";
            message: 'Server error',ood-menu";
            error: error.message
        });
    }
};  return (
        <div className="time-based-recipes">
// Modified: Only return public recipes (admin-created)
export const getAllRecipes = async (req, res) => {
    try {           initial={{ opacity: 0, y: 20 }}
        const recipes = await Recipe.find({ ty: 1, y: 0 }}
            $or: [
                { isPublic: true },
                { isShared: true, shareStatus: 'approved' }<span className="greeting">{getGreeting()}!</span> 
            ]gestion">
        }) {user && user.hasCompletedOnboarding 
        .populate('createdBy', 'name email')
        .select('+imageUrl') // ✅ Explicitly include imageUrl      : `Here are ${mealType} ideas for you`
        .sort({ createdAt: -1 }); }
        
        res.status(200).json({ success: true, recipes });ion.h2>
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};ition={{ duration: 0.6, delay: 0.2 }}

export const getRecipesByUser = async (req, res) => {   <i className={getMealIcon()}></i>
    try {  </motion.div>
        const recipes = await Recipe.find({ createdBy: req.userId })   </div>
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, recipes });recipes-loading">
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });p>Finding {mealType.toLowerCase()} ideas for you...</p>
    }
};       ) : error ? (
              <div className="time-recipes-error">
// New function: Get all recipes for admin dashboard                    <i className="bx bx-error-circle"></i>
export const getAllRecipesForAdmin = async (req, res) => {
    try {           <button onClick={() => window.location.reload()}>Try Again</button>
        const recipes = await Recipe.find()
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });recipes-grid">
        res.status(200).json({ success: true, recipes });
    } catch (error) {   <motion.div 
        res.status(500).json({ success: false, message: error.message });
    }                       className="time-recipe-card"
};                          onClick={() => handleRecipeClick(recipe._id)}
                            initial={{ opacity: 0, y: 20 }}
export const updateRecipe = async (req, res) => {: 0 }}
    try {elay: index * 0.1 }}
        const { id } = req.params;                   whileHover={{ y: -8, scale: 1.02 }}
        
        if (!mongoose.Types.ObjectId.isValid(id)) {-recipe-image">
            return res.status(400).json({ success: false, message: "Invalid recipe ID format" });
        }pe)} 
               alt={recipe.title || recipe.name} 
        const recipe = await Recipe.findById(id);
        if (!recipe) {                                   e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            return res.status(404).json({ success: false, message: "Recipe not found" });                                  }}
        }                                />
ime-recipe-overlay"></div>
        const user = await User.findById(req.userId);                   </div>
        if (!user) {lassName="time-recipe-content">
            return res.status(401).json({ success: false, message: "User not found" });                        <h3>{recipe.title || recipe.name}</h3>
        }recipe-desc">{recipe.description}</p>

        const isOwner = recipe.createdBy && recipe.createdBy.toString() === req.userId;                           <div className="time-recipe-meta">
        const isAdmin = user.role === 'admin';                                        <i className="bx bx-time"></i>
cipe.cookingTime} mins</span>
        if (!isOwner && !isAdmin) {              </div>
            return res.status(403).json({ success: false, message: "You can only edit your own recipes or must be an admin" });
        }                       
                                {/* Show preference match indicators */}
        // ✅ Handle image upload to CloudinaryletedOnboarding && matchesUserPreferences(recipe) && (
        let imageUrl = recipe.imageUrl; // Keep existing image by default                <div className="preference-match">
        
        if (req.file) {                               <span>Matches your preferences</span>
            try {                                    </div>
                console.log("Uploading updated image to Cloudinary:", req.file.path);
                
                // Upload new image                        </motion.div>
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'foodhub/recipes',
                    resource_type: 'image'   ) : (
                });                <div className="no-time-recipes">
                -icon">
                // ✅ Store the FULL secure_url
                imageUrl = result.secure_url;            </div>
                console.log("✅ Cloudinary upload successful:", imageUrl);>No {mealType} Recipes Available</h3>
                   <p>Check back later or try browsing all recipes!</p>
                // Delete old image from Cloudinary if it exists
                if (recipe.imageUrl && recipe.imageUrl.includes('cloudinary.com')) {        className="browse-all-btn" 
                    try { => navigate('/recipes')}
                        // Extract public_id from URL
                        const urlParts = recipe.imageUrl.split('/');
                        const publicIdWithExt = urlParts.slice(-2).join('/');
                        const publicId = publicIdWithExt.split('.')[0];iv>
                        await cloudinary.uploader.destroy(publicId);
                        console.log("✅ Old image deleted from Cloudinary");
                    } catch (deleteError) {
                        console.error("❌ Error deleting old image:", deleteError);
                    }    <button 
                }
                
                // Clean up temp file
                fs.unlink(req.file.path, (err) => {ipes</span>
                    if (err) console.error("Error removing temp file:", err);
                });
            } catch (err) {
                console.error("❌ Cloudinary upload error:", err);
                return res.status(500).json({ 
                    success: false, 
                    message: "Image upload failed: " + err.message 
                });
            }meBasedRecipes;        }        // Parse ingredients and instructions        let parsedIngredients, parsedInstructions;        try {            parsedIngredients = typeof req.body.ingredients === 'string'                 ? JSON.parse(req.body.ingredients)                 : req.body.ingredients;            parsedInstructions = typeof req.body.instructions === 'string'                 ? JSON.parse(req.body.instructions)                 : req.body.instructions;        } catch (parseError) {            return res.status(400).json({                 success: false,                 message: "Invalid ingredients or instructions format"             });        }        // Update recipe fields        const updateData = {            title: req.body.title || recipe.title,            name: req.body.title || req.body.name || recipe.name,            category: req.body.category || recipe.category,            description: req.body.description || recipe.description,            ingredients: parsedIngredients || recipe.ingredients,            instructions: parsedInstructions || recipe.instructions,            steps: parsedInstructions || recipe.steps,            imageUrl: imageUrl, // ✅ Use Cloudinary URL (full HTTPS URL)            price: req.body.price ? parseFloat(req.body.price) : recipe.price,            servings: req.body.servings ? parseInt(req.body.servings) : recipe.servings,            cookingTime: req.body.cookingTime ? parseInt(req.body.cookingTime) : recipe.cookingTime,            difficulty: req.body.difficulty || recipe.difficulty,            dietaryTags: req.body.dietaryTags || recipe.dietaryTags,            cuisine: req.body.cuisine || recipe.cuisine,        };        const updatedRecipe = await Recipe.findByIdAndUpdate(id, updateData, { new: true })            .populate('createdBy', 'name email');        res.status(200).json({             success: true,             message: "Recipe updated successfully",             recipe: updatedRecipe         });    } catch (error) {        console.error('Update recipe error:', error);        res.status(500).json({             success: false,             message: "Server error",             error: error.message         });    }    try {        const pendingRecipes = await Recipe.find({ shareStatus: 'pending' })            .populate('createdBy', 'name email')            .select('+imageUrl') // ✅ Ensure imageUrl is included            .sort({ createdAt: -1 });                console.log('Pending recipes found:', pendingRecipes.length);        if (pendingRecipes.length > 0) {            console.log('Sample recipe imageUrl:', pendingRecipes[0].imageUrl);        }                res.status(200).json({ success: true, recipes: pendingRecipes });    } catch (error) {        console.error('Error fetching pending recipes:', error);        res.status(500).json({ success: false, message: error.message });    }};// Update the moderateRecipe functionexport const moderateRecipe = async (req, res) => {    try {        const { id } = req.params;        const { action, rejectionReason } = req.body;                // ✅ FIX: Better validation for recipe ID        if (!id || id === 'undefined' || id === 'null') {            return res.status(400).json({                 success: false,                 message: "Invalid recipe ID"             });        }        const recipe = await Recipe.findById(id).populate('createdBy', 'name email');                // ✅ FIX: If recipe not found, return 404 instead of crashing        if (!recipe) {            return res.status(404).json({                 success: false,                 message: "Recipe not found. It may have been deleted already."             });        }        const io = req.app.get('io');        const connectedUsers = req.app.get('connectedUsers');        if (action === 'approve') {            recipe.shareStatus = 'approved';            recipe.isShared = true;            recipe.rejectionReason = undefined;                        io.emit('recipeApproved', {                 recipeId: recipe._id,                title: recipe.title || recipe.name,                userId: recipe.createdBy._id || recipe.createdBy            });                        const creatorUserId = (recipe.createdBy._id || recipe.createdBy).toString();            const creatorSocketId = connectedUsers.get(creatorUserId);                        if (creatorSocketId) {                io.to(creatorSocketId).emit('recipeApprovedPersonal', {                     recipeId: recipe._id,                    title: recipe.title || recipe.name,                    message: `Your recipe "${recipe.title}" has been approved and is now public!`                });            }                    } else if (action === 'reject') {            recipe.shareStatus = 'rejected';            recipe.isShared = false;            recipe.rejectionReason = rejectionReason || 'No reason provided';                        io.emit('recipeRejected', {                 recipeId: recipe._id,                title: recipe.title || recipe.name,                reason: rejectionReason,                userId: recipe.createdBy._id || recipe.createdBy            });                        const creatorUserId = (recipe.createdBy._id || recipe.createdBy).toString();            const creatorSocketId = connectedUsers.get(creatorUserId);                        if (creatorSocketId) {                io.to(creatorSocketId).emit('recipeRejectedPersonal', {                     recipeId: recipe._id,                    title: recipe.title || recipe.name,                    reason: rejectionReason,                    message: `Your recipe "${recipe.title}" was not approved.`                });            }        } else {            return res.status(400).json({                 success: false,                 message: "Invalid action. Use 'approve' or 'reject'"             });        }        await recipe.save();        res.json({             success: true,             recipe,            message: `Recipe ${action === 'approve' ? 'approved' : 'rejected'} successfully`         });    } catch (error) {        console.error('Error in moderateRecipe:', error);        res.status(500).json({             success: false,             message: error.message || "Failed to moderate recipe"         });    }};// Add this new function after the existing functionsexport const unshareRecipe = async (req, res) => {    try {        const { id } = req.params;        const recipe = await Recipe.findById(id);        if (!recipe) {            return res.status(404).json({ success: false, message: "Recipe not found" });        }        // Check if user owns this recipe        if (recipe.createdBy.toString() !== req.userId) {            return res.status(403).json({ success: false, message: "You can only unshare your own recipes" });        }        // Reset sharing status        recipe.shareStatus = 'not_shared';        recipe.isShared = false;        recipe.rejectionReason = undefined;        await recipe.save();        res.json({ success: true, recipe, message: "Recipe removed from community" });    } catch (error) {        console.error('Error unsharing recipe:', error);        res.status(500).json({ success: false, message: error.message });    }};