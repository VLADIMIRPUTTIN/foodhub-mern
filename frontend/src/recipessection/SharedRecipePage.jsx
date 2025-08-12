import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../pages/NavbarPage";
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/authStore';
import CommunityRateRecipe from '../components/CommunityRateRecipe';
import RatingModal from '../components/RatingModal';
import "./SharedRecipePage.scss";

const SharedRecipePage = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedRecipeForRating, setSelectedRecipeForRating] = useState(null);
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { isAuthenticated } = useAuthStore();

    // Fetch shared recipes from the server
    const fetchSharedRecipes = () => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        
        fetch(`${baseURL}/api/recipes/shared`)
            .then(res => res.json())
            .then(data => {
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
    };

    useEffect(() => {
        fetchSharedRecipes();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleRecipeApproved = () => {
                fetchSharedRecipes();
            };

            socket.on('recipeApproved', handleRecipeApproved);

            return () => {
                socket.off('recipeApproved', handleRecipeApproved);
            };
        }
    }, [socket]);

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

    const handleRateRecipe = (recipe, e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setSelectedRecipeForRating(recipe);
        setIsRatingModalOpen(true);
    };

    const handleRatingModalClose = (updatedRecipe) => {
        setIsRatingModalOpen(false);
        setSelectedRecipeForRating(null);
        
        if (updatedRecipe) {
            fetchSharedRecipes();
        }
    };

    const handleCardClick = (recipeId) => {
        navigate(`/recipe/${recipeId}`);
    };

    return (
        <>
            <Navbar />
            <div className="shared-recipes-page">
                <div className="page-container">
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
                                    onClick={() => handleCardClick(recipe._id)}
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
                                        
                                        {/* Match RecipePage layout: category and rate button in same row */}
                                        <div className="recipe-meta">
                                            <div className="recipe-category">{recipe.category}</div>
                                            <CommunityRateRecipe 
                                                recipe={recipe}
                                                onRateClick={handleRateRecipe}
                                            />
                                        </div>
                                        
                                        {/* Rating Display */}
                                        {recipe.averageRating > 0 && (
                                            <div className="recipe-rating-display">
                                                <div className="stars">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <i 
                                                            key={star}
                                                            className={`bx ${star <= Math.round(recipe.averageRating) ? 'bxs-star' : 'bx-star'}`}
                                                            style={{ color: '#CF996C' }}
                                                        ></i>
                                                    ))}
                                                </div>
                                                <span className="rating-text">
                                                    {recipe.averageRating.toFixed(1)} ({recipe.ratings?.length || 0} {recipe.ratings?.length === 1 ? 'rating' : 'ratings'})
                                                </span>
                                            </div>
                                        )}
                                        
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

            {/* Rating Modal */}
            <RatingModal
                isOpen={isRatingModalOpen}
                onClose={handleRatingModalClose}
                recipe={selectedRecipeForRating}
            />
        </>
    );
};

export default SharedRecipePage;