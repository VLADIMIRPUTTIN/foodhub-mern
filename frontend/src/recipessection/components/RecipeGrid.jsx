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
            className="recipes-grid-container"
            ref={gridContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className={`recipes-grid ${isSwiping ? 'swiping' : ''}`}>
                {gridRecipes.map((recipe, idx) =>
                    recipe ? (
                        <div key={recipe._id} className="recipe-card-wrapper">
                            <div
                                className={`recipe-card ${recipe.priority === 'time-and-preference' ? 'highlight-card' : ''}`}
                                onClick={() => setSelectedRecipe(recipe)}
                                style={{ cursor: "pointer" }}
                            >
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
                                    {/* Fix: Make sure recipe title shows properly */}
                                    <h3 className="recipe-title">
                                        {recipe.title || recipe.name || 'Untitled Recipe'}
                                    </h3>
                                    
                                    {/* Category Badge */}
                                    {recipe.category && (
                                        <div className="recipe-category">
                                            <i className="bx bx-category"></i>
                                            {recipe.category}
                                        </div>
                                    )}
                                    
                                    {/* Fix: Make sure description shows properly */}
                                    <p className="recipe-desc">
                                        {recipe.description ? `${recipe.description.substring(0, 100)}...` : "No description available"}
                                    </p>
                                    
                                    {/* Group meta items in container */}
                                    <div className="recipe-meta-container">
                                        {/* Estimated Cost */}
                                        {recipe.price > 0 && (
                                            <div className="recipe-price">
                                                <i className="bx bx-money"></i>
                                                <span>₱{recipe.price.toFixed(2)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Servings */}
                                        {recipe.servings > 0 && (
                                            <div className="recipe-servings">
                                                <i className="bx bx-group"></i>
                                                <span>{recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}</span>
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
                                    
                                    {/* Action buttons container */}
                                    <div className="recipe-action-buttons">
                                        {/* Rate Button */}
                                        <button 
                                            className="recipe-action-btn rate-btn" 
                                            onClick={(e) => handleRateClick(recipe, e)}
                                        >
                                            <i className="bx bx-star"></i>
                                            Rate
                                        </button>
                                        
                                        {/* Comment Button */}
                                        <button 
                                            className="recipe-action-btn comment-btn" 
                                            onClick={(e) => handleCommentClick(recipe, e)}
                                        >
                                            <i className="bx bx-comment"></i>
                                            Comments
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Empty grid cell for consistent layout
                        <div key={`empty-${idx}`} className="recipe-card-wrapper">
                            <div className="recipe-card empty-card"></div>
                        </div>
                    )
                )}
            </div>
            
            <div className="mobile-pagination-container">
                <div className="mobile-pagination-swipe">
                    <div className="swipe-indicator">
                        <i className='bx bx-chevrons-left'></i>
                        <span>Swipe to browse recipes</span>
                        <i className='bx bx-chevrons-right'></i>
                    </div>
                    
                    <div className="mobile-page-info">
                        <span className="current-page">{currentPage}</span>
                        <span className="page-separator">of</span>
                        <span className="total-pages">{Math.ceil(filteredRecipes.length / gridRecipes.length) || 1}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeGrid;