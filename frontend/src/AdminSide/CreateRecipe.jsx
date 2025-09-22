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

    // Enhanced function with better error handling
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
            
            // Add a connection check first
            try {
                // Quick ping to check if server is accessible
                await axios.get(`${baseURL}/api/ingredients`, { 
                    timeout: 2000,
                    withCredentials: true 
                });
            } catch (pingError) {
                console.log("Server connection check failed, using offline mode", pingError);
                // Show more helpful error message
                setError("Backend server not running. Using offline mode with common ingredients.");
                return useFallbackIngredients();
            }
            
            // If server is accessible, proceed with AI request
            const response = await axios.post(
                `${baseURL}/api/vision/suggest-ingredients`,
                { recipeName: name },
                { 
                    withCredentials: true,
                    timeout: 30000 // Add a longer timeout for AI operations
                }
            );
            
            console.log("AI response:", response.data);
            
            if (response.data.success && response.data.ingredients && response.data.ingredients.length > 0) {
                processIngredientsResponse(response.data.ingredients);
            } else {
                setError("Could not generate ingredients. Using common ingredients instead.");
                useFallbackIngredients();
            }
        } catch (err) {
            console.error("Error generating ingredients:", err);
            
            // Enhanced error reporting
            let errorMessage = "Failed to generate ingredients";
            
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                errorMessage = "Cannot connect to server. Please ensure the backend is running.";
                // Use fallback ingredients when server is unreachable
                useFallbackIngredients();
            } else if (err.response) {
                errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
            } else if (err.request) {
                errorMessage = "No response from server. Using common ingredients instead.";
                useFallbackIngredients();
            } else {
                errorMessage = err.message;
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
                // Check if ingredient exists in system
                const exists = existingIngredients.some(
                    existingIng => existingIng.name.toLowerCase() === ing.name.toLowerCase()
                );
                
                if (!exists) {
                    missingIngredients.push(ing.name);
                }
                
                return {
                    name: ing.name,
                    amount: ing.amount || '1',
                    unit: ing.unit || 'piece'
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="form-card">
                            <h3 className="card-title">
                                <i className="bx bx-info-circle"></i>
                                Basic Information
                            </h3>
                            
                            <div className="form-content">
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-food-menu"></i>
                                        Recipe Name
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-input"
                                        placeholder="Enter a delicious recipe name..."
                                        value={name} 
                                        onChange={e => setName(e.target.value)} 
                                        required 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-category"></i>
                                        Category
                                    </label>
                                    <select 
                                        className="form-select"
                                        value={category} 
                                        onChange={e => setCategory(e.target.value)} 
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-text"></i>
                                        Description
                                    </label>
                                    <textarea 
                                        className="form-textarea"
                                        placeholder="Describe your recipe, cooking tips, or what makes it special..."
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        required 
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-money-withdraw"></i>
                                        Recipe Price
                                    </label>
                                    <input 
                                        type="number" 
                                        className="form-input"
                                        placeholder="Enter recipe price (e.g. 250.00)"
                                        value={price} 
                                        onChange={e => setPrice(e.target.value)} 
                                        min="0"
                                        step="0.01"
                                    />
                                    <p className="form-description">
                                        <i className="bx bx-info-circle"></i>
                                        Estimated cost of ingredients in PHP
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
                                            id="recipe-image"
                                            className="form-input-file"
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                        />
                                        <label htmlFor="recipe-image" className="image-upload-label">
                                            <i className="bx bx-cloud-upload"></i>
                                            <span>Choose an image or drag & drop</span>
                                        </label>
                                        {imagePreview && (
                                            <motion.div 
                                                className="image-preview-container"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <img 
                                                    src={imagePreview} 
                                                    alt="Recipe Preview" 
                                                    className="image-preview" 
                                                />
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
                                            </motion.div>
                                        )}
                                    </div>
                                    <p className="form-description">
                                        <i className="bx bx-info-circle"></i>
                                        Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
                
            case 'ingredients':
                return (
                    <motion.div 
                        className="tab-content-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h3 className="card-title">
                                    <i className="bx bx-leaf"></i>
                                    Ingredients ({ingredients.length})
                                </h3>
                                
                                <motion.button
                                    type="button"
                                    className="btn btn--ai ingredients-ai-button"
                                    onClick={generateIngredientSuggestions}
                                    disabled={isGeneratingIngredients || !name.trim()}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Generate ingredients with AI"
                                >
                                    <i className="bx bx-bulb"></i>
                                    {isGeneratingIngredients ? "Generating..." : "Suggest Ingredients"}
                                </motion.button>
                            </div>
                            
                            {suggestionSuccess && (
                                <div className="suggestion-success ingredients-success">
                                    <i className="bx bx-check-circle"></i> {suggestionSuccess}
                                </div>
                            )}
                            
                            <div className="ingredients-list">
                                <AnimatePresence>
                                    {ingredients.map((ing, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="ingredient-row"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                        >
                                            <div className="ingredient-fields">
                                                <input
                                                    type="text"
                                                    className="form-input ingredient-amount"
                                                    placeholder="Amount"
                                                    value={ing.amount}
                                                    onChange={e => handleIngredientChange(idx, 'amount', e.target.value)}
                                                    required
                                                />
                                                <select
                                                    className="form-select ingredient-unit"
                                                    value={ing.unit}
                                                    onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Unit</option>
                                                    {units.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    className="form-select ingredient-name"
                                                    value={ing.name}
                                                    onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Ingredient</option>
                                                    {allIngredients.map(ingredient => (
                                                        <option key={ingredient._id} value={ingredient.name}>
                                                            {ingredient.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {ingredients.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn--destructive btn--sm btn--icon"
                                                    onClick={() => removeIngredient(idx)}
                                                    title="Remove ingredient"
                                                >
                                                    <i className="bx bx-trash"></i>
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                <motion.button 
                                    type="button" 
                                    className="btn btn--secondary btn--add"
                                    onClick={addIngredient}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="bx bx-plus"></i>
                                    Add Ingredient
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                );
                
            case 'steps':
                return (
                    <motion.div 
                        className="tab-content-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h3 className="card-title">
                                    <i className="bx bx-list-ol"></i>
                                    Preparation Steps ({steps.length})
                                </h3>
                                
                                <motion.button
                                    type="button"
                                    className="btn btn--ai ingredients-ai-button"
                                    onClick={generateStepSuggestions}
                                    disabled={isGeneratingSteps || !name.trim() || ingredients.length < 2}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Generate preparation steps with AI"
                                >
                                    <i className="bx bx-bulb"></i>
                                    {isGeneratingSteps ? "Generating..." : "Suggest Steps"}
                                </motion.button>
                            </div>
                            
                            {stepSuggestionSuccess && (
                                <div className="suggestion-success ingredients-success">
                                    <i className="bx bx-check-circle"></i> {stepSuggestionSuccess}
                                </div>
                            )}
                            
                            <div className="steps-list">
                                <AnimatePresence>
                                    {steps.map((step, idx) => (
                                        <motion.div
                                            key={idx}
                                            className="step-row"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ duration: 0.2, delay: idx * 0.05 }}
                                        >
                                            <div className="step-number">{idx + 1}</div>
                                            <div className="step-content">
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Brief step description (e.g., 'Mix ingredients')"
                                                    value={step.instruction}
                                                    onChange={e => handleStepChange(idx, 'instruction', e.target.value)}
                                                    required
                                                />
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Detailed preparation instructions..."
                                                    value={step.details}
                                                    onChange={e => handleStepChange(idx, 'details', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            {steps.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn--destructive btn--sm btn--icon"
                                                    onClick={() => removeStep(idx)}
                                                    title="Remove step"
                                                >
                                                    <i className="bx bx-trash"></i>
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                <motion.button 
                                    type="button" 
                                    className="btn btn--secondary btn--add"
                                    onClick={addStep}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="bx bx-plus"></i>
                                    Add Step
                                </motion.button>
                            </div>
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