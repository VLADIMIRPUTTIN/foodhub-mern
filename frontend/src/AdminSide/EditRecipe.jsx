import { useState, useEffect } from 'react';
import axios from 'axios';
import './EditRecipeModal.scss';

// Add these arrays for options (same as CreateRecipe)
const categories = [
    'Appetizer', 'Main Course', 'Dessert', 'Breakfast',
    'Lunch', 'Dinner', 'Snack', 'Beverage', 'Soup', 'Salad'
];

const units = ['cups', 'tbsp', 'tsp', 'oz', 'lbs', 'g', 'kg', 'ml', 'l', 'pieces'];

// Add these new arrays for preferences
const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'keto', 'paleo', 'halal', 'kosher', 'low-carb', 'high-protein'
];

const cuisineOptions = [
    'Filipino', 'Italian', 'Chinese', 'Japanese', 'Korean', 
    'Mexican', 'Indian', 'Thai', 'American', 'French', 'Mediterranean'
];

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

    // Add new state variables for preferences (initialized from recipe data)
    const [dietaryTags, setDietaryTags] = useState(recipe?.dietaryTags || []);
    const [cuisine, setCuisine] = useState(recipe?.cuisine || 'Filipino');
    const [cookingTime, setCookingTime] = useState(recipe?.cookingTime || '');
    const [difficulty, setDifficulty] = useState(recipe?.difficulty || 'Easy');

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

    // Handle dietary tag selection
    const handleDietaryTagToggle = (tag) => {
        setDietaryTags(prev => 
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            const payload = {
                title: name,
                name,
                category,
                description,
                ingredients,
                instructions: steps,
                price,
                cuisine,
                cookingTime,
                difficulty,
                dietaryTags
            };
            
            // ✅ Add baseURL
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
            let endpoint = `${baseURL}/api/recipes/${recipe._id}`;

            if (image) {
                const fd = new FormData();
                Object.entries(payload).forEach(([k, v]) => {
                    fd.append(k, typeof v === "object" ? JSON.stringify(v) : v);
                });
                fd.append("image", image);
                const res = await fetch(endpoint, {
                    method: "PATCH",
                    body: fd,
                    credentials: "include"
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Update failed");
                onRecipeUpdated?.(data);
            } else {
                const res = await fetch(endpoint, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Update failed");
                onRecipeUpdated?.(data);
            }
            setSuccess("Recipe updated.");
        } catch (err) {
            setError(err.message);
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
                            <h3 className="card-title">
                                <i className="bx bx-info-circle"></i>
                                Basic Information
                            </h3>
                            <div className="form-content">
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-dish"></i>
                                        Recipe Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="Enter a delicious recipe name..."
                                        maxLength={100}
                                    />
                                    <p className="form-description">
                                        <i className="bx bx-info-circle"></i>
                                        Choose a catchy and descriptive name (max 100 characters)
                                    </p>
                                </div>
                                
                                <div className="form-row">
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
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="form-group">
                                        <label className="form-label">
                                            <i className="bx bx-money"></i>
                                            Estimated Price (₱)
                                        </label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0.00"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-detail"></i>
                                        Description
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Describe what makes this recipe special..."
                                        rows={4}
                                        required
                                        maxLength={500}
                                    />
                                    <p className="form-description">
                                        <i className="bx bx-info-circle"></i>
                                        Share the story behind this recipe (max 500 characters)
                                    </p>
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">
                                        <i className="bx bx-image-add"></i>
                                        Recipe Image
                                    </label>
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
                                            {image ? "Change Image" : "Upload Image"}
                                        </label>
                                    </div>
                                    {imagePreview && (
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
                    </div>
                );
            case 'ingredients':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                            <div className="ingredients-header">
                                <h3 className="card-title">
                                    <i className="bx bx-leaf"></i>
                                    Ingredients ({ingredients.length})
                                </h3>
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
                                            <div className="ingredient-number">{idx + 1}</div>
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
                                                    className="btn btn--icon btn--remove"
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
                                <h3 className="card-title">
                                    <i className="bx bx-list-ol"></i>
                                    Preparation Steps ({steps.length})
                                </h3>
                            </div>
                            <div className="steps-list">
                                {steps.map((step, idx) => (
                                    <div key={idx} className="step-row">
                                        <div className="step-number">{idx + 1}</div>
                                        <div className="step-content">
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Step title (e.g., Preheat oven to 350°F)"
                                                value={step.instruction}
                                                onChange={e => handleStepChange(idx, 'instruction', e.target.value)}
                                                required
                                                maxLength={150}
                                            />
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Detailed instructions for this step..."
                                                value={step.details}
                                                onChange={e => handleStepChange(idx, 'details', e.target.value)}
                                                rows={3}
                                                required
                                                maxLength={500}
                                            />
                                        </div>
                                        {steps.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn--icon btn--remove"
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
            case 'preferences':
                return (
                    <div className="tab-content">
                        <div className="form-card">
                          <h2 className="card-title">
                            <i className="bx bx-food-menu"></i>
                            Recipe Details
                          </h2>
                          <div className="form-content">
                            <div className="form-group">
                              <label className="form-label" htmlFor="edit-cuisine">
                                <i className="bx bx-world"></i>
                                Cuisine
                              </label>
                              <select
                                id="edit-cuisine"
                                name="cuisine"
                                className="form-select"
                                value={cuisine}
                                onChange={e => setCuisine(e.target.value)}
                              >
                                {cuisineOptions.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group">
                              <label className="form-label" htmlFor="edit-cookingTime">
                                <i className="bx bx-time"></i>
                                Cooking Time (minutes)
                              </label>
                              <input
                                id="edit-cookingTime"
                                name="cookingTime"
                                type="number"
                                className="form-input"
                                value={cookingTime}
                                onChange={e => setCookingTime(e.target.value)}
                                min="0"
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label" htmlFor="edit-difficulty">
                                <i className="bx bx-trending-up"></i>
                                Difficulty
                              </label>
                              <select
                                id="edit-difficulty"
                                name="difficulty"
                                className="form-select"
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                              >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                              </select>
                            </div>

                            <div className="form-group">
                              <label className="form-label">
                                <i className="bx bx-purchase-tag"></i>
                                Dietary Categories (multi-select)
                              </label>
                              <div className="dietary-tags-container">
                                {dietaryOptions.map(tag => {
                                  const active = dietaryTags.includes(tag);
                                  return (
                                    <button
                                      type="button"
                                      key={tag}
                                      className={`dietary-tag ${active ? 'active' : ''}`}
                                      onClick={() => handleDietaryTagToggle(tag)}
                                      aria-pressed={active}
                                      aria-label={`Toggle ${tag}`}
                                    >
                                      <i className={`bx ${active ? 'bx-check' : 'bx-plus'}`}></i>
                                      {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
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
                    <h2 className="modal__title">
                        <i className="bx bx-edit-alt"></i>
                        Edit Recipe
                    </h2>
                    <button
                        className="modal__close"
                        onClick={onCancel}
                        type="button"
                        disabled={isLoading}
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
                    <button
                        type="button"
                        className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        <i className="bx bx-food-menu"></i>
                        Preferences
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal__form">
                    {renderTabContent()}
                    
                    {error && (
                        <div className="alert alert--error">
                            <i className="bx bx-error-circle alert__icon"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="alert alert--success">
                            <i className="bx bx-check-circle alert__icon"></i>
                            <span>{success}</span>
                        </div>
                    )}
                    
                    <div className="modal__actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn--secondary"
                            disabled={isLoading}
                        >
                            <i className="bx bx-x"></i>
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
                                    Updating Recipe...
                                </span>
                            ) : (
                                <>
                                    <i className="bx bx-save"></i>
                                    Update Recipe
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRecipe;