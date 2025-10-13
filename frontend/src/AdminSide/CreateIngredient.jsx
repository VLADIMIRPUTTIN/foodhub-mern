import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
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
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
            
            const response = await axios.post(
                `${baseURL}/api/ingredients`,
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
            
            // Call the callback function (which will handle modal closing)
            if (onCreated) {
                onCreated();
            }
            
            // Clear success message after 3 seconds (in case modal doesn't close)
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
            <motion.div 
                className="create-ingredient__container"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                    duration: 0.3, 
                    ease: [0.4, 0, 0.2, 1],
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                }}
            >
                {/* Compact Header Section */}
                <div className="create-ingredient__header">
                    <div className="header-icon">
                        <i className="bx bx-leaf"></i>
                    </div>
                    <div className="header-text">
                        <h2 className="create-ingredient__title">Add New Ingredient</h2>
                        <p className="create-ingredient__subtitle">Expand your culinary collection</p>
                    </div>
                </div>
                
                {/* Compact Form Section */}
                <motion.form 
                    onSubmit={handleSubmit} 
                    className="create-ingredient__form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                >
                    <div className="form-group">
                        <label htmlFor="ingredient-name" className="form-label">
                            <i className="bx bx-food-menu"></i>
                            <span>Ingredient Name</span>
                        </label>
                        <div className="input-container">
                            <input
                                id="ingredient-name"
                                type="text"
                                placeholder="e.g., Fresh Basil, Olive Oil, Tomatoes..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="form-input"
                                required
                                disabled={loading}
                            />
                            <div className="input-focus-ring"></div>
                        </div>
                    </div>
                    
                    {/* Submit Button */}
                    <motion.button 
                        type="submit" 
                        disabled={loading || !name.trim()}
                        className="submit-btn"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        {loading ? (
                            <div className="btn-loading">
                                <div className="loading-spinner"></div>
                                <span>Creating...</span>
                            </div>
                        ) : (
                            <div className="btn-content">
                                <i className="bx bx-plus-circle"></i>
                                <span>Add Ingredient</span>
                            </div>
                        )}
                    </motion.button>
                </motion.form>
                
                {/* Compact Alert Messages */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            className="alert alert--error"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="alert-icon">
                                <i className="bx bx-error-circle"></i>
                            </div>
                            <div className="alert-content">
                                <div className="alert-message">{error}</div>
                            </div>
                            <button 
                                className="alert-close"
                                onClick={() => setError("")}
                                type="button"
                            >
                                <i className="bx bx-x"></i>
                            </button>
                        </motion.div>
                    )}
                    
                    {success && (
                        <motion.div
                            className="alert alert--success"
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="alert-icon">
                                <i className="bx bx-check-circle"></i>
                            </div>
                            <div className="alert-content">
                                <div className="alert-message">{success}</div>
                            </div>
                            <button 
                                className="alert-close"
                                onClick={() => setSuccess("")}
                                type="button"
                            >
                                <i className="bx bx-x"></i>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Minimal Decorative Elements */}
                <div className="decoration-elements">
                    <div className="deco-leaf deco-leaf--1">
                        <i className="bx bx-leaf"></i>
                    </div>
                    <div className="deco-leaf deco-leaf--2">
                        <i className="bx bx-leaf"></i>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateIngredient;