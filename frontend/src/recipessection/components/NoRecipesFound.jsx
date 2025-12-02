import { useState, useEffect } from 'react';
import api from '../../utils/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './NoRecipesFound.scss';
import { buildRecipeImageUrl } from '../../utils/imageUrls';

const NoRecipesFound = ({ onReload, selectedIngredients = [] }) => {
    const [allRecipes, setAllRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchAllRecipes = async () => {
            try {
                const response = await api.get('/api/recipes');
                setAllRecipes(response.data.recipes || []);
            } catch (error) {
                console.error('Error fetching recipes:', error);
                setAllRecipes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllRecipes();
    }, []);

    // Helper function to get image URL
    const getImageUrl = (recipe) => {
        return buildRecipeImageUrl(recipe?.imageUrl);
    };

    const handleRecipeClick = (recipeId) => {
        navigate(`/recipe/${recipeId}`);
    };

    return (
        <>
            <div className="no-recipes-enhanced">
                <div className="no-recipes-animation">
                    <div className="chef-hat">
                        <i className="bx bx-restaurant"></i>
                    </div>
                </div>

                <div className="no-recipes-content">
                    <h3 className="no-recipes-title">No Delicious Recipes Found</h3>
                    <p className="no-recipes-subtitle">
                        {selectedIngredients.length > 0
                            ? "Try adjusting your ingredient selection or search filters"
                            : "Looks like our kitchen is empty right now"
                        }
                    </p>
                    {user?.preferredCuisines?.length > 0 && (
                        <p style={{ marginTop: '15px', color: '#667eea', fontWeight: '600' }}>
                            🌍 Looking for {user.preferredCuisines.join(', ')} recipes
                        </p>
                    )}
                    
                    <button 
                        className="reload-button"
                        onClick={onReload}
                    >
                        <i className="bx bx-refresh"></i>
                        Reload Recipes
                    </button>
                </div>
            </div>

            {/* Display all available recipes below the "no recipes found" message */}
            {!loading && allRecipes.length > 0 && (
                <div className="all-recipes-section">
                    <h2 className="all-recipes-title">All Other Recipes ({allRecipes.length})</h2>
                    <div className="recipes-grid">
                        {allRecipes.map(recipe => (
                            <div 
                                key={recipe._id} 
                                className="recipe-card"
                                onClick={() => handleRecipeClick(recipe._id)}
                            >
                                <div className="recipe-image">
                                    <img 
                                        src={getImageUrl(recipe)} 
                                        alt={recipe.title || recipe.name}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">{recipe.title || recipe.name}</h3>
                                    {recipe.category && (
                                        <div className="recipe-category">
                                            <i className="bx bx-food-menu"></i>
                                            {recipe.category}
                                        </div>
                                    )}
                                    <p className="recipe-desc">{recipe.description?.substring(0, 100) || ""}...</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default NoRecipesFound;