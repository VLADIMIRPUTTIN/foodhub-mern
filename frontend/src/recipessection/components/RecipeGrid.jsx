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
    handleCommentClick // Add this prop
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
                                className={`recipe-card ${recipe.category && recipe.category.toLowerCase() === currentMealType.toLowerCase() ? 'time-based-card' : ''}`}
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
                                    <h3 className="recipe-title">{recipe.title || recipe.name}</h3>
                                    
                                    {/* Category Badge */}
                                    {recipe.category && (
                                        <div className="recipe-category">
                                            <i className="bx bx-category"></i>
                                            {recipe.category}
                                        </div>
                                    )}
                                    
                                    <p className="recipe-desc">{recipe.description?.substring(0, 100) || ""}...</p>
                                    
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
                                        
                                        {/* Comment Button - New */}
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
                {filteredRecipes.length === 0 && <NoRecipesFound selectedIngredients={[]} />}
            </div>
        </div>
    );
};

export default RecipeGrid;