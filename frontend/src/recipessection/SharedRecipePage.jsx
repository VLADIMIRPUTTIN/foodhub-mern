import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../pages/NavbarPage";
import "./SharedRecipePage.scss";

const SharedRecipePage = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        
        // Remove credentials requirement to allow unauthenticated access
        fetch(`${baseURL}/api/recipes/shared`)
            .then(res => res.json())
            .then(data => {
                // Make sure to populate createdBy in your backend for this to work!
                if (Array.isArray(data.recipes)) {
                    setRecipes(data.recipes);
                } else if (Array.isArray(data.sharedRecipes)) {
                    setRecipes(data.sharedRecipes);
                } else {
                    setRecipes([]);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching shared recipes:', error);
                setRecipes([]);
                setLoading(false);
            });
    }, []);

    const getImageUrl = (recipe) => {
        if (!recipe.imageUrl) {
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        if (recipe.imageUrl.startsWith('http')) {
            return recipe.imageUrl;
        }
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
        if (import.meta.env.MODE === "development") {
            return `http://localhost:5000/${cleanPath}`;
        }
        return `/${cleanPath}`;
    };

    return (
        <>
            <Navbar />
            <div className="shared-recipes-page">
                <div className="page-container">
                    {/* Simplified Header */}
                    <div className="community-header">
                        <div className="header-badge">
                            <i className="bx bx-group"></i>
                            Community Showcase
                        </div>
                        <h1>
                            Discover <span className="highlight">Amazing</span> Recipes
                        </h1>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <i className="bx bx-loader-alt loading-spinner"></i>
                            Loading delicious recipes...
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="no-recipes-enhanced">
                            <div className="no-recipes-animation">
                                <div className="chef-hat">
                                    <i className="bx bx-restaurant"></i>
                                </div>
                                <div className="floating-ingredients">
                                    <div className="ingredient-float ing-1">🥕</div>
                                    <div className="ingredient-float ing-2">🍅</div>
                                    <div className="ingredient-float ing-3">🧄</div>
                                    <div className="ingredient-float ing-4">🌿</div>
                                </div>
                            </div>
                            <div className="no-recipes-content">
                                <h3 className="no-recipes-title">No Community Recipes Yet</h3>
                                <p className="no-recipes-subtitle">
                                    Be the first to share your culinary masterpiece with our community! 
                                    Create and share recipes to inspire fellow food enthusiasts.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="recipes-grid">
                            {recipes.map(recipe => (
                                <div
                                    key={recipe._id}
                                    className="recipe-card"
                                    onClick={() => navigate(`/recipe/${recipe._id}`)}
                                    title="View full recipe"
                                >
                                    <div className="recipe-image">
                                        <div className="community-badge">
                                            <i className="bx bx-user"></i>
                                            Community
                                        </div>
                                        <img
                                            src={getImageUrl(recipe)}
                                            alt={recipe.title || "Recipe"}
                                            onError={e => {
                                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="recipe-content">
                                        <h3 className="recipe-title">{recipe.title}</h3>
                                        <p className="recipe-desc">{recipe.description}</p>
                                        <div className="recipe-category">{recipe.category}</div>
                                        
                                        {/* Enhanced Author Info */}
                                        <div className="recipe-meta author-meta">
                                            <i className="bx bx-user-circle"></i>
                                            <span>
                                                {recipe.createdBy?.name
                                                    ? recipe.createdBy.name
                                                    : recipe.createdBy?.email
                                                        ? recipe.createdBy.email.split('@')[0]
                                                        : "Anonymous Chef"}
                                            </span>
                                        </div>
                                        
                                        {/* Additional Meta Information */}
                                        <div className="recipe-meta-row">
                                            {recipe.cookingTime && (
                                                <div className="recipe-meta">
                                                    <i className="bx bx-time"></i>
                                                    <span>{recipe.cookingTime} mins</span>
                                                </div>
                                            )}
                                            {recipe.createdAt && (
                                                <div className="recipe-meta">
                                                    <i className="bx bx-calendar"></i>
                                                    <span>{new Date(recipe.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default SharedRecipePage;