import { useState } from "react";
import axios from "axios";
import "./CreateIngredient.scss"; // Reuse the same styles

const EditIngredient = ({ ingredient, onUpdated, onCancel }) => {
    const [name, setName] = useState(ingredient.name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const response = await axios.put(
                `http://localhost:5000/api/ingredients/${ingredient._id}`,
                { name },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            onUpdated(response.data.ingredient);
        } catch (err) {
            console.error("Update ingredient error:", err);
            if (err.response?.status === 401) {
                setError("You must be logged in to edit ingredients");
            } else if (err.response?.status === 404) {
                setError("Ingredient not found");
            } else {
                setError(err.response?.data?.message || "Failed to update ingredient");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-ingredient-modal">
            <div className="modal-content">
                <h2>Edit Ingredient</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Ingredient name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                    <div className="modal-actions">
                        <button type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Update Ingredient"}
                        </button>
                        <button type="button" onClick={onCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
                {error && <div className="error-msg">{error}</div>}
            </div>
        </div>
    );
};

export default EditIngredient;