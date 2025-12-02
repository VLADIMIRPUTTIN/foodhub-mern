import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../pages/NavbarPage";
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/authStore';
import CommunityRateRecipe from '../components/CommunityRateRecipe';
import RatingModal from '../components/RatingModal';
import axios from "axios"; // ADDED
import CommentModal from './components/CommentModal'; // ADDED
import "./SharedRecipePage.scss";
import api from '../utils/apiClient';

const SharedRecipePage = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedRecipeForRating, setSelectedRecipeForRating] = useState(null);

    // ADDED: favorites and comments state
    const [favoriteSet, setFavoriteSet] = useState(new Set());
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [selectedRecipeForComment, setSelectedRecipeForComment] = useState(null);

    const navigate = useNavigate();
    const { socket } = useSocket();
    const { isAuthenticated } = useAuthStore();

    // Fetch shared recipes from the server
    const fetchSharedRecipes = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/recipes/shared`);
            const list = Array.isArray(data.recipes) ? data.recipes
                        : Array.isArray(data.sharedRecipes) ? data.sharedRecipes
                        : [];
            setRecipes(list);
        } catch (error) {
            console.error('Error fetching shared recipes:', error);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    // ADDED: fetch favorites for current user
    const fetchFavorites = async () => {
        if (!isAuthenticated) {
            setFavoriteSet(new Set());
            return;
        }
        try {
            const { data } = await axios.get(`/api/favorites`);
            const ids = (data?.favorites || [])
                .map(f => f.recipe?._id)
                .filter(Boolean);
            setFavoriteSet(new Set(ids));
        } catch (err) {
            console.error('Error fetching favorites:', err);
        }
    };

    useEffect(() => {
        fetchSharedRecipes();
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchFavorites();
    }, [isAuthenticated]);

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

    const isFavorited = (id) => favoriteSet.has(id);

    const handleToggleFavorite = async (recipe, e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        const id = recipe._id;
        try {
            if (isFavorited(id)) {
                await axios.delete(`/api/favorites/${id}`);
                const next = new Set(favoriteSet);
                next.delete(id);
                setFavoriteSet(next);
            } else {
                await axios.post(`/api/favorites`, { recipeId: id });
                const next = new Set(favoriteSet);
                next.add(id);
                setFavoriteSet(next);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const handleOpenComments = (recipe, e) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setSelectedRecipeForComment(recipe);
        setIsCommentOpen(true);
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

    // ADDED: update comment count in list after add/delete
    const handleCommentUpdate = (recipeId, action) => {
        setRecipes(prev =>
            prev.map(r =>
                r._id === recipeId
                    ? { ...r, commentCount: Math.max(0, (r.commentCount || 0) + (action === 'add' ? 1 : -1)) }
                    : r
            )
        );
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
                                        {/* Favorite quick button on image */}
                                        <button
                                            className={`favorite-fab ${isFavorited(recipe._id) ? 'favorited' : ''}`}
                                            onClick={(e) => handleToggleFavorite(recipe, e)}
                                            aria-label="Toggle favorite"
                                            title={isFavorited(recipe._id) ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            <i className={`bx ${isFavorited(recipe._id) ? 'bxs-heart' : 'bx-heart'}`}></i>
                                        </button>
                                    </div>
                                    <div className="recipe-content">
                                        <h3 className="recipe-title">{recipe.title}</h3>
                                        <p className="recipe-desc">{recipe.description}</p>
                                        
                                        {/* Category + Rate button */}
                                        <div className="recipe-meta">
                                            <div className="recipe-category">{recipe.category}</div>
                                            <CommunityRateRecipe 
                                                recipe={recipe}
                                                onRateClick={handleRateRecipe}
                                            />
                                        </div>

                                        {/* Rating display */}
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

                                        {/* Author */}
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

                                        {/* Time + date */}
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

                                        {/* ADDED: actions row */}
                                        <div className="card-actions">
                                            <button
                                                className="comment-btn"
                                                onClick={(e) => handleOpenComments(recipe, e)}
                                                title="View/Add comments"
                                            >
                                                <i className="bx bx-message-rounded-dots"></i>
                                                <span>{recipe.commentCount || 0}</span>
                                            </button>
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

            {/* ADDED: Comment Modal */}
            <CommentModal
                isOpen={isCommentOpen}
                onClose={() => setIsCommentOpen(false)}
                recipe={selectedRecipeForComment}
                onCommentUpdate={handleCommentUpdate}
            />
        </>
    );
};

export default SharedRecipePage;