import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './TimeBasedRecipes.scss';

const TimeBasedRecipes = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [recipes, setRecipes] = useState([]);
    const [mealType, setMealType] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine current meal type based on time
    const determineMealType = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'Breakfast';
        if (hour >= 11 && hour < 15) return 'Lunch';
        if (hour >= 15 && hour < 18) return 'Snack';
        return 'Dinner';
    };

    // Check recipe image URL
    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return 'https://via.placeholder.com/300x200?text=No+Image';
        if (imageUrl.startsWith('http')) return imageUrl;
        const baseURL = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';
        return `${baseURL}${imageUrl}`;
    };

    // Returns false if recipe contains user's allergens; otherwise returns preference score (or true)
    const matchesUserPreferences = (recipe) => {
        if (!user || !user.hasCompletedOnboarding) return true;

        // Hard block: allergens
        if (user.allergies && user.allergies.length > 0) {
            const hasAllergen = user.allergies.some(allergy => {
                const allergyLower = allergy.toLowerCase();
                const inAllergensList = recipe.allergens && recipe.allergens.some(a =>
                    a.toLowerCase().includes(allergyLower)
                );
                const inIngredients = recipe.ingredients && recipe.ingredients.some(i => {
                    const name = (i.name || i || '').toLowerCase();
                    return name.includes(allergyLower);
                });
                return inAllergensList || inIngredients;
            });
            if (hasAllergen) return false;
        }

        let score = 0;

        // Dietary tags match
        if (user.dietaryPreferences && user.dietaryPreferences.length > 0) {
            const recipeTags = (recipe.dietaryTags || []).map(t => t.toLowerCase());
            const recipeDietCategory = (recipe.dietCategory || '').toLowerCase();
            const recipeDietCategories = (recipe.dietCategories || []).map(t => t.toLowerCase());
            const hasMatch = user.dietaryPreferences.some(pref => {
                const prefLower = pref.toLowerCase();
                return recipeTags.includes(prefLower) ||
                       recipeDietCategory === prefLower ||
                       recipeDietCategories.includes(prefLower);
            });
            if (hasMatch) score += 50;
        }

        // Cuisine match
        if (user.preferredCuisines && user.preferredCuisines.length > 0) {
            const recipeCuisine = (recipe.cuisine || '').toLowerCase();
            const hasMatch = user.preferredCuisines.some(c => c.toLowerCase() === recipeCuisine);
            if (hasMatch) score += 30;
        }

        return score > 0 ? score : true;
    };

    const fetchRecipesByMealType = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const determinedMealType = determineMealType();
            setMealType(determinedMealType);

            const baseURL = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';
            const response = await axios.get(`${baseURL}/api/recipes`);

            let allRecipes = [];
            if (response.data.success && response.data.recipes) {
                allRecipes = response.data.recipes;
            } else if (Array.isArray(response.data)) {
                allRecipes = response.data;
            }

            // Filter by current meal type (case-insensitive)
            const timeFilteredRecipes = allRecipes.filter(recipe =>
                recipe.category && recipe.category.toLowerCase() === determinedMealType.toLowerCase()
            );

            if (user && user.hasCompletedOnboarding) {
                // Remove allergen recipes first
                const safeRecipes = timeFilteredRecipes.filter(r => matchesUserPreferences(r) !== false);

                // Score and sort by preference match
                const scored = safeRecipes.map(recipe => ({
                    ...recipe,
                    prefScore: (() => {
                        const result = matchesUserPreferences(recipe);
                        return result === true ? 0 : (result === false ? -1 : result);
                    })()
                })).sort((a, b) => b.prefScore - a.prefScore);

                if (scored.length > 0) {
                    setRecipes(scored.slice(0, 4));
                } else {
                    // Fallback: any allergen-safe recipes across categories
                    const fallback = allRecipes
                        .filter(r => matchesUserPreferences(r) !== false)
                        .slice(0, 4);
                    setRecipes(fallback);
                }
            } else {
                // No preferences — just show time-based recipes
                if (timeFilteredRecipes.length > 0) {
                    setRecipes(timeFilteredRecipes.slice(0, 4));
                } else {
                    setRecipes(allRecipes.slice(0, 4));
                }
            }
        } catch (err) {
            console.error('Error fetching time-based recipes:', err);
            setError('Failed to load recipes. Please try again later.');
            setRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipesByMealType();
    }, [user]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getMealIcon = () => {
        switch (mealType.toLowerCase()) {
            case 'breakfast': return 'bx bx-coffee';
            case 'lunch': return 'bx bx-restaurant';
            case 'snack': return 'bx bx-cookie';
            default: return 'bx bx-food-menu';
        }
    };

    const handleRecipeClick = (recipeId) => {
        navigate(`/recipe/${recipeId}`);
    };

    return (
        <div className="time-based-recipes">
            <motion.div
                className="time-header"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2>
                    <span className="greeting">{getGreeting()}!</span>
                    <span className="meal-suggestion">
                        {user && user.hasCompletedOnboarding
                            ? `Your Personalized ${mealType} Ideas`
                            : `Here are ${mealType} ideas for you`}
                    </span>
                </h2>
                <motion.div
                    className="time-header-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <i className={getMealIcon()}></i>
                </motion.div>
            </motion.div>

            {isLoading ? (
                <div className="time-recipes-loading">
                    <div className="spinner"></div>
                    <p>Finding {mealType.toLowerCase()} ideas for you...</p>
                </div>
            ) : error ? (
                <div className="time-recipes-error">
                    <i className="bx bx-error-circle"></i>
                    <p>{error}</p>
                    <button onClick={() => fetchRecipesByMealType()}>Try Again</button>
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
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                        >
                            <div className="time-recipe-image">
                                <img
                                    src={getImageUrl(recipe.imageUrl)}
                                    alt={recipe.title || recipe.name}
                                    onError={e => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                    }}
                                />
                                <div className="time-recipe-overlay"></div>
                            </div>
                            <div className="time-recipe-content">
                                <h3>{recipe.title || recipe.name}</h3>
                                <p className="time-recipe-desc">{recipe.description}</p>
                                <div className="time-recipe-meta">
                                    <i className="bx bx-time"></i>
                                    <span>{recipe.cookingTime} mins</span>
                                </div>

                                {/* Preference match badge */}
                                {user?.hasCompletedOnboarding && recipe.prefScore > 0 && (
                                    <div className="preference-match">
                                        <i className="bx bx-check-circle"></i>
                                        <span>Matches your preferences</span>
                                    </div>
                                )}
                                {/* Cuisine badge */}
                                {recipe.cuisine && (
                                    <div className="recipe-cuisine-tag">
                                        {recipe.cuisine}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="no-time-recipes">
                    <div className="no-recipes-icon">
                        <i className="bx bx-food-menu"></i>
                    </div>
                    <h3>No {mealType} Recipes Available</h3>
                    <p>Check back later or try browsing all recipes!</p>
                    <button
                        className="browse-all-btn"
                        onClick={() => navigate('/recipes')}
                    >
                        <span>Browse All Recipes</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default TimeBasedRecipes;
