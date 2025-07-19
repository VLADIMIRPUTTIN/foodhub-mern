import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../pages/NavbarPage';
import RecipeModal from './RecipeModal';
import SelectedIngredients from './SelectedIngredients';
import './RecipePage.scss';
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { useAuthStore } from '../store/authStore';
import LoginPromptModal from '../components/ui/login-prompt-modal';
import { useToast } from '../components/ui/toast'; // Add this import

const RecipePage = () => {
    const { user } = useAuthStore();
    const { toast } = useToast(); // Add this hook
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [filteredIngredients, setFilteredIngredients] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetAnimate, setSheetAnimate] = useState(false);
    const [sheetOut, setSheetOut] = useState(false);
    const [favoriteRecipes, setFavoriteRecipes] = useState([]); // New state for favorites
    const [showLoginPrompt, setShowLoginPrompt] = useState(false); // New state for login prompt
    
    // Touch/swipe handling refs and states
    const gridContainerRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const sidebarRef = useRef(null);

    // UPDATED PAGINATION LOGIC - 8 recipes per page (2 rows × 4 columns)
    const RECIPES_PER_PAGE = 8; // Changed from 16 to 8

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Touch handling functions
    const handleTouchStart = (e) => {
        if (!isMobile) return;
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsSwiping(true);
    };

    const handleTouchMove = (e) => {
        if (!isMobile || !touchStart) return;
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!isMobile || !touchStart || !touchEnd) {
            setIsSwiping(false);
            return;
        }
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;
        
        if (isLeftSwipe && currentPage < totalPages) {
            // Swipe left - next page
            setCurrentPage(prev => prev + 1);
        }
        
        if (isRightSwipe && currentPage > 1) {
            // Swipe right - previous page
            setCurrentPage(prev => prev - 1);
        }
        
        setIsSwiping(false);
        setTouchStart(null);
        setTouchEnd(null);
    };

    // Helper function to construct proper image URL
    const getImageUrl = (recipe) => {
        if (!recipe.imageUrl) {
            // Return a default placeholder image if no image URL
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        // If imageUrl is already a full URL (starts with http), use it as is
        if (recipe.imageUrl.startsWith('http')) {
            return recipe.imageUrl;
        }
        // If imageUrl is a relative path, construct the full URL
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        return `${baseURL}/${cleanPath}`;
    };

    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        const fetchRecipes = async () => {
            try {
                // Only display admin-created (public) recipes
                const response = await axios.get(`${baseURL}/api/recipes`);
                if (response.data.success && response.data.recipes) {
                    setRecipes(response.data.recipes);
                } else {
                    setRecipes(response.data || []);
                }
            } catch (error) {
                console.error('Error fetching recipes:', error);
                setRecipes([]);
            }
        };
        fetchRecipes();
    }, []);

    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        axios.get(`${baseURL}/api/ingredients`)
            .then(res => {
                setIngredients(res.data.ingredients.map(i => i.name));
                setFilteredIngredients(res.data.ingredients.map(i => i.name));
            })
            .catch(() => setIngredients([]));
    }, []);

    useEffect(() => {
        setFilteredIngredients(
            ingredients.filter(ing =>
                ing.toLowerCase().includes(ingredientSearch.toLowerCase())
            )
        );
    }, [ingredientSearch, ingredients]);

    const filteredRecipes = recipes.filter(recipe => {
        // Handle both 'name' and 'title' fields for backward compatibility
        const recipeName = recipe.title || recipe.name || '';
        const matchesSearch = recipeName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesIngredients =
            selectedIngredients.length === 0 ||
            (recipe.ingredients &&
                selectedIngredients.every(selIng =>
                    recipe.ingredients.some(ri => ri.name && ri.name === selIng)
                )
            );
        const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
        const matchesMinPrice = !minPrice || (recipe.price && recipe.price >= Number(minPrice));
        const matchesMaxPrice = !maxPrice || (recipe.price && recipe.price <= Number(maxPrice));
        return matchesSearch && matchesIngredients && matchesCategory && matchesMinPrice && matchesMaxPrice;
    });

    // UPDATED PAGINATION LOGIC
    const totalPages = Math.ceil(filteredRecipes.length / RECIPES_PER_PAGE);
    const paginatedRecipes = filteredRecipes.slice(
        (currentPage - 1) * RECIPES_PER_PAGE,
        currentPage * RECIPES_PER_PAGE
    );

    // Create grid with exactly 8 slots (2 rows × 4 columns)
    const gridRecipes = Array(RECIPES_PER_PAGE).fill(null);
    paginatedRecipes.forEach((recipe, index) => {
        gridRecipes[index] = recipe;
    });

    // Reset to page 1 if filters change and current page is out of range
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
    }, [filteredRecipes, totalPages, currentPage]);

    const handleIngredientClick = (ing) => {
        setSelectedIngredients(selected =>
            selected.includes(ing)
                ? selected.filter(i => i !== ing)
                : [...selected, ing]
        );
    };

    const handleRemoveIngredient = (ingredientToRemove) => {
        setSelectedIngredients(selectedIngredients.filter(ing => ing !== ingredientToRemove));
    };

    useEffect(() => {
        // Add animation class after mount
        if (sidebarRef.current) {
            setTimeout(() => {
                sidebarRef.current.classList.add('sidebar-animate-in');
            }, 80); // slight delay for effect
        }
    }, []);

    // Handle open/close with animation
    const handleSheetOpenChange = (open) => {
        if (!open) {
            setSheetOut(true); // trigger slide out
            setTimeout(() => {
                setIsSheetOpen(false);
                setSheetOut(false);
                setSheetAnimate(false);
            }, 450); // match your CSS transition duration
        } else {
            setIsSheetOpen(true);
            setTimeout(() => setSheetAnimate(true), 10);
        }
    };

    useEffect(() => {
        if (isSheetOpen) {
            setSheetAnimate(true);
        } else {
            setSheetAnimate(false);
        }
    }, [isSheetOpen]);

    // Fetch user's favorite recipes
    useEffect(() => {
        if (user) {
            fetchFavoriteRecipes();
        }
    }, [user]);

    // Update all axios requests for favorites to use relative URLs and always send the JWT token
    const fetchFavoriteRecipes = async () => {
        try {
            const response = await axios.get(
                "/api/favorites",
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    },
                    withCredentials: true
                }
            );
            if (response.data.success) {
                setFavoriteRecipes(response.data.favorites.map(fav => fav.recipe._id));
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const handleFavoriteToggle = async (recipeId, event) => {
        event.stopPropagation();
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        try {
            const isFavorited = favoriteRecipes.includes(recipeId);
            const recipe = recipes.find(r => r._id === recipeId);
            const recipeName = recipe?.title || recipe?.name || 'Recipe';
            if (isFavorited) {
                await axios.delete(
                    `/api/favorites/${recipeId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        },
                        withCredentials: true
                    }
                );
                setFavoriteRecipes(prev => prev.filter(id => id !== recipeId));
                toast.info(
                    'Removed from Favorites',
                    `${recipeName} has been removed from your favorites`,
                    3000
                );
            } else {
                await axios.post(
                    "/api/favorites",
                    { recipeId },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        },
                        withCredentials: true
                    }
                );
                setFavoriteRecipes(prev => [...prev, recipeId]);
                toast.favorite(
                    'Added to Favorites! ❤️',
                    `${recipeName} has been saved to your collection`,
                    4000
                );
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(
                'Something went wrong',
                'Failed to update favorite. Please try again.',
                4000
            );
        }
    };

    return (
        <div className="recipe-page">
            <Navbar />
            <div className="main-content">
                {/* Responsive Ingredients Sidebar */}
                <div className="ingredients-responsive">
                    {/* Mobile: Sheet Button */}
                    <div className="ingredients-sheet-mobile">
                        <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                            <SheetTrigger asChild>
                                {!isSheetOpen && (
                                    <button
                                        className="ingredients-fab-btn"
                                        aria-label="Select Ingredients"
                                    >
                                        <i className="bx bx-bowl-hot"></i>
                                    </button>
                                )}
                            </SheetTrigger>
                            <SheetContent
                                side={isMobile ? "bottom" : "left"} // Show from bottom on mobile, left on desktop
                                className={
                                    `ingredients-sheet-content` +
                                    (sheetAnimate && !sheetOut ? ' sheet-animate-in' : '') +
                                    (sheetOut ? ' sheet-animate-out' : '')
                                }
                            >
                                <button
                                    className={`ingredients-fab-btn close-btn${isSheetOpen ? ' rotating' : ''}`}
                                    aria-label="Close Ingredients"
                                    onClick={() => handleSheetOpenChange(false)}
                                >
                                    <i className="bx bx-x"></i>
                                </button>
                                <div className="sidebar-header">
                                    <span className="sidebar-title">Select <span className="highlight">Ingredients</span></span>
                                    <div className="sidebar-underline"></div>
                                </div>
                                <input
                                    type="text"
                                    className="ingredient-search"
                                    placeholder="Search ingredients..."
                                    value={ingredientSearch}
                                    onChange={e => setIngredientSearch(e.target.value)}
                                />
                                <div className="ingredient-list">
                                    {filteredIngredients.map((ing, idx) => (
                                        <button
                                            key={idx}
                                            className={`ingredient-btn${selectedIngredients.includes(ing) ? " selected" : ""}`}
                                            onClick={() => handleIngredientClick(ing)}
                                            type="button"
                                        >
                                            {ing}
                                        </button>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                    
                    {/* Desktop: Sidebar */}
                    <aside
                        className="ingredients-sidebar"
                        ref={sidebarRef}
                    >
                        <div className="sidebar-header">
                            <span className="sidebar-title">Select <span className="highlight">Ingredients</span></span>
                            <div className="sidebar-underline"></div>
                        </div>
                        <div className="search-container">
                            <input
                                type="text"
                                className="ingredient-search"
                                placeholder="Search ingredients..."
                                value={ingredientSearch}
                                onChange={e => setIngredientSearch(e.target.value)}
                            />
                        </div>
                        <div className="ingredient-list">
                            {filteredIngredients.map((ing, idx) => (
                                <button
                                    key={idx}
                                    className={`ingredient-btn${selectedIngredients.includes(ing) ? " selected" : ""}`}
                                    onClick={() => handleIngredientClick(ing)}
                                    type="button"
                                >
                                    {ing}
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
                
                {/* Main Recipe Content */}
                <div className="recipe-container">
                    {/* Header with background image */}
                    <div className="recipe-header-bg">
                        <img
                            src="https://img.freepik.com/free-photo/top-view-table-full-delicious-food-composition_23-2149141359.jpg"
                            alt="Food Banner"
                            className="header-bg-img"
                        />
                        <div className="header-bg-overlay"></div>
                        <div className="header-bg-text">
                            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>
                                Find Recipes
                            </h1>
                        </div>
                    </div>

                    <SelectedIngredients 
                        selectedIngredients={selectedIngredients}
                        onRemoveIngredient={handleRemoveIngredient}
                    />

                    <div className="recipe-header">
                        <p>
                            Available Recipes
                            {filteredRecipes.length > 0 && (
                                <span style={{ marginLeft: 8, color: "#b86b1b", fontWeight: 600 }}>
                                    ({filteredRecipes.length})
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="recipe-controls">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search recipes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="filter-category"
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                        >
                            <option value="">Filter by Category</option>
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                        </select>
                        <div className="price-filters">
                            <input
                                type="number"
                                className="filter-price min-price"
                                placeholder="Min Price"
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                                min={0}
                            />
                            <input
                                type="number"
                                className="filter-price max-price"
                                placeholder="Max Price"
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                min={0}
                            />
                        </div>
                    </div>

                    {/* Swipeable Recipes Grid Container */}
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
                                        className="recipe-card"
                                        onClick={() => setSelectedRecipe(recipe)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className="recipe-image">
                                            <img 
                                                src={getImageUrl(recipe)} 
                                                alt={recipe.title || recipe.name}
                                                onError={(e) => {
                                                    // Fallback to placeholder if image fails to load
                                                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                }}
                                            />
                                            {/* Heart icon for favorites */}
                                            <button
                                                className={`favorite-btn ${favoriteRecipes.includes(recipe._id) ? 'favorited' : ''}`}
                                                onClick={(e) => handleFavoriteToggle(recipe._id, e)}
                                                aria-label={favoriteRecipes.includes(recipe._id) ? 'Remove from favorites' : 'Add to favorites'}
                                            >
                                                <i className={`bx ${favoriteRecipes.includes(recipe._id) ? 'bxs-heart' : 'bx-heart'}`}></i>
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
                                        </div>
                                    </div>
                                ) : (
                                    // Empty grid cell for consistent layout
                                    <div key={`empty-${idx}`} className="recipe-card" style={{ visibility: "hidden" }} />
                                )
                            )}
                            {filteredRecipes.length === 0 && (
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
                            )}
                        </div>
                    </div>

                    {/* Desktop Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                <i className="bx bx-chevron-left"></i>
                                Previous
                            </button>
                            <div className="page-info">
                                <span className="current-page">{currentPage}</span>
                                <span className="page-separator">of</span>
                                <span className="total-pages">{totalPages}</span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                Next
                                <i className="bx bx-chevron-right"></i>
                            </button>
                        </div>
                    )}

                    {/* Mobile Swipe Pagination Indicator */}
                    {totalPages > 1 && (
                        <div className="mobile-pagination-container">
                            <div className="mobile-pagination-swipe">
                                <div className="swipe-indicator">
                                    <i className="bx bx-chevrons-left"></i>
                                    <span>Swipe to navigate</span>
                                    <i className="bx bx-chevrons-right"></i>
                                </div>
                                <div className="mobile-page-info">
                                    <span className="current-page">{currentPage}</span>
                                    <span className="page-separator">of</span>
                                    <span className="total-pages">{totalPages}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Add the login prompt modal before the closing div */}
            <LoginPromptModal 
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />
            
            {/* Existing RecipeModal */}
            <RecipeModal
                open={!!selectedRecipe}
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
                onViewFull={() => {
                    window.location.href = `/recipes/${selectedRecipe._id}`;
                }}
            />
        </div>
    );
};

export default RecipePage;