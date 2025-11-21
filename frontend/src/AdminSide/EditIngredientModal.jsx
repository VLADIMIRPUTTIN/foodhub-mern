// filepath: c:\Users\PCWORX\OneDrive\Desktop\foodhub-mern\frontend\src\AdminSide\EditIngredientModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import "./EditRecipeModal.scss";

const EditIngredientModal = ({ ingredient, onUpdated, onCancel, isOpen }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (ingredient) {
            setName(ingredient.name);
            setError("");
            setSuccess("");
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
        setSuccess("");
        
        try {
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            const response = await axios.put(
                `${baseURL}/api/ingredients/${ingredient._id}`,
                { name: name.trim() },
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setSuccess("Ingredient updated successfully!");
            
            setTimeout(() => {
                onUpdated(response.data.ingredient);
            }, 1000);
            
        } catch (err) {
            console.error("Update ingredient error:", err);
            if (err.response?.status === 401) {
                setError("You must be logged in to edit ingredients");
            } else if (err.response?.status === 404) {
                setError("Ingredient not found");
            } else if (err.response?.status === 400) {
                setError(err.response?.data?.message || "Invalid ingredient data");
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
            <div className="modal" style={{ maxWidth: '500px' }}>
                <div className="modal__header">
                    <h2 className="modal__title">
                        <i className="bx bx-edit-alt"></i>
                        Edit Ingredient
                    </h2>
                    <button 
                        className="modal__close"
                        onClick={onCancel}
                        type="button"
                        disabled={loading}
                    >
                        <i className="bx bx-x"></i>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal__form">
                    <div className="form-card">
                        <div className="form-group">
                            <label htmlFor="edit-ingredient-name" className="form-label">
                                <i className="bx bx-food-tag"></i>
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
                                maxLength={100}
                            />
                            <p className="form-description">
                                <i className="bx bx-info-circle"></i>
                                Update the name of this ingredient (max 100 characters)
                            </p>
                        </div>

                        {/* Original name display */}
                        <div className="form-group">
                            <label className="form-label">
                                <i className="bx bx-history"></i>
                                Original Name
                            </label>
                            <div style={{
                                padding: '0.75rem 1rem',
                                background: 'hsl(var(--muted))',
                                borderRadius: '8px',
                                color: 'hsl(var(--muted-foreground))',
                                fontStyle: 'italic',
                                fontSize: '0.95rem'
                            }}>
                                {ingredient?.name}
                            </div>
                        </div>
                    </div>
                    
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
                            disabled={loading}
                        >
                            <i className="bx bx-x"></i>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading || !name.trim() || name.trim() === ingredient?.name}
                            className="btn btn--primary"
                        >
                            {loading ? (
                                <span className="btn__loading">
                                    <span className="spinner"></span>
                                    Updating...
                                </span>
                            ) : (
                                <>
                                    <i className="bx bx-save"></i>
                                    Update Ingredient
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditIngredientModal;