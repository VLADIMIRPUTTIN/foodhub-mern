import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../pages/NavbarPage';
import RecipeModal from './RecipeModal';
import RecipeFilters from './components/RecipeFilters';
import SelectedIngredients from './SelectedIngredients';
import MobileIngredientSheet from './components/MobileIngredientSheet';
import IngredientsSidebar from './components/IngredientsSidebar';
import RecipeGrid from './components/RecipeGrid';
import PaginationControls from './components/PaginationControls';
import NoRecipesFound from './components/NoRecipesFound';
import { useToast } from '../components/ui/toast';
import { useAuthStore } from '../store/authStore';
import './RecipePage.scss';
import RatingModal from '../components/RatingModal';
import LoginPromptModal from '../components/ui/login-prompt-modal';
import CommentModal from './components/CommentModal';
import CameraModal from '../components/CameraModal';
import api from '../utils/apiClient';
import { toast } from 'react-hot-toast';

const RecipePage = () => {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [filteredIngredients, setFilteredIngredients] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    
    // ✅ Initialize as empty array - NO auto-selection
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
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [recipeToComment, setRecipeToComment] = useState(null);
    const [currentMealType, setCurrentMealType] = useState('');
    const [selectedDiets, setSelectedDiets] = useState([]);
    
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

    // Function to check if recipe matches user's dietary preferences and allergies
    const matchesUserPreferences = (recipe) => {
        if (!user || !user.hasCompletedOnboarding) return true;

        let score = 0; // Use scoring instead of strict boolean

        // ✅ PRIORITY 1: Preferred Cuisines (MOST IMPORTANT)
        if (user.preferredCuisines && user.preferredCuisines.length > 0) {
            if (recipe.cuisine && user.preferredCuisines.includes(recipe.cuisine)) {
                score += 100; // High score for cuisine match
            } else {
                return false; // ❌ Exclude recipes that don't match preferred cuisines
            }
        }

        // ✅ PRIORITY 2: Check allergies - ALWAYS exclude recipes with allergens
        if (user.allergies && user.allergies.length > 0) {
            const hasAllergen = user.allergies.some(allergy => 
                recipe.allergens && recipe.allergens.some(allergen => 
                    allergen.toLowerCase().includes(allergy.toLowerCase())
                ) ||
                recipe.ingredients && recipe.ingredients.some(ingredient => {
                    const ingredientName = typeof ingredient === 'string' 
                        ? ingredient 
                        : ingredient.name || '';
                    return ingredientName.toLowerCase().includes(allergy.toLowerCase());
                })
            );
            if (hasAllergen) {
                return false; // ❌ HARD EXCLUDE - Safety first!
            }
        }

        // ✅ PRIORITY 3: Dietary preferences (BONUS, not required)
        if (user.dietaryPreferences && user.dietaryPreferences.length > 0) {
            const hasMatchingDietary = user.dietaryPreferences.some(pref => 
                recipe.dietaryTags && recipe.dietaryTags.includes(pref) ||
                recipe.dietCategories && recipe.dietCategories.includes(pref)
            );
            if (hasMatchingDietary) {
                score += 50; // Bonus score for dietary match
            }
            // ⚠️ Don't exclude if no dietary match - it's just a preference
        }

        return true; // ✅ Passed all filters
    };

    // Helper function to check if recipe matches current time of day
    const matchesTimeOfDay = (recipe) => {
        return recipe.category && recipe.category.toLowerCase() === currentMealType.toLowerCase();
    };

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
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

    // Read diet filters from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const dietsParam = params.get('diets');
        if (dietsParam) {
            const list = dietsParam.split(',').map(s => s.trim()).filter(Boolean);
            setSelectedDiets(list);
        } else {
            setSelectedDiets([]);
        }
    }, [location.search]);

    // Fetch recipes
    const fetchRecipes = async () => {
        try {
            const params = selectedDiets.length 
              ? { diets: selectedDiets.join(',') } 
              : undefined;
            
            const res = await api.get('/api/recipes', { params });
            const combined = res.data.success ? res.data.recipes : [];
            setRecipes(combined);
        } catch (error) {
            console.error("Failed to fetch recipes", error);
            toast.error('Failed to load recipes');
            setRecipes([]);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, [selectedDiets]);

    // Fetch ingredients
    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        axios.get(`${baseURL}/api/ingredients`)
            .then(res => {
                if (res.data.success && res.data.ingredients) {
                    setIngredients(res.data.ingredients.map(ing => ing.name));
                } else if (Array.isArray(res.data)) {
                    setIngredients(res.data);
                }
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

    // ✅ Manual ingredient selection/deselection ONLY
    const handleIngredientClick = (ing) => {
        setSelectedIngredients(selected =>
            selected.includes(ing)
                ? selected.filter(i => i !== ing)
                : [...selected, ing]
        );
    };

    // ✅ Manual ingredient removal ONLY
    const handleRemoveIngredient = (ingredientToRemove) => {
        setSelectedIngredients(selectedIngredients.filter(ing => ing !== ingredientToRemove));
    };

    // Apply all filters and sort recipes by priority
    const allFilteredRecipes = recipes
        .filter(recipe => {
            // First apply basic filters
            const recipeName = recipe.title || recipe.name || '';
            const matchesSearch = recipeName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesIngredients =
                selectedIngredients.length === 0 ||
                (recipe.ingredients &&
                    selectedIngredients.every(selIng =>
                        recipe.ingredients.some(ri => 
                            typeof ri === 'string' 
                                ? ri.toLowerCase().includes(selIng.toLowerCase())
                                : (ri.name && ri.name.toLowerCase().includes(selIng.toLowerCase()))
                        )
                    )
                );
                
            const matchesCategoryFilter = !categoryFilter || recipe.category === categoryFilter;
            const matchesMinPrice = !minPrice || (recipe.price && recipe.price >= Number(minPrice));
            const matchesMaxPrice = !maxPrice || (recipe.price && recipe.price <= Number(maxPrice));
            
            return matchesSearch && matchesIngredients && matchesCategoryFilter && 
                matchesMinPrice && matchesMaxPrice;
        })
        .map(recipe => {
            // Add priority flag to each recipe
            const isTimeMatch = matchesTimeOfDay(recipe);
            const isPrefMatch = user?.hasCompletedOnboarding ? matchesUserPreferences(recipe) : true;
            
            // ✅ NEW: Check if cuisine matches user preference
            const isCuisineMatch = user?.preferredCuisines?.length > 0 
                ? user.preferredCuisines.includes(recipe.cuisine)
                : true;
            
            let priority;
            // ✅ UPDATED PRIORITY SYSTEM - Cuisine is now most important
            if (isCuisineMatch && isTimeMatch && isPrefMatch) {
                priority = 'cuisine-time-preference'; // Best match
            } else if (isCuisineMatch && isPrefMatch) {
                priority = 'cuisine-preference'; // Good match
            } else if (isCuisineMatch && isTimeMatch) {
                priority = 'cuisine-time'; // Decent match
            } else if (isCuisineMatch) {
                priority = 'cuisine-only'; // At least cuisine matches
            } else if (isTimeMatch && isPrefMatch) {
                priority = 'time-preference'; // No cuisine but good
            } else if (isPrefMatch) {
                priority = 'preference-only'; // Just preferences
            } else if (isTimeMatch) {
                priority = 'time-only'; // Just time
            } else {
                priority = 'other'; // Doesn't match much
            }
            
            return { ...recipe, priority, isCuisineMatch, isTimeMatch, isPrefMatch };
        })
        .sort((a, b) => {
            // ✅ Sort by priority - Cuisine matches come first
            const priorityOrder = {
                'cuisine-time-preference': 0,
                'cuisine-preference': 1,
                'cuisine-time': 2,
                'cuisine-only': 3,
                'time-preference': 4,
                'preference-only': 5,
                'time-only': 6,
                'other': 7
            };
            
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

    const totalPages = Math.ceil(allFilteredRecipes.length / RECIPES_PER_PAGE);
    
    // Get current page of recipes
    const currentRecipes = allFilteredRecipes.slice(
        (currentPage - 1) * RECIPES_PER_PAGE,
        currentPage * RECIPES_PER_PAGE
    );
    
    // Fill grid with exact number of slots
    const gridRecipes = Array(RECIPES_PER_PAGE).fill(null);
    currentRecipes.forEach((recipe, index) => {
        gridRecipes[index] = recipe;
    });

    // Reset to page 1 if filters change and current page is out of range
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
        scrollToTop();
    }, [allFilteredRecipes.length, totalPages]);

    // Fetch user's favorite recipes
    useEffect(() => {
        if (user) {
            fetchFavoriteRecipes();
        } else {
            setFavoriteRecipes([]);
        }
    }, [user]);

    const fetchFavoriteRecipes = async () => {
        try {
            const response = await api.get('/api/favorites');
            if (response.data.success && response.data.favorites) {
                setFavoriteRecipes(response.data.favorites.map(fav => fav.recipe));
            }
        } catch (error) {
            console.error("Error fetching favorites:", error);
        }
    };

    const handleFavoriteToggle = async (recipeId, event) => {
        event.stopPropagation();
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        try {
            const isFavorited = favoriteRecipes.some(recipe => recipe._id === recipeId);
            
            if (isFavorited) {
                await api.delete(`/api/favorites/${recipeId}`);
                setFavoriteRecipes(prev => prev.filter(recipe => recipe._id !== recipeId));
                toast.success('Removed from favorites');
            } else {
                const response = await api.post('/api/favorites', { recipeId });
                if (response.data.success) {
                    await fetchFavoriteRecipes();
                    toast.success('Added to favorites!');
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error('Failed to update favorites');
        }
    };

    const isRecipeFavorited = (recipeId) => {
        return favoriteRecipes.some(recipe => recipe._id === recipeId);
    };

    const handleRateClick = (recipe, e) => {
        e.stopPropagation();
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        setRecipeToRate(recipe);
        setRatingModalOpen(true);
    };

    const handleRatingModalClose = (updatedRecipe) => {
        setRatingModalOpen(false);
        setRecipeToRate(null);
        
        if (updatedRecipe) {
            setRecipes(recipes.map(r => 
                r._id === updatedRecipe._id ? updatedRecipe : r
            ));
        }
    };

    const handleCommentClick = (recipe, e) => {
        e.stopPropagation();
        setRecipeToComment(recipe);
        setCommentModalOpen(true);
    };

    const handleCommentUpdate = (recipeId, action) => {
        setRecipes(prevRecipes => 
            prevRecipes.map(recipe => {
                if (recipe._id === recipeId) {
                    const currentCount = recipe.commentCount || 0;
                    return {
                        ...recipe,
                        commentCount: action === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1)
                    };
                }
                return recipe;
            })
        );
    };

    const handleSheetOpenChange = (isOpen) => {
        if (isOpen) {
            setIsSheetOpen(true);
            setSheetAnimate(true);
            setSheetOut(false);
        } else {
            setSheetOut(true);
            setTimeout(() => {
                setIsSheetOpen(false);
                setSheetAnimate(false);
                setSheetOut(false);
            }, 300);
        }
    };

    // Sync URL with selected diets
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (selectedDiets.length) {
            params.set('diets', selectedDiets.join(','));
        } else {
            params.delete('diets');
        }
        navigate({ search: params.toString() }, { replace: true });
    }, [selectedDiets, navigate]);

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
                            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                            alt="Food Banner"
                            className="header-bg-img"
                        />
                        <div className="header-bg-overlay"></div>
                        <div className="header-bg-text">
                            <h1>
                                {user && user.hasCompletedOnboarding ? 
                                    `Perfect ${currentMealType} for You` : 
                                    `Perfect ${currentMealType} Recipes`
                                }
                            </h1>
                        </div>
                    </div>

                    {/* Selected ingredients display */}
                    <SelectedIngredients 
                        selectedIngredients={selectedIngredients}
                        onRemoveIngredient={handleRemoveIngredient}
                    />

                    {/* Filter controls */}
                    <RecipeFilters 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        minPrice={minPrice}
                        setMinPrice={setMinPrice}
                        maxPrice={maxPrice}
                        setMaxPrice={setMaxPrice}
                        selectedDiets={selectedDiets}
                        setSelectedDiets={setSelectedDiets}
                    />

                    {/* Single grid showing all recipes in prioritized order */}
                    <div className="recipe-grid-container">
                        
                        {allFilteredRecipes.length === 0 ? (
                            <NoRecipesFound 
                                onReload={fetchRecipes}
                                selectedIngredients={selectedIngredients}
                            />
                        ) : (
                            <>
                                {/* Main Recipe Grid */}
                                <RecipeGrid 
                                    gridRecipes={gridRecipes}
                                    isSwiping={isSwiping}
                                    setSelectedRecipe={setSelectedRecipe}
                                    handleFavoriteToggle={handleFavoriteToggle}
                                    favoriteRecipes={favoriteRecipes}
                                    isRecipeFavorited={isRecipeFavorited}
                                    handleTouchStart={handleTouchStart}
                                    handleTouchMove={handleTouchMove}
                                    handleTouchEnd={handleTouchEnd}
                                    gridContainerRef={gridContainerRef}
                                    filteredRecipes={allFilteredRecipes}
                                    handleRateClick={handleRateClick}
                                    currentMealType={currentMealType}
                                    handleCommentClick={handleCommentClick}
                                    currentPage={currentPage}
                                    userPreferences={user?.hasCompletedOnboarding}
                                />

                                {/* Pagination controls */}
                                <PaginationControls 
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    totalPages={totalPages}
                                />
                            </>
                        )}
                    </div>
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
                    window.location.href = `/recipe/${selectedRecipe._id}`;
                }}
            />
            
            {ratingModalOpen && recipeToRate && (
                <RatingModal 
                    isOpen={ratingModalOpen}
                    recipe={recipeToRate}
                    onClose={handleRatingModalClose}
                />
            )}

            {/* Comment Modal */}
            <CommentModal
                isOpen={commentModalOpen}
                onClose={() => setCommentModalOpen(false)}
                recipe={recipeToComment}
                onCommentUpdate={handleCommentUpdate}
            />
        </div>
    );
};

export default RecipePage;