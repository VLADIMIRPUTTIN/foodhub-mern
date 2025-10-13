import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../pages/NavbarPage';
import RecipeModal from './RecipeModal';
import SelectedIngredients from './SelectedIngredients';
import './RecipePage.scss';
import { useAuthStore } from '../store/authStore';
import LoginPromptModal from '../components/ui/login-prompt-modal';
import { useToast } from '../components/ui/toast';

// Import our components
import RecipeGrid from './components/RecipeGrid';
import IngredientsSidebar from './components/IngredientsSidebar';
import MobileIngredientSheet from './components/MobileIngredientSheet';
import RecipeFilters from './components/RecipeFilters';
import PaginationControls from './components/PaginationControls';
import RatingModal from '../components/RatingModal';
import { ingredientMatches, getImageUrl } from './components/utils/ingredientUtils';

const RecipePage = () => {
    const { user } = useAuthStore();
    const { toast } = useToast();
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
    const [favoriteRecipes, setFavoriteRecipes] = useState([]);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [recipeToRate, setRecipeToRate] = useState(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    
    // Current meal type based on time of day
    const [currentMealType, setCurrentMealType] = useState('');

    // Touch/swipe handling refs and states
    const gridContainerRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const sidebarRef = useRef(null);
    const recipeContainerRef = useRef(null);

    // Function to scroll to top of recipe container
    const scrollToTop = () => {
        if (recipeContainerRef.current) {
            recipeContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // PAGINATION LOGIC - 8 recipes per page (2 rows × 4 columns)
    const RECIPES_PER_PAGE = 8;

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    // Determine current meal type based on time
    useEffect(() => {
        const getCurrentMealType = () => {
            const currentHour = new Date().getHours();
            
            if (currentHour >= 5 && currentHour < 11) {
                return 'Breakfast';
            } else if (currentHour >= 11 && currentHour < 15) {
                return 'Lunch';
            } else if (currentHour >= 15 && currentHour < 18) {
                return 'Snack';
            } else {
                return 'Dinner';
            }
        };
        
        setCurrentMealType(getCurrentMealType());
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
            setCurrentPage(prev => prev + 1);
        }
        
        if (isRightSwipe && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
        
        setIsSwiping(false);
        setTouchStart(null);
        setTouchEnd(null);
    };

    // Fetch recipes
    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        const fetchRecipes = async () => {
            try {
                const response = await axios.get(`${baseURL}/api/recipes`);
                let allRecipes = [];
                
                if (response.data.success && response.data.recipes) {
                    allRecipes = response.data.recipes;
                } else if (Array.isArray(response.data)) {
                    allRecipes = response.data;
                } else {
                    allRecipes = [];
                }
                
                setRecipes(allRecipes);
            } catch (error) {
                console.error('Error fetching recipes:', error);
                setRecipes([]);
            }
        };
        fetchRecipes();
    }, []);

    // Fetch ingredients
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

    // Filter ingredients based on search
    useEffect(() => {
        setFilteredIngredients(
            ingredients.filter(ing =>
                ing.toLowerCase().includes(ingredientSearch.toLowerCase())
            )
        );
    }, [ingredientSearch, ingredients]);

    // Update the filtered recipes logic with time-based recipes first
    const filteredRecipes = recipes
        .filter(recipe => {
            const recipeName = recipe.title || recipe.name || '';
            const matchesSearch = recipeName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesIngredients =
                selectedIngredients.length === 0 ||
                (recipe.ingredients &&
                    selectedIngredients.every(selIng =>
                        recipe.ingredients.some(ri => ingredientMatches(ri, selIng))
                    )
                );
                
            const matchesCategoryFilter = !categoryFilter || recipe.category === categoryFilter;
            const matchesMinPrice = !minPrice || (recipe.price && recipe.price >= Number(minPrice));
            const matchesMaxPrice = !maxPrice || (recipe.price && recipe.price <= Number(maxPrice));
            
            return matchesSearch && matchesIngredients && matchesCategoryFilter && matchesMinPrice && matchesMaxPrice;
        })
        .sort((a, b) => {
            // Sort by time-based first
            const aIsTimeBased = a.category && a.category.toLowerCase() === currentMealType.toLowerCase();
            const bIsTimeBased = b.category && b.category.toLowerCase() === currentMealType.toLowerCase();
            
            if (aIsTimeBased && !bIsTimeBased) return -1;
            if (!aIsTimeBased && bIsTimeBased) return 1;
            return 0;
        });

    // PAGINATION LOGIC
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
        scrollToTop();
    }, [filteredRecipes.length, totalPages, currentPage]);

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
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            const response = await axios.get(
                `${baseURL}/api/favorites`,
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
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            const isFavorited = favoriteRecipes.includes(recipeId);
            const recipe = recipes.find(r => r._id === recipeId);
            const recipeName = recipe?.title || recipe?.name || 'Recipe';
            
            if (isFavorited) {
                await axios.delete(
                    `${baseURL}/api/favorites/${recipeId}`,
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
                    `${baseURL}/api/favorites`,
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

    // Add this function to handle rating button click
    const handleRateClick = (recipe, e) => {
        e.stopPropagation();
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        setRecipeToRate(recipe);
        setRatingModalOpen(true);
    };

    // Add this function to handle rating modal close
    const handleRatingModalClose = (updatedRecipe) => {
        setRatingModalOpen(false);
        setRecipeToRate(null);
        
        // Update the recipe in the list if it was rated
        if (updatedRecipe) {
            setRecipes(prevRecipes => 
                prevRecipes.map(r => 
                    r._id === updatedRecipe._id ? updatedRecipe : r
                )
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
                    <MobileIngredientSheet 
                        isSheetOpen={isSheetOpen}
                        setIsSheetOpen={setIsSheetOpen}
                        sheetAnimate={sheetAnimate}
                        sheetOut={sheetOut}
                        handleSheetOpenChange={handleSheetOpenChange}
                        ingredientSearch={ingredientSearch}
                        setIngredientSearch={setIngredientSearch}
                        filteredIngredients={filteredIngredients}
                        selectedIngredients={selectedIngredients}
                        handleIngredientClick={handleIngredientClick}
                        isMobile={isMobile}
                    />
                    
                    {/* Desktop: Sidebar */}
                    <IngredientsSidebar 
                        ingredientSearch={ingredientSearch}
                        setIngredientSearch={setIngredientSearch}
                        filteredIngredients={filteredIngredients}
                        selectedIngredients={selectedIngredients}
                        handleIngredientClick={handleIngredientClick}
                    />
                </div>
                
                {/* Main Recipe Content */}
                <div className="recipe-container" ref={recipeContainerRef}>
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

                    {/* Regular recipes section header */}
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

                    {/* Filter controls - ONLY USE THIS COMPONENT */}
                    <RecipeFilters 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        minPrice={minPrice}
                        setMinPrice={setMinPrice}
                        maxPrice={maxPrice}
                        setMaxPrice={setMaxPrice}
                    />

                    {/* Recipe grid - now with time-based recipes appearing first */}
                    <RecipeGrid 
                        gridRecipes={gridRecipes}
                        isSwiping={isSwiping}
                        setSelectedRecipe={setSelectedRecipe}
                        handleFavoriteToggle={handleFavoriteToggle}
                        favoriteRecipes={favoriteRecipes}
                        handleTouchStart={handleTouchStart}
                        handleTouchMove={handleTouchMove}
                        handleTouchEnd={handleTouchEnd}
                        gridContainerRef={gridContainerRef}
                        filteredRecipes={filteredRecipes}
                        handleRateClick={handleRateClick}
                        currentMealType={currentMealType} // Added to highlight time-based recipes
                    />

                    {/* Pagination controls */}
                    <PaginationControls 
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                    />
                </div>
            </div>
            
            {/* Modals */}
            <LoginPromptModal 
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            />
            
            <RecipeModal
                open={!!selectedRecipe}
                recipe={selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
                onViewFull={() => {
                    window.location.href = `/recipes/${selectedRecipe._id}`;
                }}
            />
            
            {ratingModalOpen && recipeToRate && (
                <RatingModal 
                    isOpen={ratingModalOpen}
                    recipe={recipeToRate}
                    onClose={handleRatingModalClose}
                />
            )}
        </div>
    );
};

export default RecipePage;