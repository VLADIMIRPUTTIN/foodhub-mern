import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";-router-dom';
import Navbar from "../pages/NavbarPage";thStore';
import { useSocket } from '../context/SocketContext';
import { useAuthStore } from '../store/authStore';
import CommunityRateRecipe from '../components/CommunityRateRecipe';
import RatingModal from '../components/RatingModal';
import "./SharedRecipePage.scss";cipessection/EditRecipePage';
import { Share2, Trash2 } from "lucide-react";
const SharedRecipePage = () => {-toast";
    const [recipes, setRecipes] = useState([]);mDialog";
    const [loading, setLoading] = useState(true);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedRecipeForRating, setSelectedRecipeForRating] = useState(null);
    const navigate = useNavigate();s://i.ibb.co/WvG991xq/profile-default.png";
    const { socket } = useSocket();
    const { isAuthenticated } = useAuthStore();
    const { user, logout, setUser, checkAuth, isCheckingAuth, isAuthenticated } = useAuthStore();
    // Fetch shared recipes from the server
    const fetchSharedRecipes = () => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"teRecipes] = useState([]);
            : "";teCount, setFavoriteCount] = useState(0);
        t [isLoading, setIsLoading] = useState(true);
        fetch(`${baseURL}/api/recipes/shared`)(false);
            .then(res => res.json())= useState('recipes');
            .then(data => {tForm] = useState({
                if (Array.isArray(data.recipes)) {
                    setRecipes(data.recipes);
                } else if (Array.isArray(data.sharedRecipes)) {
                    setRecipes(data.sharedRecipes);
                } else { setImagePreview] = useState(null);
                    setRecipes([]);itModal] = useState(false);
                }cipeData, setEditRecipeData] = useState(null);
                setLoading(false);Open] = useState(false);
            })ipeToDelete, setRecipeToDelete] = useState(null);
            .catch((error) => {g] = useState(false);
                console.error('Error fetching shared recipes:', error);
                setRecipes([]);
                setLoading(false);c
            });) => {
    };  const initializeProfile = async () => {
            try {
    useEffect(() => { we're still checking auth, wait
        fetchSharedRecipes();gAuth) {
    }, []);         return;
                }
    useEffect(() => {
        if (socket) { not authenticated, redirect to login
            const handleRecipeApproved = () => {
                fetchSharedRecipes(););
            };      return;
                }
            socket.on('recipeApproved', handleRecipeApproved);
                // If authenticated but no user data, try to get it
            return () => { {
                socket.off('recipeApproved', handleRecipeApproved);
            };      return;
        }       }
    }, [socket]);
                // If we have user data, fetch profile data
    const getImageUrl = (recipe) => {;
        // If no image URL provided, return placeholder
        if (!recipe.imageUrl) {
            return 'https://via.placeholder.com/300x200?text=No+Image';       if (location.state?.refreshRecipes) {
        }
        
        // If it's already a complete URL (Cloudinary or other external), use it as is   } catch (error) {
        if (recipe.imageUrl.startsWith('http://') || recipe.imageUrl.startsWith('https://')) {
            return recipe.imageUrl;s, not network errors
        }
                   navigate('/login');
        // If it's a relative path (old local uploads), construct the full URL
        const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";      }
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl : `/${recipe.imageUrl}`;        };
        return `${baseURL}${cleanPath}`;
    };
isCheckingAuth]); // Simplified dependencies
    const handleRateRecipe = (recipe, e) => {
        e.stopPropagation();ion state changes separately
        if (!isAuthenticated) {fect(() => {
            navigate('/login'); {
            return;;
        }  }
        setSelectedRecipeForRating(recipe);    }, [location.state]);
        setIsRatingModalOpen(true);
    };

    const handleRatingModalClose = (updatedRecipe) => {if (socket) {
        setIsRatingModalOpen(false);peApproved = (data) => {
        setSelectedRecipeForRating(null);ev => 
                   prev.map(recipe => 
        if (updatedRecipe) {                  recipe._id === data.recipeId
            fetchSharedRecipes();                            ? { ...recipe, shareStatus: 'approved', isShared: true }
        }
    };
          );
    const handleCardClick = (recipeId) => {            };
        navigate(`/recipe/${recipeId}`);
    };  const handleRecipeRejected = (data) => {
rRecipes(prev => 
    return (
        <>peId
            <Navbar />: 'rejected', isShared: false, rejectionReason: data.reason }
            <div className="shared-recipes-page">
                <div className="page-container">
                    <div className="community-header">
                        <div className="header-badge">
                            <i className="bx bx-group"></i>
                            Community Showcase
                        </div>Rejected', handleRecipeRejected);
                        <h1>
                            Discover <span className="highlight">Amazing</span> Recipes            return () => {
                        </h1>peApproved', handleRecipeApproved);
                    </div>jected);

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
                                    <div className="ingredient-float ing-2">🍅</div>tch errors, just log them
                                    <div className="ingredient-float ing-3">🧄</div>
                                    <div className="ingredient-float ing-4">🌿</div>
                                </div>
                            </div>
                            <div className="no-recipes-content">
                                <h3 className="no-recipes-title">No Community Recipes Yet</h3>
                                <p className="no-recipes-subtitle">
                                    Be the first to share your culinary masterpiece with our community! .meta.env.MODE === "development" 
                                    Create and share recipes to inspire fellow food enthusiasts.lhost:5000" 
                                </p>
                            </div>
                        </div>
                    ) : (pes/user`,
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
                                            onError={e => {et(`${baseURL}/api/favorites`, {
                                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                            }}
                                        />
                                    </div>
                                    <div className="recipe-content">nse.data.favorites);
                                        <h3 className="recipe-title">{recipe.title}</h3>
                                        <p className="recipe-desc">{recipe.description}</p>
                                        
                                        {/* Match RecipePage layout: category and rate button in same row */}
                                        <div className="recipe-meta">
                                            <div className="recipe-category">{recipe.category}</div>
                                            <CommunityRateRecipe 
                                                recipe={recipe}
                                                onRateClick={handleRateRecipe}env.MODE === "development" 
                                            />
                                        </div>
                                        
                                        {/* Rating Display */}count`, {
                                        {recipe.averageRating > 0 && (
                                            <div className="recipe-rating-display">
                                                <div className="stars">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <i 
                                                            key={star}
                                                            className={`bx ${star <= Math.round(recipe.averageRating) ? 'bxs-star' : 'bx-star'}`}
                                                            style={{ color: '#CF996C' }}nt:', error);
                                                        ></i>
                                                    ))}
                                                </div>
                                                <span className="rating-text">
                                                    {recipe.averageRating.toFixed(1)} ({recipe.ratings?.length || 0} {recipe.ratings?.length === 1 ? 'rating' : 'ratings'})
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Enhanced Author Info */}
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
                                        
                                        {/* Additional Meta Information */}
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
                                                </div> {
                                            )}
                                        </div>
                                    </div>null;
                                </div>rm.profileImage) {
                            ))}Image = await new Promise((resolve, reject) => {
                        </div>  const reader = new FileReader();
                    )}                    reader.onloadend = () => resolve(reader.result);
                </div>or = reject;
            </div>er.readAsDataURL(editForm.profileImage);

            {/* Rating Modal */}
            <RatingModal
                isOpen={isRatingModalOpen}  bio: editForm.bio,
                onClose={handleRatingModalClose}     profileImage: base64Image,
                recipe={selectedRecipeForRating}      };
            />          
        </>            const baseURL = import.meta.env.MODE === "development" 
    );ost:5000" 



export default SharedRecipePage;};                : "";
                
            const response = await axios.put(
                `${baseURL}/api/users/profile`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true
                }
            );
            
            if (response.data.success) {
                setUser(response.data.user);
                setIsEditing(false);
                setImagePreview(null);
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }
    };

    const getProfileImageUrl = () => {
        if (imagePreview) return imagePreview;
        return user?.profileImage || DEFAULT_PROFILE_IMAGE;
    };

    // FIXED: Updated function to properly handle Cloudinary URLs
    const getRecipeImageUrl = (imageUrl) => {
        // If no image URL provided, return placeholder
        if (!imageUrl) {
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        
        // If it's already a complete URL (Cloudinary or other external), use it as is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        
        // If it's a relative path (old local uploads), construct the full URL
        const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
        return `${baseURL}${cleanPath}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleRemoveFromFavorites = async (recipeId, event) => {
        event.stopPropagation();
        
        // Optimistic update
        const previousFavorites = favoriteRecipes;
        const previousCount = favoriteCount;
        
        setFavoriteRecipes(prev => prev.filter(favorite => favorite.recipe._id !== recipeId));
        setFavoriteCount(prev => Math.max(0, prev - 1));
        
        try {
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            const response = await axios.delete(`${baseURL}/api/favorites/${recipeId}`, {
                withCredentials: true
            });
            
            if (response.data.success) {
                toast.success("Recipe removed from favorites!", {
                    style: {
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#222",
                        boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                        fontWeight: 600,
                    },
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                });
            } else {
                // Revert on failure
                setFavoriteRecipes(previousFavorites);
                setFavoriteCount(previousCount);
                throw new Error("Failed to remove from favorites");
            }
        } catch (error) {
            // Revert optimistic update on error
            setFavoriteRecipes(previousFavorites);
            setFavoriteCount(previousCount);
            
            console.error('Error removing from favorites:', error);
            toast.error("Failed to remove from favorites. Please try again.", {
                style: {
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#222",
                    boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                    fontWeight: 600,
                },
                iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                },
            });
        }
    };

    const handleEditRecipe = (recipe) => {
        if (recipe.shareStatus === 'approved' && recipe.isShared) {
            Swal.fire({
                title: 'Recipe is Shared',
                text: 'This recipe is currently shared in the community. You need to remove it from community first before editing.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Remove & Edit',
                cancelButtonText: 'Cancel',
                customClass: {
                    popup: 'swal-wide'
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const baseURL = import.meta.env.MODE === "development"
                            ? "http://localhost:5000"
                            : "";
                        
                        const response = await fetch(`${baseURL}/api/recipes/${recipe._id}/unshare`, {
                            method: "POST",
                            credentials: "include",
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            toast.success("Recipe removed from community! You can now edit it.", {
                                style: {
                                    borderRadius: "8px",
                                    background: "#fff",
                                    color: "#222",
                                    boxShadow: "0 4px 16px rgba(16,185,129,0.15)",
                                    fontWeight: 600,
                                },
                                iconTheme: {
                                    primary: "#10b981",
                                    secondary: "#fff",
                                },
                            });
                            
                            setUserRecipes(prev => 
                                prev.map(r => 
                                    r._id === recipe._id 
                                        ? { ...r, shareStatus: 'not_shared', isShared: false } 
                                        : r
                                )
                            );
                            
                            const updatedRecipe = { ...recipe, shareStatus: 'not_shared', isShared: false };
                            setEditRecipeData(updatedRecipe);
                            setShowEditModal(true);
                        } else {
                            throw new Error(data.message || 'Failed to remove recipe from community');
                        }
                    } catch (error) {
                        console.error('Error unsharing recipe:', error);
                        toast.error("Failed to remove recipe from community. Please try again.", {
                            style: {
                                borderRadius: "8px",
                                background: "#fff",
                                color: "#222",
                                boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                                fontWeight: 600,
                            },
                            iconTheme: {
                                primary: "#ef4444",
                                secondary: "#fff",
                            },
                        });
                    }
                }
            });
        } else {
            setEditRecipeData(recipe);
            setShowEditModal(true);
        }
    };

    const handleEditModalClose = (updated) => {
        setShowEditModal(false);
        setEditRecipeData(null);
        if (updated) fetchUserRecipes();
    };

    const handleShareRecipe = async (recipe, e) => {
        e.stopPropagation();
        
        const result = await Swal.fire({
            title: 'Share Recipe?',
            text: 'Your recipe will be submitted for review before being shared publicly.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, submit for review!'
        });

        if (result.isConfirmed) {
            try {
                const baseURL = import.meta.env.MODE === "development"
                    ? "http://localhost:5000"
                    : "";
                
                const response = await fetch(`${baseURL}/api/recipes/${recipe._id}/share`, {
                    method: "POST",
                    credentials: "include",
                });
                
                const data = await response.json();
                
                if (data.success) {
                    toast.success("Recipe submitted for review!", {
                        style: {
                            borderRadius: "8px",
                            background: "#fff",
                            color: "#222",
                            boxShadow: "0 4px 16px rgba(16,185,129,0.15)",
                            fontWeight: 600,
                        },
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#fff",
                        },
                    });
                    fetchUserRecipes(); // Refresh to show pending status
                } else {
                    throw new Error(data.message || 'Failed to share recipe');
                }
            } catch (error) {
                console.error('Error sharing recipe:', error);
                toast.error("Failed to share recipe. Please try again.", {
                    style: {
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#222",
                        boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                        fontWeight: 600,
                    },
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                });
            }
        }
    };

    const handleUnshareRecipe = async (recipe, e) => {
        e.stopPropagation();
        
        const result = await Swal.fire({
            title: 'Remove from Community?',
            text: 'This will remove your recipe from the community page. You can share it again later.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            try {
                const baseURL = import.meta.env.MODE === "development"
                    ? "http://localhost:5000"
                    : "";
                
                const response = await fetch(`${baseURL}/api/recipes/${recipe._id}/unshare`, {
                    method: "POST",
                    credentials: "include",
                });
                
                const data = await response.json();
                
                if (data.success) {
                    toast.success("Recipe removed from community!", {
                        style: {
                            borderRadius: "8px",
                            background: "#fff",
                            color: "#222",
                            boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                            fontWeight: 600,
                        },
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#fff",
                        },
                    });
                    
                    setUserRecipes(prev => 
                        prev.map(r => 
                            r._id === recipe._id 
                                ? { ...r, shareStatus: 'not_shared', isShared: false } 
                                : r
                        )
                    );
                } else {
                    throw new Error(data.message || 'Failed to remove recipe from community');
                }
            } catch (error) {
                console.error('Error unsharing recipe:', error);
                toast.error("Failed to remove recipe from community. Please try again.", {
                    style: {
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#222",
                        boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                        fontWeight: 600,
                    },
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                });
            }
        }
    };

    const handleDeleteRecipe = (recipe, e) => {
        e.stopPropagation();
        setRecipeToDelete(recipe);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!recipeToDelete) return;
        
        setDeleting(true);
        try {
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            const res = await fetch(`${baseURL}/api/recipes/${recipeToDelete._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Recipe deleted!", {
                    style: {
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#222",
                        boxShadow: "0 4px 16px rgba(239,68,68,0.15)",
                        fontWeight: 600,
                    },
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                });
                fetchUserRecipes();
            } else {
                toast.error(data.message || "Failed to delete recipe.", {
                    style: {
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#b91c1c",
                        fontWeight: 600,
                    },
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                });
            }
        } catch (error) {
            toast.error("Failed to delete recipe.", {
                style: {
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#b91c1c",
                    fontWeight: 600,
                },
                iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                },
            });
        }
        setDeleting(false);
        setConfirmOpen(false);
        setRecipeToDelete(null);
    };

    // Show loading state while checking auth
    if (isCheckingAuth) {
        return (
            <div className="user-profile-page">
                <Navbar />
                <div className="loading">
                    <div className="loading-spinner">
                        <i className="bx bx-loader-alt bx-spin"></i>
                    </div>
                    <p>Loading your profile...</p>
                </div>
            </div>
        );
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="user-profile-page">
                <Navbar />
                <div className="error-container">
                    <div className="error-message">
                        <i className="bx bx-error-circle"></i>
                        <h2>Please Log In</h2>
                        <p>You need to be logged in to view your profile.</p>
                        <button onClick={() => navigate('/login')} className="login-btn">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="user-profile-page">
            <Navbar />
            
            <div className="profile-container">
                {/* Profile Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="profile-hero"
                >
                    <div className="hero-background">
                        <div className="hero-overlay"></div>
                        <div className="hero-content">
                            <div className="hero-image">
                                <img src={getProfileImageUrl()} alt="Profile" className="hero-profile-image" />
                                <div className="online-indicator"></div>
                            </div>
                            <div className="hero-info">
                                <h1>Welcome back, {user.name}!</h1>
                                <p className="hero-subtitle">
                                    <i className="bx bx-calendar"></i>
                                    Member since {formatDate(user.createdAt)}
                                </p>
                                <div className="hero-stats">
                                    <div className="stat-item">
                                        <i className="bx bx-book-alt"></i>
                                        <span>{userRecipes.length}</span>
                                        <small>Recipes</small>
                                    </div>
                                    <div className="stat-item">
                                        <i className="bx bx-heart"></i>
                                        <span>{favoriteCount}</span>
                                        <small>Favorites</small>
                                    </div>
                                    <div className="stat-item">
                                        <i className="bx bx-trophy"></i>
                                        <span>Foodie</span>
                                        <small>Level</small>
                                    </div>
                                </div>
                            </div>
                            <div className="hero-actions">
                                <button onClick={handleEditToggle} className="edit-profile-hero-btn">
                                    <i className="bx bx-edit"></i>
                                    Edit Profile
                                </button>
                                <button onClick={handleLogout} className="logout-hero-btn">
                                    <i className="bx bx-log-out"></i>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="profile-content">
                    {/* Profile Details Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="profile-details"
                    >
                        <div className="section-header">
                            <h2><i className="bx bx-user-circle"></i> Profile Details</h2>
                            {!isEditing && (
                                <button onClick={handleEditToggle} className="quick-edit-btn">
                                    <i className="bx bx-edit-alt"></i>
                                </button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <form onSubmit={handleSaveProfile} className="edit-form">
                                <div className="profile-image-section">
                                            <i className="bx bx-camera"></i>lassName="profile-image-container">
                                        </label>e" />
                                        <input  <label htmlFor="profile-image-input" className="image-upload-btn">
                                            id="profile-image-input"    </div>
                                            type="file"nt">Click the camera icon to change your photo</p>
                                </div>
                                
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label><i className="bx bx-envelope"></i> Email:</label>
                                        <input
                                            type="email"
                                            value={editForm.email}
                                            disabled
                                            className="disabled-input"
                                        />
                                        <small><i className="bx bx-info-circle"></i> Email cannot be changed</small>
                                    </div>
                                    
                                    <div className="form-group full-width">
                                        <label><i className="bx bx-message-square-detail"></i> Bio:</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                            placeholder="Tell us about yourself..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-actions">
                                    <button type="button" onClick={handleEditToggle} className="cancel-btn">
                                        <i className="bx bx-x"></i>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        <i className="bx bx-check"></i>
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="info-icon">
                                            <i className="bx bx-envelope"></i>
                                        </div>
                                        <div className="info-content">
                                            <label>Email</label>
                                            <span>{user.email || 'Loading...'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item full-width">
                                        <div className="info-icon">
                                            <i className="bx bx-message-square-detail"></i>
                                        </div>
                                        <div className="info-content">
                                            <label>Bio</label>
                                            <span>{user.bio || 'No bio available'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <div className="info-icon">
                                            <i className="bx bx-shield-check"></i>
                                        </div>
                                        <div className="info-content">
                                            <label>Account Status</label>
                                            <span className="status-verified">
                                                <i className="bx bx-check-circle"></i>
                                                Verified
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* My Recipes/Favorites Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="my-recipes"
                    >
                        <div className="section-header">
                            <div className="tab-header">
                                <button 
                                    className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('recipes')}
                                >
                                    <i className="bx bx-book-alt"></i> 
                                    My Recipes ({userRecipes.length})
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('favorites')}
                                >
                                    <i className="bx bx-heart"></i> 
                                    My Favorites ({favoriteCount})
                                </button>
                            </div>
                        </div>
                        
                        {isLoading ? (
                            <div className="loading">
                                <div className="loading-spinner">
                                    <i className="bx bx-loader-alt bx-spin"></i>
                                </div>
                                <p>Loading your delicious {activeTab === 'recipes' ? 'recipes' : 'favorites'}...</p>
                            </div>
                        ) : (
                            <>
                                {/* My Recipes Tab */}
                                {activeTab === 'recipes' && (
                                    userRecipes.length > 0 ? (
                                        <div className="recipes-grid">
                                            {userRecipes.map((recipe, index) => (
                                                <motion.div 
                                                    key={recipe._id} 
                                                    className="recipe-card" 
                                                    onClick={() => navigate(`/recipe/${recipe._id}`)}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    style={{ position: 'relative' }}
                                                >
                                                    <div className="recipe-image">
                                                        <img 
                                                            src={getRecipeImageUrl(recipe.imageUrl)} 
                                                            alt={recipe.title || recipe.name} 
                                                            onError={(e) => {
                                                                e.target.src = '/api/placeholder/200/150';
                                                            }}
                                                        />
                                                        <div className="recipe-overlay">
                                                            <i className="bx bx-right-arrow-alt"></i>
                                                        </div>
                                                    </div>
                                                    <div className="recipe-info">
                                                        <h3>{recipe.title || recipe.name}</h3>
                                                        <p>{recipe.description}</p>
                                                        <div className="recipe-meta">
                                                            <div className="meta-item">
                                                                <i className="bx bx-category"></i>
                                                                <span className="category">{recipe.category}</span>
                                                            </div>
                                                            <div className="meta-item">
                                                                <i className="bx bx-time"></i>
                                                                <span className="date">{formatDate(recipe.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        {recipe.cookingTime && (
                                                            <div className="cooking-time">
                                                                <i className="bx bx-timer"></i>
                                                                <span>{recipe.cookingTime} mins</span>
                                                            </div>
                                                        )}
                                                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                                            <button
                                                                className="edit-recipe-btn-mini"
                                                                title="Edit Recipe"
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleEditRecipe(recipe);
                                                                }}
                                                            >
                                                                <i className="bx bx-edit"></i>
                                                            </button>
                                                            
                                                            {recipe.shareStatus === 'approved' && recipe.isShared ? (
                                                                <button
                                                                    className="edit-recipe-btn-mini"
                                                                    title="Remove from Community"
                                                                    onClick={e => handleUnshareRecipe(recipe, e)}
                                                                    style={{ background: "#f59e0b" }}
                                                                >
                                                                    <i className="bx bx-share-alt"></i>
                                                                </button>
                                                            ) : recipe.shareStatus === 'pending' ? (
                                                                <button
                                                                    className="edit-recipe-btn-mini"
                                                                    title="Pending Review"
                                                                    disabled
                                                                    style={{ background: "#6b7280", cursor: "not-allowed" }}
                                                                >
                                                                    <i className="bx bx-time"></i>
                                                                </button>
                                                            ) : recipe.shareStatus === 'rejected' ? (
                                                                <button
                                                                    className="edit-recipe-btn-mini"
                                                                    title={`Rejected: ${recipe.rejectionReason || 'No reason provided'}`}
                                                                    onClick={e => handleShareRecipe(recipe, e)}
                                                                    style={{ background: "#ef4444" }}
                                                                >
                                                                    <i className="bx bx-x"></i>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="edit-recipe-btn-mini"
                                                                    title="Share Recipe"
                                                                    onClick={e => handleShareRecipe(recipe, e)}
                                                                    style={{ background: "#10b981" }}
                                                                >
                                                                    <Share2 size={18} />
                                                                </button>
                                                            )}
                                                            
                                                            <button
                                                                className="edit-recipe-btn-mini"
                                                                title="Delete Recipe"
                                                                onClick={e => handleDeleteRecipe(recipe, e)}
                                                                style={{ background: "#ef4444" }}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-recipes">
                                            <div className="empty-state">
                                                <i className="bx bx-restaurant"></i>
                                                <h3>No recipes yet!</h3>
                                                <p>Start sharing your culinary creations with the world.</p>
                                                <button onClick={() => navigate('/create-recipe')} className="create-recipe-btn">
                                                    <i className="bx bx-plus"></i>
                                                    Create Your First Recipe
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* My Favorites Tab */}
                                {activeTab === 'favorites' && (
                                    favoriteRecipes.length > 0 ? (
                                        <div className="recipes-grid">
                                            {favoriteRecipes
                                                .filter(favorite => favorite && favorite.recipe && favorite.recipe._id)
                                                .map((favorite, index) => (
                                                    <motion.div 
                                                        key={`favorite-${favorite._id}-${favorite.recipe._id}`}
                                                        className="recipe-card favorite-card" 
                                                        onClick={() => navigate(`/recipe/${favorite.recipe._id}`)}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className="recipe-image">
                                                            <img 
                                                                src={getRecipeImageUrl(favorite.recipe.imageUrl)} 
                                                                alt={favorite.recipe.title || favorite.recipe.name || 'Recipe'} 
                                                                onError={(e) => {
                                                                    e.target.src = '/api/placeholder/200/150';
                                                                }}
                                                            />
                                                            <div className="recipe-overlay">
                                                                <i className="bx bx-right-arrow-alt"></i>
                                                            </div>
                                                            <button
                                                                className="remove-favorite-btn"
                                                                onClick={(e) => handleRemoveFromFavorites(favorite.recipe._id, e)}
                                                                title="Remove from favorites"
                                                            >
                                                                <i className="bx bxs-heart"></i>
                                                            </button>
                                                        </div>
                                                        <div className="recipe-info">
                                                            <h3>{favorite.recipe.title || favorite.recipe.name || 'Untitled Recipe'}</h3>
                                                            <p>{favorite.recipe.description || 'No description available'}</p>
                                                            <div className="recipe-meta">
                                                                <div className="meta-item">
                                                                    <i className="bx bx-category"></i>
                                                                    <span className="category">{favorite.recipe.category || 'Uncategorized'}</span>
                                                                </div>
                                                                <div className="meta-item">
                                                                    <i className="bx bx-heart"></i>
                                                                    <span className="date">Favorited {formatDate(favorite.createdAt)}</span>
                                                                </div>
                                                            </div>
                                                            {favorite.recipe.cookingTime && (
                                                                <div className="cooking-time">
                                                                    <i className="bx bx-timer"></i>
                                                                    <span>{favorite.recipe.cookingTime} mins</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="no-recipes">
                                            <div className="empty-state">
                                                <i className="bx bx-heart"></i>
                                                <h3>No favorites yet!</h3>
                                                <p>Start adding recipes to your favorites to see them here.</p>
                                                <button onClick={() => navigate('/recipes')} className="create-recipe-btn">
                                                    <i className="bx bx-search-alt"></i>
                                                    Browse Recipes
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Edit Recipe Modal */}
            {showEditModal && (
                <div className="edit-recipe-modal-overlay">
                    <div className="edit-recipe-modal-content">
                        <EditRecipePage
                            recipe={editRecipeData}
                            onClose={handleEditModalClose}
                        />
                    </div>
                </div>
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmOpen}
                title="Delete Recipe"
                description={
                    recipeToDelete
                        ? `Are you sure you want to delete "${recipeToDelete.title}"? This cannot be undone.`
                        : ""
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setConfirmOpen(false);
                    setRecipeToDelete(null);
                }}
                loading={deleting}
            />
        </div>
    );
};

export default UserProfilePage;