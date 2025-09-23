import { useState, useEffect } from 'react';
import axios from 'axios';
import './EditRecipeModal.scss';

const categories = [
    'Appetizer', 'Main Course', 'Dessert', 'Breakfast',
    'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup', 'Salad'
];
const units = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'l', 'pieces'];

const EditRecipe = ({ recipe, onRecipeUpdated, onCancel }) => {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(recipe?.imageUrl || null);
    const [name, setName] = useState(recipe?.name || recipe?.title || '');
    const [category, setCategory] = useState(recipe?.category || '');
    const [description, setDescription] = useState(recipe?.description || '');
    const [ingredients, setIngredients] = useState(recipe?.ingredients || [{ amount: '', unit: '', name: '' }]);
    const [steps, setSteps] = useState(recipe?.steps || recipe?.instructions || [{ instruction: '', details: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [allIngredients, setAllIngredients] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const [price, setPrice] = useState(recipe?.price || '');
    const [isLoadingIngredients, setIsLoadingIngredients] = useState(true);

    useEffect(() => {
        const fetchIngredients = async () => {
            setIsLoadingIngredients(true);
            try {
                const baseURL = import.meta.env.MODE === "development"
                    ? "http://localhost:5000"
                    : "";
                const res = await axios.get(`${baseURL}/api/ingredients`, { withCredentials: true });
                if (res.data && res.data.ingredients) {
                    setAllIngredients(res.data.ingredients);
                    console.log("Fetched ingredients:", res.data.ingredients.length);
                } else {
                    console.warn("No ingredients data in response");
                    setAllIngredients([]);
                }
            } catch (err) {
                console.error("Error fetching ingredients:", err);
                setAllIngredients([]);
            } finally {
                setIsLoadingIngredients(false);
            }
        };
        fetchIngredients();
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onCancel();
        };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [onCancel]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(recipe?.imageUrl || null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        
        try {
            let imageUrl = recipe.imageUrl || '';
            if (image) {
                imageUrl = imagePreview;
            }
            
            // Validate ingredients
            const validIngredients = ingredients.filter(ing => 
                ing.name && ing.name.trim() && ing.amount && ing.unit
            );
            
            if (validIngredients.length === 0) {
                setError('Please add at least one ingredient with all fields filled');
                setIsLoading(false);
                return;
            }
            
            // Validate steps
            const validSteps = steps.filter(step => 
                step.instruction && step.instruction.trim()
            );
            
            if (validSteps.length === 0) {
                setError('Please add at least one preparation step');
                setIsLoading(false);
                return;
            }
            
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            const response = await axios.patch(
                `${baseURL}/api/recipes/${recipe._id}`,
                {
                    name,
                    category,
                    description,
                    ingredients: validIngredients,
                    steps: validSteps,
                    imageUrl,
                    price
                },
                { withCredentials: true }
            );
            
            console.log("Update response:", response.data);
            setSuccess('Recipe updated successfully!');
            
            setTimeout(() => {
                if (onRecipeUpdated) onRecipeUpdated();
            }, 1500);
            
        } catch (err) {
            console.error("Update error:", err);
            
            if (err.response?.status === 401) {
                setError('You must be logged in to update recipes');
            } else if (err.response?.status === 404) {
                setError('Recipe not found');
            } else {
                setError(err.response?.data?.message || 'Failed to update recipe');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onCancel();
    };

    // UI matches CreateRecipe
    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                            <div className="form-group">
                                <label className="form-label">Recipe Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder="Enter recipe name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    className="form-textarea"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Describe your recipe"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Price</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Recipe price"
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
                                <label className="form-label">Recipe Image</label>
                                <div className="image-upload-container">
                                    <input
                                        type="file"
                                        className="form-input"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        id="recipe-image"
                                    />
                                    <label htmlFor="recipe-image" className="image-upload-label">
                                        <i className="bx bx-upload"></i> 
                                        {image ? "Change image" : "Upload image"}
                                    </label>
                                </div>
                                {(imagePreview) && (
                                    <div className="image-preview-container">
                                        <img
                                            src={imagePreview}
                                            alt="Recipe preview"
                                            className="image-preview"
                                        />
                                    </div>
                                )}
                                <p className="form-description">
                                    <i className="bx bx-info-circle"></i>
                                    Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'ingredients':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h3 className="card-title">Ingredients ({ingredients.length})</h3>
                            </div>
                            
                            {isLoadingIngredients ? (
                                <div className="loading-spinner-container">
                                    <div className="loading-spinner"></div>
                                    <p>Loading ingredients...</p>
                                </div>
                            ) : (
                                <div className="ingredients-list">
                                    {ingredients.map((ing, idx) => (
                                        <div key={idx} className="ingredient-row">
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
                                                    className="btn btn--icon"
                                                    onClick={() => removeIngredient(idx)}
                                                    title="Remove ingredient"
                                                >
                                                    <i className="bx bx-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn--add"
                                        onClick={addIngredient}
                                    >
                                        <i className="bx bx-plus"></i>
                                        Add Ingredient
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'steps':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h3 className="card-title">Preparation Steps ({steps.length})</h3>
                            </div>
                            <div className="steps-list">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="step-row">
                                        <div className="step-number">{idx + 1}</div>
                                        <div className="step-content">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Step instruction (e.g., Preheat oven)"
                                                value={step.instruction}
                                                onChange={e => handleStepChange(idx, 'instruction', e.target.value)}
                                                required
                                            />
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Detailed preparation instructions"
                                                value={step.details}
                                                onChange={e => handleStepChange(idx, 'details', e.target.value)}
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        {steps.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn--icon"
                                                onClick={() => removeStep(idx)}
                                                title="Remove step"
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn--add"
                                    onClick={addStep}
                                >
                                    <i className="bx bx-plus"></i>
                                    Add Step
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal">
                <div className="modal__header">
                    <h2 className="modal__title">Edit Recipe</h2>
                    <button
                        className="modal__close"
                        onClick={onCancel}
                        type="button"
                    >
                        <i className="bx bx-x"></i>
                    </button>
                </div>
                <div className="modal__tabs">
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
                </div>
                <form onSubmit={handleSubmit} className="modal__form">
                    {renderTabContent()}
                    {error && (
                        <div className="alert alert--error">
                            <i className="bx bx-error-circle alert__icon"></i>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="alert alert--success">
                            <i className="bx bx-check-circle alert__icon"></i>
                            {success}
                        </div>
                    )}
                    <div className="modal__actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn--secondary"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="btn btn--primary"
                        >
                            {isLoading ? (
                                <span className="btn__loading">
                                    <span className="spinner"></span>
                                    Updating...
                                </span>
                            ) : (
                                "Update Recipe"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRecipe;