import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './CreateRecipe.scss';

const categories = [
    'Appetizer', 'Main Course', 'Dessert', 'Breakfast', 
    'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup', 'Salad'
];

const units = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'l', 'pieces'];

const CreateRecipe = ({ onRecipeSaved }) => {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState([{ amount: '', unit: '', name: '' }]);
    const [steps, setSteps] = useState([{ instruction: '', details: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [allIngredients, setAllIngredients] = useState([]);
    const [activeTab, setActiveTab] = useState('basic');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [price, setPrice] = useState('');
    const [servings, setServings] = useState('');
    const [isGeneratingIngredients, setIsGeneratingIngredients] = useState(false);
    const [suggestionSuccess, setSuggestionSuccess] = useState("");
    const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
    const [stepSuggestionSuccess, setStepSuggestionSuccess] = useState("");

    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const baseURL = import.meta.env.MODE === "development" 
                    ? "http://localhost:5000" 
                    : "";
                const res = await axios.get(`${baseURL}/api/ingredients`);
                setAllIngredients(res.data.ingredients);
            } catch {
                setAllIngredients([]);
            }
        };
        fetchIngredients();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleIngredientChange = (idx, field, value) => {
        const newIngredients = [...ingredients];
        newIngredients[idx][field] = value;
        setIngredients(newIngredients);
    };

    const addIngredient = () => setIngredients([...ingredients, { amount: '', unit: '', name: '' }]);
    const removeIngredient = (idx) => setIngredients(ingredients.filter((_, i) => i !== idx));

    const handleStepChange = (idx, field, value) => {
        const newSteps = [...steps];
        newSteps[idx][field] = value;
        setSteps(newSteps);
    };

    const addStep = () => setSteps([...steps, { instruction: '', details: '' }]);
    const removeStep = (idx) => setSteps(steps.filter((_, i) => i !== idx));

    const resetForm = () => {
        setName('');
        setCategory('');
        setDescription('');
        setIngredients([{ amount: '', unit: '', name: '' }]);
        setSteps([{ instruction: '', details: '' }]);
        setImage(null);
        setImagePreview(null);
        setActiveTab('basic');
        setPrice('');
        setServings('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('title', name);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('ingredients', JSON.stringify(ingredients));
            formData.append('instructions', JSON.stringify(steps));
            if (image) {
                formData.append('image', image);
            }
            formData.append('price', price);
            formData.append('servings', servings);

            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
            
            const response = await axios.post(
                `${baseURL}/api/recipes`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setSuccess('Recipe created successfully!');
                resetForm();
                
                if (onRecipeSaved) {
                    onRecipeSaved();
                }
                
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            console.error('Create recipe error:', err);
            if (err.response?.status === 401) {
                setError('You need to be logged in to create recipes');
            } else if (err.response?.status === 400) {
                setError('Invalid recipe data. Please check all required fields');
            } else {
                setError(err.response?.data?.message || 'Failed to create recipe');
            }
            setTimeout(() => setError(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    // Updated function to use API Ninjas through backend proxy
    const generateIngredientSuggestions = async () => {
        if (!name.trim()) {
            setError("Please enter a recipe name first");
            return;
        }
        
        setIsGeneratingIngredients(true);
        setError("");
        setSuggestionSuccess("");
        
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
            
            console.log("Requesting ingredients for:", name);
            
            // Call the backend proxy endpoint for API Ninjas
            const response = await axios.post(
                `${baseURL}/api/vision/fetch-ninjas-recipe`,
                { 
                    query: name 
                },
                { 
                    withCredentials: true,
                    timeout: 20000
                }
            );
            
            console.log("API Ninjas response:", response.data);
            
            // Check if we got recipes from API Ninjas
            if (response.data.success && response.data.recipes && 
                Array.isArray(response.data.recipes) && response.data.recipes.length > 0) {
              
                // Find best matching recipe
                const recipes = response.data.recipes;
                let bestRecipe = recipes[0];
                
                if (recipes.length > 1) {
                    const lowerName = name.toLowerCase();
                    const betterMatch = recipes.find(recipe => 
                        recipe.title.toLowerCase().includes(lowerName)
                    );
                    if (betterMatch) bestRecipe = betterMatch;
                }
                
                console.log("Selected recipe:", bestRecipe.title);
                
                // Parse ingredients from the recipe
                if (bestRecipe.ingredients) {
                    const ingredientsList = parseIngredientsFromText(bestRecipe.ingredients);
                    console.log("Parsed ingredients:", ingredientsList);
                    
                    // Apply the ingredients to the form
                    if (ingredientsList && ingredientsList.length > 0) {
                        setIngredients(ingredientsList);
                        setSuggestionSuccess(`Found ${ingredientsList.length} ingredients for "${bestRecipe.title}" from API Ninjas!`);
                        setActiveTab('ingredients');
                        return;
                    }
                }
            }
            
            // If no results from API Ninjas, fallback to existing method
            console.log("No ingredients found from API Ninjas, trying fallback method");
            
            // Try the database search method
            const dbResponse = await axios.post(
                `${baseURL}/api/vision/suggest-ingredients`,
                { 
                    recipeName: name,
                    category: category,
                    description: description
                },
                { 
                    withCredentials: true,
                    timeout: 30000
                }
            );
            
            if (dbResponse.data.success && dbResponse.data.ingredients && dbResponse.data.ingredients.length > 0) {
                setIngredients(dbResponse.data.ingredients);
                setSuggestionSuccess(`Generated ${dbResponse.data.ingredients.length} ingredients from database search`);
                setActiveTab('ingredients');
            } else {
                setError("Could not find or generate ingredients. Using common ingredients instead.");
                useFallbackIngredients();
            }
            
        } catch (err) {
            console.error("Error generating ingredients:", err);
            
            let errorMessage = "Failed to generate ingredients";
            
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                errorMessage = "Network error. Using common ingredients instead.";
                useFallbackIngredients();
            } else {
                errorMessage = err.message || "Error fetching ingredients";
            }
            
            setError(errorMessage);
        } finally {
            setIsGeneratingIngredients(false);
        }
    };

    const useFallbackIngredients = () => {
        // Get fallback ingredients based on the recipe name
        const fallbackIngredients = getFallbackIngredientsForRecipe(name);
        
        // Update ingredients state with fallback ingredients
        setIngredients(fallbackIngredients);
        
        // Set success message but indicate it's using fallback
        setSuggestionSuccess(`Added ${fallbackIngredients.length} common ingredients for "${name}" (offline mode)`);
        
        // Switch to ingredients tab
        setActiveTab('ingredients');
        
        setIsGeneratingIngredients(false);
    };

    const processIngredientsResponse = async (ingredientsList) => {
        // Get existing ingredients from system
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            const existingIngredientsRes = await axios.get(`${baseURL}/api/ingredients`);
            const existingIngredients = existingIngredientsRes.data.ingredients || [];
            
            console.log("Existing ingredients:", existingIngredients.length);
            
            // Track missing ingredients that need to be created
            const missingIngredients = [];
            
            // Create new recipe ingredients array
            const newIngredients = ingredientsList.map(ing => {
                // Ensure the unit exists in our units array
                const validUnit = units.includes(ing.unit) ? ing.unit : 'pieces';
                
                return {
                    name: ing.name,
                    amount: ing.amount || '1',
                    unit: validUnit
                };
            });
            
            console.log("Missing ingredients to add:", missingIngredients);
            
            // Add missing ingredients to system
            if (missingIngredients.length > 0) {
                try {
                    const addedIngredients = [];
                    
                    // Add each missing ingredient to the database
                    for (const name of missingIngredients) {
                        try {
                            const addResponse = await axios.post(
                                `${baseURL}/api/ingredients`,
                                { name },
                                { withCredentials: true }
                            );
                            
                            if (addResponse.data.success) {
                                addedIngredients.push(name);
                                console.log("Added new ingredient to database:", name);
                            }
                        } catch (err) {
                            if (err.response?.status === 400 && 
                                err.response?.data?.message === "Ingredient already exists") {
                                console.log(`Ingredient ${name} already exists`);
                            } else {
                                console.warn(`Error adding ingredient ${name}:`, err.message);
                            }
                        }
                    }
                    
                    // Refresh ingredients list to include newly added ingredients
                    const refreshRes = await axios.get(`${baseURL}/api/ingredients`);
                    if (refreshRes.data.success) {
                        setAllIngredients(refreshRes.data.ingredients);
                        
                        // Update success message to include added ingredients
                        if (addedIngredients.length > 0) {
                            setSuggestionSuccess(`Generated ${newIngredients.length} ingredients for "${name}" (Added ${addedIngredients.length} new ingredients to system)`);
                        }
                    }
                } catch (addErr) {
                    console.error("Error adding ingredients:", addErr);
                    // Continue anyway as we have the ingredient names
                }
            }
            
            // Update ingredients state
            setIngredients(newIngredients);
            
            // Set success message if no ingredients were added
            if (missingIngredients.length === 0) {
                setSuggestionSuccess(`Generated ${newIngredients.length} ingredients for "${name}"`);
            }
            
            // Switch to ingredients tab
            setActiveTab('ingredients');
        } catch (error) {
            console.error("Error processing ingredients:", error);
            useFallbackIngredients();
        }
    };

    const getFallbackIngredientsForRecipe = (recipeName) => {
        // Instead of hardcoded recipe-specific ingredients, use ingredients from the system
        // with some basic defaults in case the system has no ingredients
        
        const commonIngredients = [
            { name: "Salt", amount: "1", unit: "tsp" },
            { name: "Pepper", amount: "1/2", unit: "tsp" },
            { name: "Garlic", amount: "3", unit: "pieces" },
            { name: "Onion", amount: "1", unit: "piece" },
            { name: "Vegetable oil", amount: "2", unit: "tbsp" },
            { name: "Water", amount: "1", unit: "cups" }
        ];
        
        // If we have ingredients in our system, use those instead of hardcoded ones
        if (allIngredients && allIngredients.length > 0) {
            // Select up to 10 random ingredients from our system
            const randomIngredients = [...allIngredients]
                .sort(() => 0.5 - Math.random())
                .slice(0, 10)
                .map(ing => ({
                    name: ing.name,
                    amount: "1", 
                    unit: "piece"
                }));
            
            // If we have enough ingredients in our system, return those
            if (randomIngredients.length >= 5) {
                return randomIngredients;
            }
            
            // Otherwise, combine with some common ingredients
            return [...randomIngredients, ...commonIngredients.slice(0, 6 - randomIngredients.length)];
        }
        
        // If no ingredients in system, return common basics
        return commonIngredients;
    };

    // Add this function after your other generator functions
    const generateStepSuggestions = async () => {
        if (!name.trim()) {
            setError("Please enter a recipe name first");
            return;
        }
        
        if (ingredients.length < 2 || !ingredients[0].name) {
            setError("Please add at least 2 ingredients first");
            return;
        }
        
        setIsGeneratingSteps(true);
        setError("");
        setStepSuggestionSuccess("");
        
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
            
            console.log("Requesting preparation steps for:", name);
            
            // Filter out empty ingredients
            const validIngredients = ingredients.filter(ing => 
                ing.name && ing.name.trim() && ing.amount && ing.unit
            );
            
            if (validIngredients.length < 2) {
                setError("Please add at least 2 complete ingredients");
                setIsGeneratingSteps(false);
                return;
            }
            
            // Format ingredients for the API
            const ingredientsList = validIngredients.map(ing => 
                `${ing.amount} ${ing.unit} ${ing.name}`
            );
            
            // Call the API to generate steps
            const response = await axios.post(
                `${baseURL}/api/vision/suggest-steps`,
                { 
                    recipeName: name,
                    ingredients: ingredientsList,
                    category: category || 'Main Course'
                },
                { 
                    withCredentials: true,
                    timeout: 30000
                }
            );
            
            console.log("AI response for steps:", response.data);
            
            if (response.data.success && response.data.steps && response.data.steps.length > 0) {
                // Update steps with AI suggestions
                setSteps(response.data.steps);
                setStepSuggestionSuccess(`Generated ${response.data.steps.length} preparation steps for "${name}"`);
            } else {
                // Fall back to generic steps
                useGenericSteps();
            }
        } catch (err) {
            console.error("Error generating steps:", err);
            
            let errorMessage = "Failed to generate preparation steps";
            
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                errorMessage = "Cannot connect to server. Using generic steps instead.";
                useGenericSteps();
            } else if (err.response) {
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
                useGenericSteps();
            } else {
                errorMessage = err.message;
                useGenericSteps();
            }
            
            setError(errorMessage);
        } finally {
            setIsGeneratingSteps(false);
        }
    };

    // Add this fallback function for generic steps
    const useGenericSteps = () => {
        const genericSteps = [
            {
                instruction: "Prepare ingredients",
                details: "Gather and measure all ingredients. Wash, peel, and chop vegetables as needed."
            },
            {
                instruction: "Heat cooking vessel",
                details: "Place a pot or pan over medium heat. Add oil or butter if the recipe requires it."
            },
            {
                instruction: "Cook main ingredients",
                details: "Add the main ingredients to the pot/pan and cook according to their requirements."
            },
            {
                instruction: "Add seasonings",
                details: "Add salt, pepper, and other seasonings to taste. Stir well to combine."
            },
            {
                instruction: "Simmer if needed",
                details: "Cover and reduce heat if needed. Cook until all ingredients are tender and flavors are well combined."
            },
            {
                instruction: "Serve",
                details: "Remove from heat and serve hot. Garnish if desired."
            }
        ];
        
        setSteps(genericSteps);
        setStepSuggestionSuccess(`Added ${genericSteps.length} generic steps for "${name}" (offline mode)`);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <motion.div 
                        className="tab-content-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="form-card">
                            <h2 className="card-title">
                                <i className="bx bx-info-circle"></i>
                                Basic Recipe Information
                            </h2>
                            <div className="form-content">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="recipeName">
                                        <i className="bx bx-food-menu"></i>
                                        Recipe Name
                                    </label>
                                    <div className="recipe-name-with-ai">
                                        <input
                                            type="text"
                                            id="recipeName"
                                            className="form-input"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter recipe name"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label" htmlFor="category">
                                        <i className="bx bx-category"></i>
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        className="form-select"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label" htmlFor="description">
                                        <i className="bx bx-message-alt-detail"></i>
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        className="form-textarea"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe your recipe"
                                        required
                                    />
                                </div>
                                
                                {/* Cost field */}
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-money-withdraw"></i>
                                        Cost (₱)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter estimated cost"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="form-description">
                                        <i className="bx bx-info-circle"></i>
                                        Enter the estimated cost for this recipe
                                    </p>
                                </div>
                                
                                {/* Servings field */}
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-group"></i>
                                        Servings
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Number of servings"
                                        value={servings}
                                        onChange={(e) => setServings(e.target.value)}
                                        min="1"
                                    />
                                    <p className="form-description">
                                        <i className="bx bx-info-circle"></i>
                                        Enter how many people this recipe serves
                                    </p>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-image"></i>
                                        Recipe Image
                                    </label>
                                    <div className="image-upload-container">
                                        <input
                                            type="file"
                                            id="recipeImage"
                                            className="form-input-file"
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
                                        <label htmlFor="recipeImage" className="image-upload-label">
                                            <i className="bx bx-upload"></i>
                                            <span>Click to upload image</span>
                                        </label>
                                        {imagePreview && (
                                            <div className="image-preview-container">
                                                <img src={imagePreview} alt="Preview" className="image-preview" />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={() => {
                                                        setImage(null);
                                                        setImagePreview(null);
                                                    }}
                                                >
                                                    <i className="bx bx-x"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
                
            case 'ingredients':
                return (
                    <motion.div 
                        className="tab-content-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h2 className="card-title">
                                    <i className="bx bx-leaf"></i>
                                    Ingredients
                                </h2>
                                <button
                                    type="button"
                                    className="btn btn--ai ingredients-ai-button"
                                    onClick={generateIngredientSuggestions}
                                    disabled={isGeneratingIngredients || !name.trim()}
                                >
                                    {isGeneratingIngredients ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Generating...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-bulb"></i>
                                            Suggest Ingredients
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {suggestionSuccess && (
                                <div className="ingredients-success">
                                    <i className="bx bx-check-circle"></i> {suggestionSuccess}
                                </div>
                            )}
                            
                            <div className="ingredients-list">
                                {ingredients.map((ingredient, idx) => (
                                    <div key={idx} className="ingredient-row">
                                        <div className="ingredient-fields">
                                            <input
                                                type="text"
                                                className="form-input ingredient-amount"
                                                value={ingredient.amount}
                                                onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                                                placeholder="Amount"
                                            />
                                            <select
                                                className="form-select ingredient-unit"
                                                value={ingredient.unit || ''}
                                                onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                                            >
                                                <option value="">Select Unit</option>
                                                {units.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                className="form-input ingredient-name"
                                                value={ingredient.name}
                                                onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                                                placeholder="Ingredient name"
                                                list="ingredient-options"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn--destructive btn--icon"
                                            onClick={() => removeIngredient(idx)}
                                            disabled={ingredients.length === 1}
                                        >
                                            <i className="bx bx-trash"></i>
                                        </button>
                                    </div>
                                ))}
                                
                                <datalist id="ingredient-options">
                                    {allIngredients.map(ing => (
                                        <option key={ing._id} value={ing.name} />
                                    ))}
                                </datalist>
                            </div>
                            
                            <button
                                type="button"
                                className="btn btn--add"
                                onClick={addIngredient}
                            >
                                <i className="bx bx-plus"></i>
                                Add Ingredient
                            </button>
                        </div>
                    </motion.div>
                );
                
            case 'steps':
                return (
                    <motion.div 
                        className="tab-content-wrapper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h2 className="card-title">
                                    <i className="bx bx-list-ol"></i>
                                    Preparation Steps
                                </h2>
                                <button
                                    type="button"
                                    className="btn btn--ai ingredients-ai-button"
                                    onClick={generateStepSuggestions}
                                    disabled={isGeneratingSteps || !name.trim() || ingredients.length < 2}
                                >
                                    {isGeneratingSteps ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Generating...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-bulb"></i>
                                            Suggest Steps
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {stepSuggestionSuccess && (
                                <div className="ingredients-success">
                                    <i className="bx bx-check-circle"></i> {stepSuggestionSuccess}
                                </div>
                            )}
                            
                            <div className="steps-list">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="step-row">
                                        <div className="step-number">{idx + 1}</div>
                                        <div className="step-content">
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={step.instruction}
                                                onChange={(e) => handleStepChange(idx, 'instruction', e.target.value)}
                                                placeholder="Step title"
                                            />
                                            <textarea
                                                className="form-textarea"
                                                value={step.details}
                                                onChange={(e) => handleStepChange(idx, 'details', e.target.value)}
                                                placeholder="Step details"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn--destructive btn--icon"
                                            onClick={() => removeStep(idx)}
                                            disabled={steps.length === 1}
                                        >
                                            <i className="bx bx-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                type="button"
                                className="btn btn--add"
                                onClick={addStep}
                            >
                                <i className="bx bx-plus"></i>
                                Add Step
                            </button>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="create-recipe create-recipe--modal">
            <div className="create-recipe__container">
                <motion.div 
                    className="create-recipe__tabs"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        <i className="bx bx-info-circle"></i>
                        Basic Info
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'ingredients' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ingredients')}
                    >
                        <i className="bx bx-leaf"></i>
                        Ingredients
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'steps' ? 'active' : ''}`}
                        onClick={() => setActiveTab('steps')}
                    >
                        <i className="bx bx-list-ol"></i>
                        Steps
                    </button>
                </motion.div>

                <form onSubmit={handleSubmit} className="create-recipe__form">
                    <div className="create-recipe__content">
                        {renderTabContent()}
                    </div>
                    
                    {/* Fixed bottom actions */}
                    <div className="form-actions form-actions--fixed">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    className="alert alert--error"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <i className="bx bx-error-circle alert__icon"></i>
                                    {error}
                                    <button type="button" onClick={() => setError('')} className="alert__close">
                                        <i className="bx bx-x"></i>
                                    </button>
                                </motion.div>
                            )}
                            
                            {success && (
                                <motion.div
                                    className="alert alert--success"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <i className="bx bx-check-circle alert__icon"></i>
                                    {success}
                                    <button type="button" onClick={() => setSuccess('')} className="alert__close">
                                        <i className="bx bx-x"></i>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <motion.button 
                            type="submit" 
                            className="btn btn--primary btn--lg create-recipe-btn"
                            disabled={isLoading || !name.trim() || !category || !description.trim()}
                            whileHover={!isLoading ? { scale: 1.02 } : {}}
                            whileTap={!isLoading ? { scale: 0.98 } : {}}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            {isLoading ? (
                                <span className="btn__loading">
                                    <span className="spinner"></span>
                                    Creating Recipe...
                                </span>
                            ) : (
                                <>
                                    <i className="bx bx-check"></i>
                                    Create Recipe
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRecipe;

// Updated function to properly parse pipe-separated ingredients from API Ninjas
const parseIngredientsFromText = (ingredientsText) => {
  // First, split by pipe character which API Ninjas uses as separator
  const pipeSeparated = ingredientsText.split('|');
  
  // If we found pipe separators, process each segment
  if (pipeSeparated.length > 1) {
    return pipeSeparated.map(ingredient => parseIngredientString(ingredient.trim()));
  }
  
  // Otherwise, fall back to the original line-by-line parsing
  const ingredientLines = ingredientsText.split(/[;\n]+/).filter(line => line.trim());
  return ingredientLines.map(line => parseIngredientString(line.trim()));
};

// Helper function to parse a single ingredient string
const parseIngredientString = (ingredientStr) => {
  // Common units for better detection
  const commonUnits = ['cup', 'cups', 'tbsp', 'tsp', 'tablespoon', 'tablespoons', 'teaspoon', 
                   'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'pound', 'pounds', 
                   'g', 'gram', 'grams', 'kg', 'ml', 'l', 'liter', 'liters', 'piece', 
                   'pieces', 'slice', 'slices', 'clove', 'cloves', 'lg', 'md', 'c', 'ts'];
  
  // Pattern 1: Amount + Unit + Name (e.g., "1 cup sugar")
  const pattern1 = new RegExp(`^(\\d+(?:\\.\\d+)?(?:\\s+\\d+/\\d+)?)\\s+(${commonUnits.join('|')})\\s+(.+)$`, 'i');
  
  // Pattern 2: Amount + Name (e.g., "2 eggs")
  const pattern2 = /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)(?:\s+)?(.+)$/i;
  
  // Pattern 3: Just Name (e.g., "Salt to taste")
  const pattern3 = /^(.+)$/i;
  
  let match = ingredientStr.match(pattern1);
  if (match) {
    const [, amount, unit, name] = match;
    const normalizedUnit = normalizeUnit(unit.trim().toLowerCase());
    
    // Make sure the unit exists in our units array, or default to pieces
    const validUnit = units.includes(normalizedUnit) ? normalizedUnit : 'pieces';
    
    return {
      name: name.trim(),
      amount: amount.trim(),
      unit: validUnit
    };
  }
  
  match = ingredientStr.match(pattern2);
  if (match) {
    const [, amount, name] = match;
    return {
      name: name.trim(),
      amount: amount.trim(),
      unit: 'pieces'
    };
  }
  
  match = ingredientStr.match(pattern3);
  if (match) {
    // Just name, no amount or unit
    return {
      name: match[1].trim(),
      amount: '1',
      unit: 'pieces'
    };
  }
  
  // Fallback
  return {
    name: ingredientStr,
    amount: '1',
    unit: 'pieces'
  };
};

// Enhanced function to normalize units and ensure they exist in our application's unit list
const normalizeUnit = (unit) => {
  const unitMap = {
    // Standard units
    'cup': 'cups',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lbs',
    'pounds': 'lbs',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
    'piece': 'pieces',
    'slice': 'pieces',
    'slices': 'pieces',
    'clove': 'pieces',
    'cloves': 'pieces',
    
    // API Ninjas specific abbreviations
    'c': 'cups',      // cup
    'ts': 'tsp',      // teaspoon
    'tb': 'tbsp',     // tablespoon
    'lg': 'pieces',   // large
    'md': 'pieces',   // medium
    'sm': 'pieces'    // small
  };
  
  return unitMap[unit] || unit;
};

// In your component, make sure you handle setting a valid default unit when receiving ingredients
const processIngredientsResponse = async (ingredientsList) => {
  // Your existing code...
  
  // Create new recipe ingredients array
  const newIngredients = ingredientsList.map(ing => {
    // Ensure the unit exists in our units array
    const validUnit = units.includes(ing.unit) ? ing.unit : 'pieces';
    
    return {
      name: ing.name,
      amount: ing.amount || '1',
      unit: validUnit
    };
  });
  
  // Your existing code...
};
