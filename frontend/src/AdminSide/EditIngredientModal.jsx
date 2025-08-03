// filepath: c:\Users\PCWORX\OneDrive\Desktop\foodhub-mern\frontend\src\AdminSide\EditIngredientModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import "./CreateIngredient.scss";

const EditIngredientModal = ({ ingredient, onUpdated, onCancel, isOpen }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (ingredient) {
            setName(ingredient.name);
            setError("");
        }
    }, [ingredient]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel]);

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

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    if (!isOpen || !ingredient) return null;

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal">
                <div className="modal__header">
                    <h2 className="modal__title">Edit Ingredient</h2>
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
                
                <form onSubmit={handleSubmit} className="modal__form">
                    <div className="form-group">
                        <label htmlFor="edit-ingredient-name" className="form-label">
                            Ingredient Name
                        </label>
                        <input
                            id="edit-ingredient-name"
                            type="text"
                            placeholder="Enter ingredient name..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="form-input"
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    
                    {error && (
                        <div className="alert alert--error">
                            <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}
                    
                    <div className="modal__actions">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="btn btn--secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading || !name.trim() || name === ingredient.name}
                            className="btn btn--primary"
                        >
                            {loading ? (
                                <span className="btn__loading">
                                    <span className="spinner"></span>
                                    Updating...
                                </span>
                            ) : (
                                "Update Ingredient"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditIngredientModal;