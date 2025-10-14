import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const RecipePage = () => {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const navigate = useNavigate();
    
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
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [recipeToComment, setRecipeToComment] = useState(null);
    
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

    // Function to check if recipe matches user's dietary preferences and allergies
    const matchesUserPreferences = (recipe) => {
        if (!user || !user.hasCompletedOnboarding) return true;

        console.log('User preferences:', {
            dietaryPreferences: user.dietaryPreferences,
            allergies: user.allergies,
            preferredCuisines: user.preferredCuisines
        });
        
        console.log('Recipe data:', {
            dietaryTags: recipe.dietaryTags,
            allergens: recipe.allergens,
            cuisine: recipe.cuisine
        });

        // Check dietary preferences
        if (user.dietaryPreferences && user.dietaryPreferences.length > 0) {
            const hasMatchingDietary = user.dietaryPreferences.some(pref => 
                recipe.dietaryTags && recipe.dietaryTags.includes(pref)
            );
            if (!hasMatchingDietary) {
                console.log('Recipe excluded: no matching dietary preference');
                return false;
            }
        }

        // Check allergies - exclude recipes containing user's allergens
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
                console.log('Recipe excluded: contains allergen');
                return false;
            }
        }

        // Check preferred cuisines
        if (user.preferredCuisines && user.preferredCuisines.length > 0) {
            if (recipe.cuisine && !user.preferredCuisines.includes(recipe.cuisine)) {
                console.log('Recipe excluded: cuisine not preferred');
                return false;
            }
        }

        console.log('Recipe matches user preferences');
        return true;
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

    // Fetch recipes
    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        const fetchRecipes = async () => {
            try {
                const res = await axios.get(`${baseURL}/api/recipes`);
                
                let recipesData = [];
                
                if (res.data.success && res.data.recipes) {
                    recipesData = res.data.recipes;
                } else if (Array.isArray(res.data)) {
                    recipesData = res.data;
                }
                
                setRecipes(recipesData);
            } catch (error) {
                console.error("Failed to fetch recipes", error);
                toast({
                    title: "Error",
                    description: "Failed to load recipes. Please try again.",
                    variant: "destructive"
                });
            }
        };
        fetchRecipes();
    }, [toast]);

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
            
            let priority;
            if (isTimeMatch && isPrefMatch) {
                priority = 'time-and-preference';
            } else if (!isTimeMatch && isPrefMatch) {
                priority = 'preference-only';
            } else if (isTimeMatch && !isPrefMatch) {
                priority = 'time-only';
            } else {
                priority = 'other';
            }
            
            return { ...recipe, priority };
        })
        .sort((a, b) => {
            // Sort by priority
            const priorityOrder = {
                'time-and-preference': 0,
                'preference-only': 1,
                'time-only': 2,
                'other': 3
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
            setSheetOut(true);
            setTimeout(() => {
                setSheetOut(false);
                setIsSheetOpen(false);
                setSheetAnimate(false);
            }, 300);
        } else {
            setIsSheetOpen(true);
            setTimeout(() => {
                setSheetAnimate(true);
            }, 10);
        }
    };

    useEffect(() => {
        if (isSheetOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isSheetOpen]);

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
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            const response = await axios.get(`${baseURL}/api/favorites`, {
                withCredentials: true
            });
            
            if (response.data.success && response.data.favorites) {
                setFavoriteRecipes(response.data.favorites.map(fav => fav.recipe));
            }
        } catch (error) {
            console.error("Error fetching favorites:", error);
        }
    };

    // Corrected handleFavoriteToggle function for RecipePage.jsx
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
            
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            if (isFavorited) {
                // Use DELETE method for removing favorites
                await axios.delete(
                    `${baseURL}/api/favorites/${recipeId}`,
                    { withCredentials: true }
                );
                setFavoriteRecipes(prev => prev.filter(id => id !== recipeId));
                toast.info(
                    'Removed from Favorites',
                    `${recipeName} has been removed from your favorites`
                );
            } else {
                // Use POST method for adding favorites
                await axios.post(
                    `${baseURL}/api/favorites`,
                    { recipeId },
                    { withCredentials: true }
                );
                setFavoriteRecipes(prev => [...prev, recipeId]);
                toast.favorite(
                    'Added to Favorites! ❤️',
                    `${recipeName} has been saved to your collection`
                );
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast.error(
                'Something went wrong',
                'Failed to update favorite. Please try again.'
            );
        }
    };

    // Handle rating button click
    const handleRateClick = (recipe, e) => {
        e.stopPropagation();
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        setRecipeToRate(recipe);
        setRatingModalOpen(true);
    };

    // Handle rating modal close
    const handleRatingModalClose = (updatedRecipe) => {
        setRatingModalOpen(false);
        setRecipeToRate(null);
        
        // Update the recipe in the list if it was rated
        if (updatedRecipe) {
            setRecipes(recipes.map(r => 
                r._id === updatedRecipe._id ? updatedRecipe : r
            ));
        }
    };

    // Handle comment button click
    const handleCommentClick = (recipe, e) => {
        e.stopPropagation();
        setRecipeToComment(recipe);
        setCommentModalOpen(true);
    };

    // Add this function to handle comment count updates:
    // Handle comment count updates
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

    // Add this useEffect to debug user data:
    useEffect(() => {
        console.log('Current user data:', user);
        if (user) {
            console.log('User preferences:', {
                hasCompletedOnboarding: user.hasCompletedOnboarding,
                dietaryPreferences: user.dietaryPreferences,
                allergies: user.allergies,
                preferredCuisines: user.preferredCuisines
            });
        }
    }, [user]);

    // Add this useEffect to debug filtered recipes:
    useEffect(() => {
        console.log('Total recipes:', recipes.length);
        console.log('Filtered recipes:', allFilteredRecipes.length);
        console.log('User preferences applied:', user?.hasCompletedOnboarding);
    }, [recipes, allFilteredRecipes, user]);

    return (
        <div className="recipe-page">
            <Navbar />
            <div className="main-content">
                {/* Show personalization notice if user hasn't completed onboarding */}
                {user && !user.hasCompletedOnboarding && (
                    <div className="personalization-notice">
                        <div className="personalization-content">
                            <i className="bx bx-bulb"></i>
                            <div className="personalization-text">
                                <h3>Get Personalized Recommendations!</h3>
                                <p>Complete your profile setup to see recipes tailored to your taste and dietary preferences.</p>
                            </div>
                            <button 
                                className="personalize-btn"
                                onClick={() => navigate('/onboarding')}
                            >
                                <i className="bx bx-user-plus"></i>
                                Set Up Now
                            </button>
                        </div>
                    </div>
                )}

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
                                    `Delicious ${currentMealType} Recipes`
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
                    />

                    {/* Single grid showing all recipes in prioritized order */}
                    <div className="recipe-grid-container">
                        
                        {allFilteredRecipes.length === 0 ? (
                            <NoRecipesFound selectedIngredients={selectedIngredients} />
                        ) : (
                            <>
                                {/* Main Recipe Grid */}
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