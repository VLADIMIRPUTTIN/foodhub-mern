import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './EditRecipePage.scss';
import IngredientsModal from './IngredientsModal';

const categories = [
    'Appetizer', 'Main Course', 'Dessert', 'Breakfast', 
    'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup', 'Salad'
];
const units = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'l', 'pieces'];

const EditRecipePage = ({ recipe, onClose }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [form, setForm] = useState({
        title: recipe.title || '',
        description: recipe.description || '',
        category: recipe.category || '',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        image: null
    });
    const [newIngredient, setNewIngredient] = useState({ name: '', amount: '', unit: '' });
    const [newInstruction, setNewInstruction] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const suggestionTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(recipe.imageUrl || null);
    const [allIngredients, setAllIngredients] = useState([]);
    const [isIngredientsModalOpen, setIsIngredientsModalOpen] = useState(false);

    // Fetch all ingredients for the modal
    useEffect(() => {
        const fetchAllIngredients = async () => {
            try {
                const baseURL = import.meta.env.MODE === "development" 
                    ? "http://localhost:5000" 
                    : "";
                const response = await axios.get(
                    `${baseURL}/api/ingredients`,
                    { withCredentials: true }
                );

                if (response.data.success) {
                    setAllIngredients(response.data.ingredients);
                }
            } catch (error) {
                console.error('Error fetching ingredients:', error);
            }
        };
        fetchAllIngredients();
    }, []);

    // Ingredient search
    const searchIngredients = async (query) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setIsSearching(true);
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
            const response = await axios.get(
                `${baseURL}/api/ingredients/search?query=${encodeURIComponent(query)}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setSuggestions(response.data.ingredients);
                setShowSuggestions(true);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleIngredientNameChange = (value) => {
        setNewIngredient(prev => ({ ...prev, name: value }));
        if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = setTimeout(() => {
            searchIngredients(value);
        }, 300);
    };

    const handleSuggestionSelect = (ingredientName) => {
        setNewIngredient(prev => ({ ...prev, name: ingredientName }));
        setShowSuggestions(false);
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const handleIngredientFieldClick = () => {
        setIsIngredientsModalOpen(true);
    };

    const handleIngredientSelect = (ingredientData) => {
        setForm(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, ingredientData]
        }));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
        };
    }, []);

    const handleInputChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, image: file }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addIngredient = () => {
        if (newIngredient.name && newIngredient.amount) {
            setForm(prev => ({
                ...prev,
                ingredients: [...prev.ingredients, { ...newIngredient }]
            }));
            setNewIngredient({ name: '', amount: '', unit: '' });
            setShowSuggestions(false);
            setSuggestions([]);
        } else {
            toast.error('Please enter ingredient name and amount');
        }
    };

    const removeIngredient = (index) => {
        setForm(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    const addInstruction = () => {
        if (newInstruction.trim()) {
            setForm(prev => ({
                ...prev,
                instructions: [...prev.instructions, newInstruction.trim()]
            }));
            setNewInstruction('');
        } else {
            toast.error('Please enter an instruction');
        }
    };

    const removeInstruction = (index) => {
        setForm(prev => ({
            ...prev,
            instructions: prev.instructions.filter((_, i) => i !== index)
        }));
    };

    const generateAIInstructions = async () => {
        if (!form.title || !form.description) {
            toast.error('Please fill in recipe name and description first');
            return;
        }

        try {
            setLoading(true);
            
            // Create payload with recipe details
            const payload = {
                recipeName: form.title,
                ingredients: form.ingredients.map(ing => ing.name),
                category: form.category || 'Main Course',
                description: form.description
            };
            
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            const response = await axios.post(
                `${baseURL}/api/vision/suggest-steps`,
                payload,
                { withCredentials: true }
            );
            
            if (response.data.success && response.data.steps) {
                // Add each step to the instructions
                const newInstructions = [
                    ...form.instructions,
                    ...response.data.steps.map(step => step.instruction + ": " + step.details)
                ];
                
                setForm(prev => ({
                    ...prev,
                    instructions: newInstructions
                }));
                
                toast.success('AI generated instructions added!');
            }
        } catch (error) {
            console.error('Error generating instructions:', error);
            toast.error('Failed to generate instructions');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.title || !form.description || form.ingredients.length === 0 || form.instructions.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('ingredients', JSON.stringify(form.ingredients));
            formData.append('instructions', JSON.stringify(form.instructions));
            formData.append('category', form.category);
            if (form.image) formData.append('image', form.image);

            // Consistent API URL pattern
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            await axios.patch(
                `${baseURL}/api/recipes/${recipe._id}`,
                formData,
                { 
                    headers: { 'Content-Type': 'multipart/form-data' }, 
                    withCredentials: true 
                }
            );
            
            toast.success('Recipe updated successfully!');
            onClose(true);
        } catch (err) {
            console.error('Update error:', err);
            toast.error('Failed to update recipe.');
        }
        setLoading(false);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="tab-pane active">
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
                                        value={form.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Enter recipe title"
                                        required
                                        maxLength={60}
                                        style={{ fontWeight: 600, fontSize: '1.1rem', background: '#f9f7f3' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        style={{ background: '#f9f7f3' }}
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
                                    value={form.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Describe your recipe"
                                    rows={3}
                                    required
                                    maxLength={300}
                                    style={{ background: '#f9f7f3', fontSize: '1rem' }}
                                />
                                <div className="desc-hint">{form.description.length}/300</div>
                            </div>
                        </div>
                        <div className="form-section image-section">
                            <div className="section-header">
                                <i className="bx bx-image"></i>
                                <h3>Recipe Image</h3>
                            </div>
                            <div className="image-upload-compact center-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    id="image-upload-edit"
                                />
                                <label htmlFor="image-upload-edit" className="upload-label">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Recipe preview" />
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
                                <h3>Ingredients <span className="count-badge">{form.ingredients.length}</span></h3>
                            </div>
                            <div className="input-row">
                                <div className="ingredient-input-container" ref={inputRef}>
                                    <input
                                        type="text"
                                        placeholder="Ingredient name"
                                        value={newIngredient.name}
                                        onChange={(e) => handleIngredientNameChange(e.target.value)}
                                        onClick={handleIngredientFieldClick}
                                        style={{ background: '#f9f7f3' }}
                                    />
                                    <button 
                                        type="button" 
                                        className="ingredient-suggest-btn"
                                        onClick={handleIngredientFieldClick}
                                        title="Browse ingredients"
                                    >
                                        <i className="bx bx-search"></i>
                                    </button>
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
                                    style={{ background: '#f9f7f3' }}
                                />
                                <select
                                    value={newIngredient.unit}
                                    onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                                    className="unit-select"
                                    style={{ background: '#f9f7f3' }}
                                >
                                    <option value="">Unit</option>
                                    {units.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                                <button type="button" onClick={addIngredient} className="add-btn" title="Add ingredient">
                                    <i className="bx bx-plus"></i>
                                    <span>Add</span>
                                </button>
                            </div>
                            <div className="items-list">
                                {form.ingredients.map((ingredient, index) => (
                                    <div key={index} className="list-item">
                                        <span className="amount">{ingredient.amount} {ingredient.unit}</span>
                                        <span className="name">{ingredient.name}</span>
                                        <button type="button" onClick={() => removeIngredient(index)} className="remove-btn" title="Remove">
                                            <i className="bx bx-x"></i>
                                        </button>
                                    </div>
                                ))}
                                {form.ingredients.length === 0 && (
                                    <div className="empty-list-hint">No ingredients yet. Start adding some!</div>
                                )}
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
                                <h3>Instructions <span className="count-badge">{form.instructions.length}</span></h3>
                            </div>
                            
                            {/* Add AI button */}
                            <button 
                                type="button" 
                                onClick={generateAIInstructions}
                                disabled={loading || !form.title || !form.description}
                                className="ai-icon-button"
                                title="Generate AI instructions"
                            >
                                <i className="bx bx-bulb"></i>
                            </button>
                            
                            <div className="instruction-input">
                                <textarea
                                    placeholder="Add instruction step"
                                    value={newInstruction}
                                    onChange={(e) => setNewInstruction(e.target.value)}
                                    rows={3}
                                    style={{ background: '#f9f7f3' }}
                                />
                                <button type="button" onClick={addInstruction} className="add-btn" title="Add step">
                                    <i className="bx bx-plus"></i>
                                    <span>Add Step</span>
                                </button>
                            </div>
                            <div className="items-list">
                                {form.instructions.map((instruction, index) => (
                                    <div key={index} className="list-item instruction-item">
                                        <span className="step-number">{index + 1}</span>
                                        <span className="step-text">{instruction}</span>
                                        <button type="button" onClick={() => removeInstruction(index)} className="remove-btn" title="Remove">
                                            <i className="bx bx-x"></i>
                                        </button>
                                    </div>
                                ))}
                                {form.instructions.length === 0 && (
                                    <div className="empty-list-hint">No instructions yet.</div>
                                )}
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={() => onClose(false)} className="cancel-btn">
                                <i className="bx bx-x"></i>
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="submit-btn" onClick={handleSubmit}>
                                <i className="bx bx-check"></i>
                                {loading ? 'Updating...' : 'Update Recipe'}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <motion.div 
            className="edit-recipe-page-modal enhanced-modal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="form-header">
                <h1>
                    <i className="bx bx-edit"></i>
                    Edit Recipe
                </h1>
            </div>
            
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
            
            <IngredientsModal
                isOpen={isIngredientsModalOpen}
                onClose={() => setIsIngredientsModalOpen(false)}
                onIngredientSelect={handleIngredientSelect}
                allIngredients={allIngredients.length > 0 ? allIngredients : []}
                units={units}
            />
        </motion.div>
    );
};

export default EditRecipePage;