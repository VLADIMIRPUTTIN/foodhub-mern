import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './CreateRecipe.scss';
import RecipeConfirmationModal from './RecipeConfirmationModal';

const categories = ['Breakfast', 'Lunch', 'Dinner'];

const CreateRecipe = ({ onRecipeSaved }) => {
    const [image, setImage] = useState(null);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState([{ amount: '', unit: '', name: '' }]);
    const [steps, setSteps] = useState([{ instruction: '', details: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingRecipe, setPendingRecipe] = useState(null);
    const [allIngredients, setAllIngredients] = useState([]);

    useEffect(() => {
        // Fetch all ingredients from backend
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

    const handleImageChange = (e) => setImage(e.target.files[0]);

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
            
            // Add basic fields - CORRECTED FIELD NAMES TO MATCH BACKEND
            formData.append('title', pendingRecipe.name); // Backend expects 'title', not 'name'
            formData.append('category', pendingRecipe.category);
            formData.append('description', pendingRecipe.description);
            
            // Add ingredients as JSON string
            formData.append('ingredients', JSON.stringify(pendingRecipe.ingredients));
            
            // Add steps as JSON string - CORRECTED FIELD NAME
            formData.append('instructions', JSON.stringify(pendingRecipe.steps)); // Backend expects 'instructions', not 'steps'
            
            // Add image file if exists
            if (pendingRecipe.image) {
                formData.append('image', pendingRecipe.image);
            }

            // Debug: Log formData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            const response = await axios.post(
                "http://localhost:5000/api/recipes",
                formData,
                {
                    headers: {
                        // Don't set Content-Type manually for FormData
                        // Let axios set it automatically with boundary
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                Swal.fire('Success', 'Recipe saved successfully!', 'success');
                // Reset form
                setName('');
                setCategory('');
                setDescription('');
                setIngredients([{ amount: '', unit: '', name: '' }]);
                setSteps([{ instruction: '', details: '' }]);
                setImage(null);
                
                if (onRecipeSaved) onRecipeSaved();
            }
        } catch (err) {
            console.error('Recipe creation error:', err);
            console.error('Error response:', err.response?.data);
            
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


    return (
        <div className="create-recipe-admin">
            <h2 className="section-title">Create Recipe</h2>
            <form className="create-recipe-form" onSubmit={handleSubmit}>
                {/* Image Section */}
                <div className="form-card">
                    <label className="form-label">Choose Image</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    {image && <img src={URL.createObjectURL(image)} alt="Preview" className="preview-img" />}
                    <div className="form-note">Maximum file size: 5MB. Supported formats: JPEG, PNG, GIF, WebP</div>
                </div>

                {/* Details Section */}
                <div className="form-card">
                    <div className="form-group">
                        <label className="form-label">Recipe Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} required>
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                </div>

                {/* Ingredients Section */}
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
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="pcs">pcs</option>
                                <option value="tbsp">tbsp</option>
                                <option value="tsp">tsp</option>
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

                {/* Steps Section */}
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