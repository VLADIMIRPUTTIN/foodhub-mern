import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./RecipeModal.scss";
import { useNavigate } from "react-router-dom";
import MarketList from "../components/MarketList";
import axios from "axios";
import { useAuthStore } from "../store/authStore"; // Add this import

const RecipeModal = ({ open, recipe, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuthStore(); // Get user from auth store
    const [showModal, setShowModal] = useState(false);
    const [showAIInstructions, setShowAIInstructions] = useState(false);
    const [aiInstructions, setAiInstructions] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // Control body scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            setShowModal(true);
        } else {
            document.body.style.overflow = "";
            setShowModal(false);
            setShowAIInstructions(false);
            setAiInstructions("");
        }
        
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Handle ESC key press
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        
        if (open) {
            window.addEventListener("keydown", handleEscape);
        }
        
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [open, onClose]);

    // Function to generate cooking instructions based on available ingredients
    const generateInstructions = async (availableIngredients, missingIngredients) => {
        try {
            setIsLoading(true);
            setShowAIInstructions(true);
            
            // Add this base URL configuration
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
            
            // Make sure credentials are included
            axios.defaults.withCredentials = true;
            
            // Update the axios request with the baseURL
            const response = await axios.post(`${baseURL}/api/vision/generate-cooking-instructions`, {
                recipeName: recipe.name || recipe.title,
                recipeInstructions: recipe.instructions,
                availableIngredients: availableIngredients.map(ing => ing.name),
                missingIngredients: missingIngredients.map(ing => ing.name)
            });
            
            setAiInstructions(response.data.instructions);
        } catch (error) {
            console.error("Error generating instructions:", error);
            
            // Fallback response if API fails
            if (error.response && error.response.status === 500) {
                const availableIngsList = availableIngredients.map(ing => ing.name).join(", ");
                const missingIngsList = missingIngredients.map(ing => ing.name).join(", ");
                
                setAiInstructions(
                    `I see you're making ${recipe.name || recipe.title}.\n\n` +
                    `You have these ingredients: ${availableIngsList}.\n\n` +
                    `You're missing: ${missingIngsList}.\n\n` +
                    `Here are some general tips for adapting recipes when missing ingredients:\n\n` +
                    `1. Look for substitute ingredients with similar properties\n` +
                    `2. Focus on the cooking techniques rather than exact ingredients\n` +
                    `3. Simplify the recipe by omitting non-essential ingredients\n` +
                    `4. Consider a different cooking method that works with what you have\n\n` +
                    `I recommend checking the full recipe and seeing which steps you can still follow with your available ingredients.`
                );
            } else if (error.response && error.response.status === 401) {
                setAiInstructions("You need to be logged in to use this feature. Please log in and try again.");
            } else {
                setAiInstructions("Sorry, I couldn't generate cooking instructions. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!open || !recipe) return null;

    return (
        <AnimatePresence>
            {showModal && (
                <motion.div 
                    className="recipe-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                >
                    <div className="recipe-modal-container" onClick={(e) => e.stopPropagation()}>
                        <motion.div
                            className="recipe-modal-content"
                            initial={{ y: 20, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.98 }}
                            transition={{ 
                                type: "spring", 
                                damping: 25, 
                                stiffness: 300 
                            }}
                        >
                            <motion.button 
                                className="modal-close" 
                                onClick={onClose}
                                whileHover={{ scale: 1.1, rotate: 3 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>

                            <div className="modal-header">
                                <motion.h2 
                                    className="modal-title"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {recipe.name || recipe.title}
                                </motion.h2>
                                
                                <motion.div 
                                    className="modal-category"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <i className="bx bx-restaurant"></i>
                                    {recipe.category}
                                </motion.div>

                                {recipe.averageRating > 0 && (
                                    <motion.div 
                                        className="modal-rating"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <i 
                                                key={star}
                                                className={`bx ${
                                                    star <= Math.round(recipe.averageRating) 
                                                    ? "bxs-star" 
                                                    : "bx-star"
                                                }`}
                                            ></i>
                                        ))}
                                        <span>
                                            {recipe.averageRating.toFixed(1)} 
                                            <span className="rating-count">
                                                ({recipe.ratings?.length || 0})
                                            </span>
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {showAIInstructions ? (
                                <motion.div 
                                    className="modal-ai-instructions"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <h3 className="ai-instructions-title">
                                        <i className="bx bx-bulb"></i>
                                        Cooking Instructions With Available Ingredients
                                    </h3>
                                    
                                    {isLoading ? (
                                        <div className="ai-loading">
                                            <div className="spinner"></div>
                                            <p>Generating your personalized cooking instructions...</p>
                                        </div>
                                    ) : (
                                        <div className="ai-instructions-content">
                                            {aiInstructions.split('\n').map((line, index) => (
                                                <p key={index}>{line}</p>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <button 
                                        className="back-to-recipe-btn"
                                        onClick={() => setShowAIInstructions(false)}
                                    >
                                        <i className="bx bx-arrow-back"></i>
                                        Back to Recipe
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    className="modal-body"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <div className="modal-section">
                                        <h3 className="modal-section-title">
                                            <i className="bx bx-detail"></i>
                                            Description
                                        </h3>
                                        <p className="modal-description">{recipe.description}</p>
                                    </div>

                                    <div className="modal-section">
                                        <h3 className="modal-section-title">
                                            <i className="bx bx-basket"></i>
                                            Ingredients
                                        </h3>
                                        <div className="modal-ingredients-list">
                                            {recipe.ingredients &&
                                                recipe.ingredients.slice(0, 4).map((ing, idx) => (
                                                    <motion.div 
                                                        key={idx} 
                                                        className="modal-ingredient-row"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                                        whileHover={{ 
                                                            x: 8, 
                                                            backgroundColor: 'rgba(255, 248, 238, 1)',
                                                            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
                                                        }}
                                                    >
                                                        <span className="ingredient-icon">
                                                            <i className="bx bx-food-menu"></i>
                                                        </span>
                                                        <span className="ingredient-amount">
                                                            {ing.amount && `${ing.amount} `}
                                                            {ing.unit && `${ing.unit}`}
                                                        </span>
                                                        <span className="ingredient-name">{ing.name}</span>
                                                    </motion.div>
                                                ))
                                            }
                                            {recipe.ingredients && recipe.ingredients.length > 4 && (
                                                <motion.div 
                                                    className="modal-ingredient-more"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.8 }}
                                                    whileHover={{ scale: 1.03 }}
                                                >
                                                    <i className="bx bx-plus-circle"></i>
                                                    {recipe.ingredients.length - 4} more ingredients
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {recipe.price && (
                                        <div className="modal-price-tag">
                                            <i className='bx bx-money'></i>
                                            <span>
                                                Est. Price: ₱{typeof recipe.price === 'number' 
                                                    ? recipe.price.toFixed(2) 
                                                    : "0.00"}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            <motion.button
                                className="modal-view-btn"
                                onClick={() => navigate(`/recipe/${recipe._id}`)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <i className="bx bx-book-open"></i>
                                View Full Recipe
                            </motion.button>
                        </motion.div>
                        
                        <AnimatePresence>
                            {!showAIInstructions && (
                                <MarketList 
                                    recipe={recipe} 
                                    isOpen={open} 
                                    onGenerateInstructions={generateInstructions}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RecipeModal;