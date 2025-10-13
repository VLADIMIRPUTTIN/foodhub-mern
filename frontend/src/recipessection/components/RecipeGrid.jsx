import { getImageUrl } from './utils/ingredientUtils';
import NoRecipesFound from './NoRecipesFound';

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
    currentMealType
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
                        <div
                            key={recipe._id}
                            className={`recipe-card ${recipe.category && recipe.category.toLowerCase() === currentMealType.toLowerCase() ? 'time-based-card' : ''}`}
                            onClick={() => setSelectedRecipe(recipe)}
                            style={{ cursor: "pointer" }}
                        >
                            {/* Remove the time badge element but keep the time-based-card class above */}
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
                                <p className="recipe-desc">{recipe.description}</p>
                                <div className="recipe-category">{recipe.category}</div>
                                {recipe.price && (
                                    <div className="recipe-price">
                                        Estimated Price: ${recipe.price.toFixed(2)}
                                    </div>
                                )}
                                {recipe.averageRating > 0 && (
                                    <div className="recipe-meta">
                                        <div className="star-rating-display">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <i 
                                                    key={star} 
                                                    className={`bx ${star <= Math.round(recipe.averageRating) ? 'bxs-star' : 'bx-star'}`}
                                                    style={{ color: "#FF9529" }}
                                                ></i>
                                            ))}
                                            <span>({recipe.ratings?.length || 0})</span>
                                        </div>
                                        <button 
                                            className="rate-button" 
                                            onClick={(e) => handleRateClick(recipe, e)}
                                        >
                                            Rate
                                        </button>
                                    </div>
                                )}
                                {!recipe.averageRating && (
                                    <div className="recipe-meta">
                                        <button 
                                            className="rate-button" 
                                            onClick={(e) => handleRateClick(recipe, e)}
                                        >
                                            Rate this recipe
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Empty grid cell for consistent layout
                        <div key={`empty-${idx}`} className="recipe-card" style={{ visibility: "hidden" }} />
                    )
                )}
                {filteredRecipes.length === 0 && <NoRecipesFound selectedIngredients={[]} />}
            </div>
        </div>
    );
};

export default RecipeGrid;