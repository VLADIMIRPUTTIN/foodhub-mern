import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import RecipeConfirmationModal from './RecipeConfirmationModal';
import './EditRecipeModal.scss';

const categories = ['Breakfast', 'Lunch', 'Dinner'];

const EditRecipe = ({ recipe, onRecipeUpdated, onCancel }) => {
    const [image, setImage] = useState(null);
    const [name, setName] = useState(recipe?.name || '');
    const [category, setCategory] = useState(recipe?.category || '');
    const [description, setDescription] = useState(recipe?.description || '');
    const [ingredients, setIngredients] = useState(recipe?.ingredients || [{ amount: '', unit: '', name: '' }]);
    const [steps, setSteps] = useState(recipe?.steps || [{ instruction: '', details: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [pendingRecipe, setPendingRecipe] = useState(null);
    const [allIngredients, setAllIngredients] = useState([]);

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

    const handleSubmit = (e) => {
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

        let imageUrl = recipe.imageUrl || '';
        if (image) {
            imageUrl = await toBase64(image);
        }

        try {
            await axios.patch(
                `http://localhost:5000/api/recipes/${recipe._id}`,
                {
                    name: pendingRecipe.name,
                    category: pendingRecipe.category,
                    description: pendingRecipe.description,
                    ingredients: pendingRecipe.ingredients,
                    steps: pendingRecipe.steps,
                    imageUrl
                },
                { withCredentials: true }
            );
            Swal.fire('Success', 'Recipe updated!', 'success');
            if (onRecipeUpdated) onRecipeUpdated();
        } catch (err) {
            Swal.fire('Error', 'Failed to update recipe', 'error');
        } finally {
            setIsLoading(false);
            setPendingRecipe(null);
        }
    };

    const handleReject = () => {
        setShowModal(false);
        setPendingRecipe(null);
    };

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', maxWidth: 700 }}>
                <h2 className="section-title">Edit Recipe</h2>
                <form className="create-recipe-form" onSubmit={handleSubmit}>
                    {/* Image Section */}
                    <div className="form-card">
                        <label className="form-label">Change Image</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} />
                        {(image || recipe.imageUrl) && (
                            <img
                                src={image ? URL.createObjectURL(image) : recipe.imageUrl}
                                alt="Preview"
                                className="preview-img"
                            />
                        )}
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

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Update Recipe'}
                        </button>
                        <button type="button" className="btn-primary" style={{ background: "#aaa" }} onClick={onCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
                <RecipeConfirmationModal
                    open={showModal}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    {...pendingRecipe}
                />
            </div>
        </div>
    );
};

export default EditRecipe;