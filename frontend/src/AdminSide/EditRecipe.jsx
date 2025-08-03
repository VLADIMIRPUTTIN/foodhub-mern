import { useState, useEffect } from 'react';
import axios from 'axios';
import './EditRecipeModal.scss';

const categories = ['Appetizer', 'Main Course', 'Dessert', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup', 'Salad'];
const units = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'l', 'pieces'];

const EditRecipe = ({ recipe, onRecipeUpdated, onCancel }) => {
    const [image, setImage] = useState(null);
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

    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/ingredients');
                setAllIngredients(res.data.ingredients);
            } catch {
                setAllIngredients([]);
            }
        };
        fetchIngredients();
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
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
                imageUrl = await toBase64(image);
            }

            await axios.patch(
                `http://localhost:5000/api/recipes/${recipe._id}`,
                {
                    name,
                    category,
                    description,
                    ingredients,
                    steps,
                    imageUrl
                },
                { withCredentials: true }
            );
            
            setSuccess('Recipe updated successfully!');
            setTimeout(() => {
                if (onRecipeUpdated) onRecipeUpdated();
            }, 1500);
        } catch (err) {
            console.error('Update recipe error:', err);
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
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

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
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Change Image</label>
                                <input 
                                    type="file" 
                                    className="form-input"
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                />
                                {(image || recipe.imageUrl) && (
                                    <img
                                        src={image ? URL.createObjectURL(image) : recipe.imageUrl}
                                        alt="Preview"
                                        className="image-preview"
                                    />
                                )}
                                <p className="form-description">Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP</p>
                            </div>
                        </div>
                    </div>
                );
            case 'ingredients':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                            <h3 className="card-title">Ingredients</h3>
                            <div className="ingredients-list">
                                {ingredients.map((ing, idx) => (
                                    <div key={idx} className="ingredient-row">
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
                                        {ingredients.length > 1 && (
                                            <button 
                                                type="button" 
                                                className="btn btn--destructive btn--sm"
                                                onClick={() => removeIngredient(idx)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    className="btn btn--secondary btn--sm"
                                    onClick={addIngredient}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Ingredient
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'steps':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                            <h3 className="card-title">Preparation Steps</h3>
                            <div className="steps-list">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="step-row">
                                        <div className="step-number">{idx + 1}</div>
                                        <div className="step-content">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Step instruction"
                                                value={step.instruction}
                                                onChange={e => handleStepChange(idx, 'instruction', e.target.value)}
                                                required
                                            />
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Detailed preparation instructions"
                                                value={step.details}
                                                onChange={e => handleStepChange(idx, 'details', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {steps.length > 1 && (
                                            <button 
                                                type="button" 
                                                className="btn btn--destructive btn--sm"
                                                onClick={() => removeStep(idx)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    className="btn btn--secondary btn--sm"
                                    onClick={addStep}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
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
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal__tabs">
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                        </svg>
                        Basic Info
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'ingredients' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ingredients')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                        </svg>
                        Ingredients
                    </button>
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'steps' ? 'active' : ''}`}
                        onClick={() => setActiveTab('steps')}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Steps
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal__form">
                    {renderTabContent()}
                    
                    {error && (
                        <div className="alert alert--error">
                            <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert--success">
                            <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
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