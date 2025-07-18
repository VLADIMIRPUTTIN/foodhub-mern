import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './CreateRecipe.scss';
import RecipeConfirmationModal from './RecipeConfirmationModal';

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
    const [showModal, setShowModal] = useState(false);
    const [pendingRecipe, setPendingRecipe] = useState(null);
    const [allIngredients, setAllIngredients] = useState([]);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        // Fetch all ingredients from backend
        const fetchIngredients = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/ingredients" : "/api/ingredients"}`
                );
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPendingRecipe({
            name,
            category,
            description,
            ingredients,
            steps,
            image
        });
        setShowModal(true);
    };

    const handleAccept = async () => {
        setShowModal(false);
        setIsLoading(true);

        try {
            // Create FormData for multipart/form-data request
            const formData = new FormData();
            formData.append('title', pendingRecipe.name);
            formData.append('category', pendingRecipe.category);
            formData.append('description', pendingRecipe.description);
            formData.append('ingredients', JSON.stringify(pendingRecipe.ingredients));
            formData.append('instructions', JSON.stringify(pendingRecipe.steps));
            if (pendingRecipe.image) {
                formData.append('image', pendingRecipe.image);
            }

            const response = await axios.post(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/recipes" : "/api/recipes"}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                Swal.fire('Success', 'Recipe saved successfully!', 'success');
                setName('');
                setCategory('');
                setDescription('');
                setIngredients([{ amount: '', unit: '', name: '' }]);
                setSteps([{ instruction: '', details: '' }]);
                setImage(null);
                setImagePreview(null);
                if (onRecipeSaved) onRecipeSaved();
            }
        } catch (err) {
            let errorMessage = 'Failed to save recipe';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid recipe data. Please check all required fields.';
            } else if (err.response?.status === 401) {
                errorMessage = 'You need to be logged in to create recipes.';
            }
            Swal.fire('Error', errorMessage, 'error');
        } finally {
            setIsLoading(false);
            setPendingRecipe(null);
        }
    };

    const handleReject = () => {
        setShowModal(false);
        setPendingRecipe(null);
    };

    // Enhanced UI with tab navigation and compact sections
    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="tab-pane active">
                        <div className="form-card">
                            <label className="form-label">Recipe Name *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-card">
                            <label className="form-label">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} required>
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-card">
                            <label className="form-label">Description *</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>
                        <div className="form-card image-section">
                            <label className="form-label">Recipe Image</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {imagePreview && <img src={imagePreview} alt="Preview" className="preview-img" />}
                            <div className="form-note">Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP</div>
                        </div>
                    </div>
                );
            case 'ingredients':
                return (
                    <div className="tab-pane active">
                        <div className="form-card">
                            <h3 className="card-title">Ingredients</h3>
                            {ingredients.map((ing, idx) => (
                                <div key={idx} className="ingredient-row">
                                    <input
                                        type="text"
                                        placeholder="Amount"
                                        value={ing.amount}
                                        onChange={e => handleIngredientChange(idx, 'amount', e.target.value)}
                                        className="ingredient-amount"
                                        required
                                    />
                                    <select
                                        value={ing.unit}
                                        onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                                        className="ingredient-unit"
                                        required
                                    >
                                        <option value="">Select Unit</option>
                                        {units.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={ing.name}
                                        onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
                                        className="ingredient-name"
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
                                        <button type="button" className="remove-btn" onClick={() => removeIngredient(idx)}>Remove</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="add-btn" onClick={addIngredient}>Add Ingredient</button>
                        </div>
                    </div>
                );
            case 'steps':
                return (
                    <div className="tab-pane active">
                        <div className="form-card">
                            <h3 className="card-title">Preparation Steps</h3>
                            {steps.map((step, idx) => (
                                <div key={idx} className="step-row">
                                    <input
                                        type="text"
                                        placeholder="Instruction"
                                        value={step.instruction}
                                        onChange={e => handleStepChange(idx, 'instruction', e.target.value)}
                                        className="step-instruction"
                                        required
                                    />
                                    <textarea
                                        placeholder="Preparation Details"
                                        value={step.details}
                                        onChange={e => handleStepChange(idx, 'details', e.target.value)}
                                        className="step-details"
                                        required
                                    />
                                    {steps.length > 1 && (
                                        <button type="button" className="remove-btn" onClick={() => removeStep(idx)}>Remove</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="add-btn" onClick={addStep}>Add Step</button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="create-recipe-admin">
            <h2 className="section-title">Create Recipe</h2>
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
                    className={`tab-button ${activeTab === 'steps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('steps')}
                >
                    <i className="bx bx-detail"></i>
                    <span>Steps</span>
                </button>
            </div>
            <form className="create-recipe-form" onSubmit={handleSubmit}>
                <div className="tab-content">
                    {renderTabContent()}
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Recipe'}
                </button>
            </form>
            <RecipeConfirmationModal
                open={showModal}
                onAccept={handleAccept}
                onReject={handleReject}
                {...pendingRecipe}
            />
        </div>
    );
};

export default CreateRecipe;