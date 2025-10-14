import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './NoRecipesFound.scss';

const NoRecipesFound = ({ selectedIngredients = [] }) => {
    const [allRecipes, setAllRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchAllRecipes = async () => {
            try {
                const baseURL = import.meta.env.MODE === "development"
                    ? "http://localhost:5000"
                    : "";
                const response = await axios.get(`${baseURL}/api/recipes`);
                if (response.data.success && response.data.recipes) {
                    setAllRecipes(response.data.recipes);
                }
            } catch (error) {
                console.error('Error fetching recipes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllRecipes();
    }, []);

    // Helper function to get image URL
    const getImageUrl = (recipe) => {
        if (!recipe.imageUrl) {
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        if (recipe.imageUrl.startsWith('http')) {
            return recipe.imageUrl;
        }
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
        const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        return `${baseURL}/${cleanPath}`;
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
                </div>
            </div>

            {/* Display all available recipes below the "no recipes found" message */}
            {!loading && allRecipes.length > 0 && (
                <div className="all-recipes-section">
                    <h2 className="all-recipes-title">All Other Recipes({allRecipes.length})</h2>
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
                                        <div className="recipe-category">{recipe.category}</div>
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