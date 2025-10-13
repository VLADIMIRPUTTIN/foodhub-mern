import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import './TimeBasedRecipes.scss';
import { getImageUrl } from './utils/ingredientUtils';

const TimeBasedRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [mealType, setMealType] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Determine meal type based on current time
        const getCurrentMealType = () => {
            const currentHour = new Date().getHours();
            
            // Time ranges for different meals
            if (currentHour >= 5 && currentHour < 11) {
                return 'Breakfast';
            } else if (currentHour >= 11 && currentHour < 15) {
                return 'Lunch';
            } else if (currentHour >= 15 && currentHour < 18) {
                return 'Snack';
            } else {
                return 'Dinner';
            }
        };

        const determinedMealType = getCurrentMealType();
        setMealType(determinedMealType);

        // Fetch recipes filtered by the meal type
        const fetchRecipesByMealType = async () => {
            setLoading(true);
            setError(null);
            try {
                const baseURL = import.meta.env.MODE === "development"
                    ? "http://localhost:5000"
                    : "";
                
                const response = await axios.get(`${baseURL}/api/recipes`);
                let allRecipes = [];
                
                if (response.data.success && response.data.recipes) {
                    allRecipes = response.data.recipes;
                } else if (Array.isArray(response.data)) {
                    allRecipes = response.data;
                } else {
                    allRecipes = [];
                }
                
                // Filter recipes by category (meal type) - case insensitive match
                const filteredRecipes = allRecipes.filter(recipe => 
                    recipe.category && recipe.category.toLowerCase() === determinedMealType.toLowerCase()
                );
                
                // If no recipes for current meal type, try to get any recipes as fallback
                if (filteredRecipes.length === 0) {
                    setRecipes(allRecipes.slice(0, 4));
                } else {
                    // Limit to 4 recipes
                    setRecipes(filteredRecipes.slice(0, 4));
                }
            } catch (error) {
                console.error('Error fetching time-based recipes:', error);
                setError('Failed to load recipes. Please try again later.');
                setRecipes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipesByMealType();
    }, []);

    const handleRecipeClick = (recipeId) => {
        navigate(`/recipe/${recipeId}`);
    };

    // Get greeting based on time
    const getGreeting = () => {
        const currentHour = new Date().getHours();
        
        if (currentHour >= 5 && currentHour < 12) {
            return 'Good Morning';
        } else if (currentHour >= 12 && currentHour < 17) {
            return 'Good Afternoon';
        } else {
            return 'Good Evening';
        }
    };

    // Get the appropriate meal icon
    const getMealIcon = () => {
        switch(mealType.toLowerCase()) {
            case 'breakfast': return "bx bx-coffee";
            case 'lunch': return "bx bx-bowl-rice";
            case 'dinner': return "bx bx-restaurant";
            case 'snack': return "bx bx-cookie";
            default: return "bx bx-food-menu";
        }
    };

    return (
        <div className="time-based-recipes">
            <div className="time-header">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="greeting">{getGreeting()}!</span> 
                    <span className="meal-suggestion">Here are some <span className="highlight">{mealType}</span> ideas</span>
                </motion.h2>
                <motion.div 
                    className="time-header-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <i className={getMealIcon()}></i>
                </motion.div>
            </div>

            {loading ? (
                <div className="time-recipes-loading">
                    <div className="spinner"></div>
                    <p>Finding {mealType.toLowerCase()} ideas for you...</p>
                </div>
            ) : error ? (
                <div className="time-recipes-error">
                    <i className="bx bx-error-circle"></i>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Try Again</button>
                </div>
            ) : recipes.length > 0 ? (
                <div className="time-recipes-grid">
                    {recipes.map((recipe, index) => (
                        <motion.div 
                            key={recipe._id} 
                            className="time-recipe-card"
                            onClick={() => handleRecipeClick(recipe._id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                        >
                            <div className="time-recipe-image">
                                <img 
                                    src={getImageUrl(recipe)} 
                                    alt={recipe.title || recipe.name} 
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                    }}
                                />
                                <div className="time-recipe-overlay"></div>
                            </div>
                            <div className="time-recipe-content">
                                <h3>{recipe.title || recipe.name}</h3>
                                <p className="time-recipe-desc">{recipe.description}</p>
                                {recipe.cookingTime && (
                                    <div className="time-recipe-meta">
                                        <i className="bx bx-time"></i>
                                        <span>{recipe.cookingTime} mins</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="no-time-recipes">
                    <div className="no-recipes-icon">
                        <i className={getMealIcon()}></i>
                    </div>
                    <h3>No {mealType} Recipes Available</h3>
                    <p>Check back later or try browsing all recipes!</p>
                    <button 
                        className="browse-all-btn" 
                        onClick={() => navigate('/recipes')}
                    >
                        Browse All Recipes
                    </button>
                </div>
            )}
            
            {recipes.length > 0 && (
                <div className="view-all-container">
                    <button 
                        className="view-all-btn" 
                        onClick={() => navigate('/recipes')}
                    >
                        <span>View All {mealType} Recipes</span>
                        <i className="bx bx-right-arrow-alt"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TimeBasedRecipes;