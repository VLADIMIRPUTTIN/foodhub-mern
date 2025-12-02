import { getImageUrl } from './utils/ingredientUtils';
import NoRecipesFound from './NoRecipesFound';t-router-dom';
import './RecipeGrid.scss';
import Navbar from '../pages/NavbarPage';
const RecipeGrid = ({om './RecipeModal';
    gridRecipes,ters from './components/RecipeFilters';
    isSwiping,dIngredients from './SelectedIngredients';
    setSelectedRecipe,tSheet from './components/MobileIngredientSheet';
    handleFavoriteToggle, from './components/IngredientsSidebar';
    favoriteRecipes,om './components/RecipeGrid';
    handleTouchStart,rols from './components/PaginationControls';
    handleTouchMove,d from './components/NoRecipesFound';
    handleTouchEnd, from '../components/ui/toast';
    gridContainerRef, } from '../store/authStore';
    filteredRecipes,.scss';
    handleRateClick,rom '../components/RatingModal';
    currentMealType,dal from '../components/ui/login-prompt-modal';
    handleCommentClick,m './components/CommentModal';
    currentPage,al from '../components/CameraModal';
    userPreferences/utils/apiClient';
}) => {{ toast } from 'react-hot-toast';
    return (
        <div age = () => {
            className={`recipes-grid ${isSwiping ? 'swiping' : ''}`}
            ref={gridContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        > [recipes, setRecipes] = useState([]);
            {gridRecipes.map((recipe, index) => {e([]);
                return (etSearchTerm] = useState('');
                    <div key={index} className="recipe-card-wrapper">
                        {recipe ? (FilteredIngredients] = useState([]);
                            <div className={`recipe-card ${recipe.priority === 'time-and-preference' ? 'highlight-card' : ''}`} onClick={() => setSelectedRecipe(recipe)} style={{ cursor: "pointer" }}>
                                <div className="recipe-image">
                                    <img uto-selection
                                        src={getImageUrl(recipe)} ([]);
                                        alt={recipe.title || recipe.name}
                                        onError={(e) => {'');
                                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}te('');
                                    />] = useState(1);
                                    {/* Priority badges */}
                                    {recipe.priority && (e);
                                        <div className="recipe-badges">
                                            {recipe.priority === 'time-and-preference' && (
                                                <span className="time-badge">{currentMealType}</span>
                                            )}] = useState(false);
                                            {recipe.priority === 'preference-only' && userPreferences && (
                                                <span className="preference-badge">Recommended</span>
                                            )}
                                            {/* Add cuisine badge conditionally */}
                                            {recipe.isCuisineMatch && userPreferences && (
                                                <div className="priority-badge cuisine-match">useState([]);
                                                    <i className='bx bx-world'></i>
                                                    {recipe.cuisine}tates
                                                </div>null);
                                            )}State(null);
                                        </div>
                                    )}
                                    
                                    <button
                                        className={`favorite-btn ${favoriteRecipes.some(fav => fav._id === recipe._id) ? 'favorited' : ''}`}
                                        onClick={e => handleFavoriteToggle(recipe._id, e)}
                                        aria-label={favoriteRecipes.some(fav => fav._id === recipe._id) ? "Unfavorite" : "Favorite"}
                                        tabIndex={0}cipe container
                                    >
                                        <i className={favoriteRecipes.some(fav => fav._id === recipe._id) ? "bx bxs-heart" : "bx bx-heart"}></i>
                                    </button>
                                </div>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">
                                        {recipe.title || recipe.name || 'Untitled Recipe'}
                                    </h3>
                                    
                                    {/* Category Badge */}mns)
                                    {recipe.category && (
                                        <div className="recipe-category">
                                            <i className="bx bx-food-menu"></i>atches user's dietary preferences and allergies
                                            {recipe.category}
                                        </div>
                                    )}
                                    stead of strict boolean
                                    {/* Fix: Make sure description shows properly */}
                                    <p className="recipe-desc">
                                        {recipe.description?.substring(0, 100) || "No description"}...
                                    </p>des(recipe.cuisine)) {
                                    tch
                                    {/* Group meta items in container */}
                                    <div className="recipe-meta-container">uisines
                                        {/* Estimated Cost */}
                                        {recipe.price && (
                                            <div className="recipe-price">
                                                <i className="bx bx-money"></i> - ALWAYS exclude recipes with allergens
                                                ₱{recipe.price.toFixed(2)} {
                                            </div>> 
                                        )}
                                        
                                        {/* Servings */}
                                        {recipe.servings && (dients.some(ingredient => {
                                            <div className="recipe-servings"> typeof ingredient === 'string' 
                                                <i className="bx bx-group"></i>
                                                {recipe.servings} servings.name || '';
                                            </div>e());
                                        )}
                                    </div>
                                    
                                    {/* Star Rating (only if there are ratings) */}afety first!
                                    {recipe.averageRating > 0 && (
                                        <div className="star-rating-display">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <i ONUS, not required)
                                                    key={star} 
                                                    className={`bx ${star <= Math.round(recipe.averageRating) ? 'bxs-star' : 'bx-star'}`}etaryPreferences.some(pref => 
                                                ></i>recipe.dietaryTags.includes(pref) ||
                                            ))}s && recipe.dietCategories.includes(pref)
                                            <span>({recipe.ratings?.length || 0})</span>
                                        </div>
                                    )}ch
                                    
                                    {/* Action buttons container - fixed at bottom */}
                                    <div className="recipe-action-buttons">
                                        {/* Rate Button */}
                                        <button 
                                            className="recipe-action-btn rate-btn" 
                                            onClick={(e) => handleRateClick(recipe, e)}
                                        >e matches current time of day
                                            <i className="bx bx-star"></i>
                                            Ratey.toLowerCase() === currentMealType.toLowerCase();
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
                                                    <div className="comment-count-badge">esize', checkMobile);
                                                        {recipe.commentCount}
                                                    </div>
                                                )}ed on time
                                            </div>
                                        </button>ype = () => {
                                    </div>
                                </div>
                            </div>r >= 5 && currentHour < 11) {
                        ) : (turn 'Breakfast';
                            <div className="empty-slot" />lse if (currentHour >= 11 && currentHour < 15) {
                        )}  return 'Lunch';
                    </div>      } else if (currentHour >= 15 && currentHour < 18) {
                );              return 'Snack';
            })}            } else {
        </div>nner';            }        };                setCurrentMealType(getCurrentMealType());    }, []);    // Touch handling functions    const handleTouchStart = (e) => {        if (!isMobile) return;        setTouchEnd(null);        setTouchStart(e.targetTouches[0].clientX);        setIsSwiping(true);    };    const handleTouchMove = (e) => {        if (!isMobile || !touchStart) return;        setTouchEnd(e.targetTouches[0].clientX);    };    const handleTouchEnd = () => {        if (!isMobile || !touchStart || !touchEnd) {            setIsSwiping(false);            return;        }                const distance = touchStart - touchEnd;        const isLeftSwipe = distance > 50;        const isRightSwipe = distance < -50;                if (isLeftSwipe && currentPage < totalPages) {            setCurrentPage(prev => prev + 1);        }                if (isRightSwipe && currentPage > 1) {            setCurrentPage(prev => prev - 1);        }                setIsSwiping(false);        setTouchStart(null);        setTouchEnd(null);    };    // Read diet filters from URL    useEffect(() => {        const params = new URLSearchParams(location.search);        const dietsParam = params.get('diets');        if (dietsParam) {            const list = dietsParam.split(',').map(s => s.trim()).filter(Boolean);            setSelectedDiets(list);        } else {            setSelectedDiets([]);        }    }, [location.search]);    // Fetch recipes    const fetchRecipes = async () => {        try {            const params = selectedDiets.length               ? { diets: selectedDiets.join(',') }               : undefined;                        const res = await api.get('/api/recipes', { params });            const combined = res.data.success ? res.data.recipes : [];            setRecipes(combined);        } catch (error) {            console.error("Failed to fetch recipes", error);            toast.error('Failed to load recipes');            setRecipes([]);        }    };    useEffect(() => {        fetchRecipes();    }, [selectedDiets]);    // Fetch ingredients    useEffect(() => {        const baseURL = import.meta.env.MODE === "development"            ? "http://localhost:5000"            : "";        axios.get(`${baseURL}/api/ingredients`)            .then(res => {                if (res.data.success && res.data.ingredients) {                    setIngredients(res.data.ingredients.map(ing => ing.name));                } else if (Array.isArray(res.data)) {                    setIngredients(res.data);                }            })            .catch(() => setIngredients([]));    }, []);    // Filter ingredients based on search    useEffect(() => {        setFilteredIngredients(            ingredients.filter(ing =>                ing.toLowerCase().includes(ingredientSearch.toLowerCase())            )        );    }, [ingredientSearch, ingredients]);    // ✅ Manual ingredient selection/deselection ONLY    const handleIngredientClick = (ing) => {        setSelectedIngredients(selected =>            selected.includes(ing)                ? selected.filter(i => i !== ing)                : [...selected, ing]        );    };    // ✅ Manual ingredient removal ONLY    const handleRemoveIngredient = (ingredientToRemove) => {        setSelectedIngredients(selectedIngredients.filter(ing => ing !== ingredientToRemove));    };    // Apply all filters and sort recipes by priority    const allFilteredRecipes = recipes        .filter(recipe => {            // First apply basic filters            const recipeName = recipe.title || recipe.name || '';            const matchesSearch = recipeName.toLowerCase().includes(searchTerm.toLowerCase());                        const matchesIngredients =                selectedIngredients.length === 0 ||                (recipe.ingredients &&                    selectedIngredients.every(selIng =>                        recipe.ingredients.some(ri =>                             typeof ri === 'string'                                 ? ri.toLowerCase().includes(selIng.toLowerCase())                                : (ri.name && ri.name.toLowerCase().includes(selIng.toLowerCase()))                        )                    )                );                            const matchesCategoryFilter = !categoryFilter || recipe.category === categoryFilter;            const matchesMinPrice = !minPrice || (recipe.price && recipe.price >= Number(minPrice));            const matchesMaxPrice = !maxPrice || (recipe.price && recipe.price <= Number(maxPrice));                        return matchesSearch && matchesIngredients && matchesCategoryFilter &&                 matchesMinPrice && matchesMaxPrice;        })        .map(recipe => {            // Add priority flag to each recipe            const isTimeMatch = matchesTimeOfDay(recipe);            const isPrefMatch = user?.hasCompletedOnboarding ? matchesUserPreferences(recipe) : true;                        // ✅ NEW: Check if cuisine matches user preference            const isCuisineMatch = user?.preferredCuisines?.length > 0                 ? user.preferredCuisines.includes(recipe.cuisine)                : true;                        let priority;            // ✅ UPDATED PRIORITY SYSTEM - Cuisine is now most important            if (isCuisineMatch && isTimeMatch && isPrefMatch) {                priority = 'cuisine-time-preference'; // Best match            } else if (isCuisineMatch && isPrefMatch) {                priority = 'cuisine-preference'; // Good match            } else if (isCuisineMatch && isTimeMatch) {                priority = 'cuisine-time'; // Decent match            } else if (isCuisineMatch) {                priority = 'cuisine-only'; // At least cuisine matches            } else if (isTimeMatch && isPrefMatch) {                priority = 'time-preference'; // No cuisine but good            } else if (isPrefMatch) {                priority = 'preference-only'; // Just preferences            } else if (isTimeMatch) {                priority = 'time-only'; // Just time            } else {                priority = 'other'; // Doesn't match much            }                        return { ...recipe, priority, isCuisineMatch, isTimeMatch, isPrefMatch };        })        .sort((a, b) => {            // ✅ Sort by priority - Cuisine matches come first            const priorityOrder = {                'cuisine-time-preference': 0,                'cuisine-preference': 1,                'cuisine-time': 2,                'cuisine-only': 3,                'time-preference': 4,                'preference-only': 5,                'time-only': 6,                'other': 7            };                        return priorityOrder[a.priority] - priorityOrder[b.priority];
    );
};

export default RecipeGrid;        });    const totalPages = Math.ceil(allFilteredRecipes.length / RECIPES_PER_PAGE);        // Get current page of recipes    const currentRecipes = allFilteredRecipes.slice(        (currentPage - 1) * RECIPES_PER_PAGE,        currentPage * RECIPES_PER_PAGE    );        // Fill grid with exact number of slots    const gridRecipes = Array(RECIPES_PER_PAGE).fill(null);    currentRecipes.forEach((recipe, index) => {        gridRecipes[index] = recipe;    });    // Reset to page 1 if filters change and current page is out of range    useEffect(() => {        if (currentPage > totalPages && totalPages > 0) {            setCurrentPage(1);        }        scrollToTop();    }, [allFilteredRecipes.length, totalPages]);    // Fetch user's favorite recipes    useEffect(() => {        if (user) {            fetchFavoriteRecipes();        } else {            setFavoriteRecipes([]);        }    }, [user]);    const fetchFavoriteRecipes = async () => {        try {            const response = await api.get('/api/favorites');            if (response.data.success && response.data.favorites) {                setFavoriteRecipes(response.data.favorites.map(fav => fav.recipe));            }        } catch (error) {            console.error("Error fetching favorites:", error);        }    };    const handleFavoriteToggle = async (recipeId, event) => {        event.stopPropagation();        if (!user) {            setShowLoginPrompt(true);            return;        }        try {            const isFavorited = favoriteRecipes.some(recipe => recipe._id === recipeId);                        if (isFavorited) {                await api.delete(`/api/favorites/${recipeId}`);                setFavoriteRecipes(prev => prev.filter(recipe => recipe._id !== recipeId));                toast.success('Removed from favorites');            } else {                const response = await api.post('/api/favorites', { recipeId });                if (response.data.success) {                    await fetchFavoriteRecipes();                    toast.success('Added to favorites!');                }            }        } catch (error) {            console.error('Error toggling favorite:', error);            toast.error('Failed to update favorites');        }    };    const isRecipeFavorited = (recipeId) => {        return favoriteRecipes.some(recipe => recipe._id === recipeId);    };    const handleRateClick = (recipe, e) => {        e.stopPropagation();        if (!user) {            setShowLoginPrompt(true);            return;        }        setRecipeToRate(recipe);        setRatingModalOpen(true);    };    const handleRatingModalClose = (updatedRecipe) => {        setRatingModalOpen(false);        setRecipeToRate(null);                if (updatedRecipe) {            setRecipes(recipes.map(r =>                 r._id === updatedRecipe._id ? updatedRecipe : r            ));        }    };    const handleCommentClick = (recipe, e) => {        e.stopPropagation();        setRecipeToComment(recipe);        setCommentModalOpen(true);    };    const handleCommentUpdate = (recipeId, action) => {        setRecipes(prevRecipes =>             prevRecipes.map(recipe => {                if (recipe._id === recipeId) {                    const currentCount = recipe.commentCount || 0;                    return {                        ...recipe,                        commentCount: action === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1)                    };                }                return recipe;            })        );    };    const handleSheetOpenChange = (isOpen) => {        if (isOpen) {            setIsSheetOpen(true);            setSheetAnimate(true);            setSheetOut(false);        } else {            setSheetOut(true);            setTimeout(() => {                setIsSheetOpen(false);                setSheetAnimate(false);                setSheetOut(false);            }, 300);        }    };    // Sync URL with selected diets    useEffect(() => {        const params = new URLSearchParams(location.search);        if (selectedDiets.length) {            params.set('diets', selectedDiets.join(','));        } else {            params.delete('diets');        }        navigate({ search: params.toString() }, { replace: true });    }, [selectedDiets, navigate]);    return (        <div className="recipe-page">            <Navbar />            <div className="main-content">                {/* Responsive Ingredients Sidebar */}                <div className="ingredients-responsive">                    {/* Mobile: Sheet Button */}                    <MobileIngredientSheet                         isSheetOpen={isSheetOpen}                        setIsSheetOpen={setIsSheetOpen}                        sheetAnimate={sheetAnimate}                        sheetOut={sheetOut}                        handleSheetOpenChange={handleSheetOpenChange}                        ingredientSearch={ingredientSearch}                        setIngredientSearch={setIngredientSearch}                        filteredIngredients={filteredIngredients}                        selectedIngredients={selectedIngredients}                        handleIngredientClick={handleIngredientClick}                        isMobile={isMobile}                    />                                        {/* Desktop: Sidebar */}                    <IngredientsSidebar                         ingredientSearch={ingredientSearch}                        setIngredientSearch={setIngredientSearch}                        filteredIngredients={filteredIngredients}                        selectedIngredients={selectedIngredients}                        handleIngredientClick={handleIngredientClick}                    />                </div>                                {/* Main Recipe Content */}                <div className="recipe-container" ref={recipeContainerRef}>                    {/* Header with background image */}                    <div className="recipe-header-bg">                        <img                        onRemoveIngredient={handleRemoveIngredient}                    />                    {/* Filter controls */}                    <RecipeFilters                         searchTerm={searchTerm}                        setSearchTerm={setSearchTerm}                        categoryFilter={categoryFilter}                        setCategoryFilter={setCategoryFilter}                        minPrice={minPrice}                        setMinPrice={setMinPrice}                        maxPrice={maxPrice}                        setMaxPrice={setMaxPrice}                        selectedDiets={selectedDiets}                        setSelectedDiets={setSelectedDiets}                    />                    {/* Single grid showing all recipes in prioritized order */}                    <div className="recipe-grid-container">                                                {allFilteredRecipes.length === 0 ? (                            <NoRecipesFound                                 onReload={fetchRecipes}                                selectedIngredients={selectedIngredients}                            />                        ) : (                            <>                                {/* Main Recipe Grid */}                                <RecipeGrid                                     gridRecipes={gridRecipes}                                    isSwiping={isSwiping}                                    setSelectedRecipe={setSelectedRecipe}                                    handleFavoriteToggle={handleFavoriteToggle}                                    favoriteRecipes={favoriteRecipes}                                    isRecipeFavorited={isRecipeFavorited}                                    handleTouchStart={handleTouchStart}                                    handleTouchMove={handleTouchMove}                                    handleTouchEnd={handleTouchEnd}                                    gridContainerRef={gridContainerRef}                                    filteredRecipes={allFilteredRecipes}                                    handleRateClick={handleRateClick}                                    currentMealType={currentMealType}                                    handleCommentClick={handleCommentClick}                                    currentPage={currentPage}                                    userPreferences={user?.hasCompletedOnboarding}                                />                                {/* Pagination controls */}                                <PaginationControls                                     currentPage={currentPage}                                    setCurrentPage={setCurrentPage}                                    totalPages={totalPages}                                />                            </>                        )}                    </div>                </div>            </div>                        {/* Modals */}            <LoginPromptModal                 isOpen={showLoginPrompt}                onClose={() => setShowLoginPrompt(false)}            />                        <RecipeModal                open={!!selectedRecipe}                recipe={selectedRecipe}                onClose={() => setSelectedRecipe(null)}                onViewFull={() => {                    window.location.href = `/recipe/${selectedRecipe._id}`;                }}            />                        {ratingModalOpen && recipeToRate && (                <RatingModal                     isOpen={ratingModalOpen}                    recipe={recipeToRate}                    onClose={handleRatingModalClose}                />            )}            {/* Comment Modal */}            <CommentModal                isOpen={commentModalOpen}                onClose={() => setCommentModalOpen(false)}                recipe={recipeToComment}                onCommentUpdate={handleCommentUpdate}            />        </div>    );};export default RecipePage;