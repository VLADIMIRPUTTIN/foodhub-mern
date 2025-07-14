import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../pages/NavbarPage';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast'; // Add this import
import './CreateRecipePage.scss';

const CreateRecipePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('basic');
    
    const [recipe, setRecipe] = useState({
        title: '',
        description: '',
        ingredients: [],
        instructions: [],
        category: '',
        image: null
    });
    
    const [newIngredient, setNewIngredient] = useState({ name: '', amount: '', unit: '' });
    const [newInstruction, setNewInstruction] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Autocomplete states
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const suggestionTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    const categories = [
        'Appetizer', 'Main Course', 'Dessert', 'Breakfast', 
        'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup', 'Salad'
    ];

    const units = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'l', 'pieces'];

    // Search ingredients function
    const searchIngredients = async (query) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await axios.get(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/ingredients/search" : "/api/ingredients/search"}?query=${encodeURIComponent(query)}`,
                { withCredentials: true }
            );

            if (response.data.success) {
                setSuggestions(response.data.ingredients);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error searching ingredients:', error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle ingredient name change with debounced search
    const handleIngredientNameChange = (value) => {
        setNewIngredient(prev => ({ ...prev, name: value }));

        // Clear previous timeout
        if (suggestionTimeoutRef.current) {
            clearTimeout(suggestionTimeoutRef.current);
        }

        // Set new timeout for search
        suggestionTimeoutRef.current = setTimeout(() => {
            searchIngredients(value);
        }, 300);
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (ingredientName) => {
        setNewIngredient(prev => ({ ...prev, name: ingredientName }));
        setShowSuggestions(false);
        setSuggestions([]);
        inputRef.current?.focus();
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
            }
        };
    }, []);

    const handleInputChange = (field, value) => {
        setRecipe(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setRecipe(prev => ({ ...prev, image: file }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addIngredient = () => {
        if (newIngredient.name && newIngredient.amount) {
            setRecipe(prev => ({
                ...prev,
                ingredients: [...prev.ingredients, { ...newIngredient }]
            }));
            setNewIngredient({ name: '', amount: '', unit: '' });
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    const removeIngredient = (index) => {
        setRecipe(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const addInstruction = () => {
        if (newInstruction.trim()) {
            setRecipe(prev => ({
                ...prev,
                instructions: [...prev.instructions, newInstruction.trim()]
            }));
            setNewInstruction('');
        }
    };

    const removeInstruction = (index) => {
        setRecipe(prev => ({
            ...prev,
            instructions: prev.instructions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!recipe.title || !recipe.description || recipe.ingredients.length === 0 || recipe.instructions.length === 0) {
            toast.error('Please fill in all required fields'); // Use toast for error
            return;
        }

        setIsLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('title', recipe.title);
            formData.append('description', recipe.description);
            formData.append('ingredients', JSON.stringify(recipe.ingredients));
            formData.append('instructions', JSON.stringify(recipe.instructions));
            formData.append('category', recipe.category);
            
            if (recipe.image) {
                formData.append('image', recipe.image);
            }

            const response = await axios.post(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/recipes" : "/api/recipes"}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                toast.success('Recipe created successfully!'); // Show toast notification
                navigate('/recipes');
            }
        } catch (error) {
            console.error('Error creating recipe:', error);
            toast.error('Failed to create recipe. Please try again.'); // Use toast for error
        } finally {
            setIsLoading(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="tab-pane active">
                        {/* Basic Info Section */}
                        <div className="form-section">
                            <div className="section-header">
                                <i className="bx bx-info-circle"></i>
                                <h3>Recipe Details</h3>
                            </div>
                            
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Recipe Title *</label>
                                    <input
                                        type="text"
                                        value={recipe.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Enter recipe title"
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={recipe.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={recipe.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe your recipe"
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="form-section image-section">
                            <div className="section-header">
                                <i className="bx bx-image"></i>
                                <h3>Recipe Image</h3>
                            </div>
                            
                            <div className="image-upload-compact">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="upload-label">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <i className="bx bx-cloud-upload"></i>
                                            <span>Choose Image</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'ingredients':
                return (
                    <div className="tab-pane active">
                        <div className="form-section">
                            <div className="section-header">
                                <i className="bx bx-list-ul"></i>
                                <h3>Ingredients ({recipe.ingredients.length})</h3>
                            </div>
                            
                            <div className="input-row">
                                <div className="ingredient-input-container" ref={inputRef}>
                                    <input
                                        type="text"
                                        placeholder="Ingredient name"
                                        value={newIngredient.name}
                                        onChange={(e) => handleIngredientNameChange(e.target.value)}
                                        onFocus={() => {
                                            if (suggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="suggestions-dropdown">
                                            {isSearching && (
                                                <div className="suggestion-item loading">
                                                    <i className="bx bx-loader-alt bx-spin"></i>
                                                    Searching...
                                                </div>
                                            )}
                                            {suggestions.map((ingredient, index) => (
                                                <div
                                                    key={ingredient._id || index}
                                                    className="suggestion-item"
                                                    onClick={() => handleSuggestionSelect(ingredient.name)}
                                                >
                                                    <i className="bx bx-leaf"></i>
                                                    {ingredient.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Amount"
                                    value={newIngredient.amount}
                                    onChange={(e) => setNewIngredient(prev => ({ ...prev, amount: e.target.value }))}
                                    className="amount-input"
                                />
                                <select
                                    value={newIngredient.unit}
                                    onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                                    className="unit-select"
                                >
                                    <option value="">Unit</option>
                                    {units.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={addIngredient} className="add-btn">
                                    <i className="bx bx-plus"></i>
                                    <span>Add</span>
                                </button>
                            </div>
                            
                            <div className="items-list">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <div key={index} className="list-item">
                                        <span className="amount">{ingredient.amount} {ingredient.unit}</span>
                                        <span className="name">{ingredient.name}</span>
                                        <button type="button" onClick={() => removeIngredient(index)} className="remove-btn">
                                            <i className="bx bx-x"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'instructions':
                return (
                    <div className="tab-pane active">
                        <div className="form-section">
                            <div className="section-header">
                                <i className="bx bx-detail"></i>
                                <h3>Instructions ({recipe.instructions.length} steps)</h3>
                            </div>
                            
                            <div className="instruction-input">
                                <textarea
                                    placeholder="Add instruction step"
                                    value={newInstruction}
                                    onChange={(e) => setNewInstruction(e.target.value)}
                                    rows={3}
                                />
                                <button type="button" onClick={addInstruction} className="add-btn">
                                    <i className="bx bx-plus"></i>
                                    <span>Add Step</span>
                                </button>
                            </div>
                            
                            <div className="items-list">
                                {recipe.instructions.map((instruction, index) => (
                                    <div key={index} className="list-item instruction-item">
                                        <span className="step-number">{index + 1}</span>
                                        <span className="step-text">{instruction}</span>
                                        <button type="button" onClick={() => removeInstruction(index)} className="remove-btn">
                                            <i className="bx bx-x"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Actions - Only show in Instructions tab */}
                        <div className="form-actions">
                            <button type="button" onClick={() => navigate('/recipes')} className="cancel-btn">
                                <i className="bx bx-x"></i>
                                Cancel
                            </button>
                            <button type="submit" disabled={isLoading} className="submit-btn" onClick={handleSubmit}>
                                <i className="bx bx-check"></i>
                                {isLoading ? 'Creating...' : 'Create Recipe'}
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="create-recipe-page">
            <Navbar />
            
            <div className="create-recipe-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="create-recipe-form"
                >
                    <div className="form-header">
                        <h1>
                            <i className="bx bx-food-menu"></i>
                            Create Recipe
                        </h1>
                    </div>

                    {/* Tab Navigation */}
                    <div className="tab-navigation">
                        <button
                            className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                            onClick={() => setActiveTab('basic')}
                        >
                            <i className="bx bx-info-circle"></i>
                            <span>Basic Info</span>
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'ingredients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ingredients')}
                        >
                            <i className="bx bx-list-ul"></i>
                            <span>Ingredients</span>
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'instructions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('instructions')}
                        >
                            <i className="bx bx-detail"></i>
                            <span>Instructions</span>
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="tab-content">
                            {renderTabContent()}
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default CreateRecipePage;