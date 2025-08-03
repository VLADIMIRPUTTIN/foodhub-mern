import { useState } from "react";
import axios from "axios";
import "./CreateIngredient.scss";

const CreateIngredient = ({ onCreated }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        
        try {
            const response = await axios.post(
                "http://localhost:5000/api/ingredients",
                { name },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            setSuccess("Ingredient created successfully!");
            setName("");
            if (onCreated) onCreated();
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Create ingredient error:", err);
            if (err.response?.status === 401) {
                setError("You must be logged in to create ingredients");
            } else {
                setError(err.response?.data?.message || "Failed to create ingredient");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-ingredient">
            <div className="create-ingredient__card">
                <div className="create-ingredient__header">
                    <h2 className="create-ingredient__title">Create New Ingredient</h2>
                    <p className="create-ingredient__subtitle">Add a new ingredient to your database</p>
                </div>
                
                <form onSubmit={handleSubmit} className="create-ingredient__form">
                    <div className="form-group">
                        <label htmlFor="ingredient-name" className="form-label">
                            Ingredient Name
                        </label>
                        <input
                            id="ingredient-name"
                            type="text"
                            placeholder="Enter ingredient name..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="form-input"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading || !name.trim()}
                        className="btn btn--primary"
                    >
                        {loading ? (
                            <span className="btn__loading">
                                <span className="spinner"></span>
                                Creating...
                            </span>
                        ) : (
                            "Create Ingredient"
                        )}
                    </button>
                </form>
                
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
            </div>
        </div>
    );
};

export default CreateIngredient;