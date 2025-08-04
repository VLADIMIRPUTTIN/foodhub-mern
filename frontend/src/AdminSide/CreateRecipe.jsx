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
                            <h3 className="card-title">
                                <i className="bx bx-leaf"></i>
                                Ingredients ({ingredients.length})
                            </h3>
                            
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
                            <h3 className="card-title">
                                <i className="bx bx-list-ol"></i>
                                Preparation Steps ({steps.length})
                            </h3>
                            
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