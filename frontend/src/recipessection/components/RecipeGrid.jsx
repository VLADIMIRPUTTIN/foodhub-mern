import { getImageUrl } from './utils/ingredientUtils';
import NoRecipesFound from './NoRecipesFound';
import './RecipeGrid.scss';

const RecipeGrid = ({
    gridRecipes,
    isSwiping,
    setSelectedRecipe,
    handleFavoriteToggle,
    favoriteRecipes,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    gridContainerRef,
    filteredRecipes,
    handleRateClick,
    currentMealType,
    handleCommentClick,
    currentPage,
    userPreferences
}) => {
    return (
        <div 
            className={`recipes-grid ${isSwiping ? 'swiping' : ''}`}
            ref={gridContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {gridRecipes.map((recipe, index) => {
                return (
                    <div key={index} className="recipe-card-wrapper">
                        {recipe ? (
                            <div className={`recipe-card ${recipe.priority === 'time-and-preference' ? 'highlight-card' : ''}`} onClick={() => setSelectedRecipe(recipe)} style={{ cursor: "pointer" }}>
                                <div className="recipe-image">
                                    <img 
                                        src={getImageUrl(recipe)} 
                                        alt={recipe.title || recipe.name}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}
                                    />
                                    {/* Priority badges */}
                                    {recipe.priority && (
                                        <div className="recipe-badges">
                                            {recipe.priority === 'time-and-preference' && (
                                                <span className="time-badge">{currentMealType}</span>
                                            )}
                                            {recipe.priority === 'preference-only' && userPreferences && (
                                                <span className="preference-badge">Recommended</span>
                                            )}
                                            {recipe.priority === 'time-based' && (
                                                <span className="time-badge">{currentMealType}</span>
                                            )}
                                        </div>
                                    )}
                                    
                                    <button
                                        className={`favorite-btn${favoriteRecipes.includes(recipe._id) ? ' favorited' : ''}`}
                                        onClick={e => handleFavoriteToggle(recipe._id, e)}
                                        aria-label={favoriteRecipes.includes(recipe._id) ? "Unfavorite" : "Favorite"}
                                        tabIndex={0}
                                    >
                                        <i className={favoriteRecipes.includes(recipe._id) ? "bx bxs-heart" : "bx bx-heart"}></i>
                                    </button>
                                </div>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">
                                        {recipe.title || recipe.name || 'Untitled Recipe'}
                                    </h3>
                                    
                                    {/* Category Badge */}
                                    {recipe.category && (
                                        <div className="recipe-category">
                                            <i className="bx bx-food-menu"></i>
                                            {recipe.category}
                                        </div>
                                    )}
                                    
                                    {/* Fix: Make sure description shows properly */}
                                    <p className="recipe-desc">
                                        {recipe.description?.substring(0, 100) || "No description"}...
                                    </p>
                                    
                                    {/* Group meta items in container */}
                                    <div className="recipe-meta-container">
                                        {/* Estimated Cost */}
                                        {recipe.price && (
                                            <div className="recipe-price">
                                                <i className="bx bx-money"></i>
                                                ₱{recipe.price.toFixed(2)}
                                            </div>
                                        )}
                                        
                                        {/* Servings */}
                                        {recipe.servings && (
                                            <div className="recipe-servings">
                                                <i className="bx bx-group"></i>
                                                {recipe.servings} servings
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Star Rating (only if there are ratings) */}
                                    {recipe.averageRating > 0 && (
                                        <div className="star-rating-display">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <i 
                                                    key={star} 
                                                    className={`bx ${star <= Math.round(recipe.averageRating) ? 'bxs-star' : 'bx-star'}`}
                                                ></i>
                                            ))}
                                            <span>({recipe.ratings?.length || 0})</span>
                                        </div>
                                    )}
                                    
                                    {/* Action buttons container - fixed at bottom */}
                                    <div className="recipe-action-buttons">
                                        {/* Rate Button */}
                                        <button 
                                            className="recipe-action-btn rate-btn" 
                                            onClick={(e) => handleRateClick(recipe, e)}
                                        >
                                            <i className="bx bx-star"></i>
                                            Rate
                                        </button>
                                        
                                        {/* Comment Button with count */}
                                        <button 
                                            className="recipe-action-btn comment-btn" 
                                            onClick={(e) => handleCommentClick(recipe, e)}
                                        >
                                            <div className="comment-btn-content">
                                                <i className="bx bx-comment"></i>
                                                <span>Comments</span>
                                                {recipe.commentCount > 0 && (
                                                    <div className="comment-count-badge">
                                                        {recipe.commentCount}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="empty-slot" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RecipeGrid;