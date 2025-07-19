import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navbar from './NavbarPage';
import { motion } from 'framer-motion';
import axios from 'axios';
import './UserProfilePage.scss';
import EditRecipePage from '../recipessection/EditRecipePage';
import { Share2, Trash2 } from "lucide-react"; // Add Trash2 icon
import { toast } from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";

const DEFAULT_PROFILE_IMAGE = "https://i.ibb.co/WvG991xq/profile-default.png";

const UserProfilePage = () => {
    const { user, logout, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [userRecipes, setUserRecipes] = useState([]);
    const [favoriteRecipes, setFavoriteRecipes] = useState([]);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('recipes');
    const [editForm, setEditForm] = useState({
        email: user?.email || '',
        bio: user?.bio || '',
        profileImage: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editRecipeData, setEditRecipeData] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchUserRecipes(),
            fetchUserFavorites(),
            fetchFavoriteCount()
        ]);
        setIsLoading(false);
    };

    const fetchUserRecipes = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/recipes/user" : "/api/recipes/user"}`,
                { withCredentials: true }
            );
            setUserRecipes(response.data.recipes || []);
        } catch (error) {
            console.error('Error fetching user recipes:', error);
            setUserRecipes([]);
        }
    };

    const fetchUserFavorites = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/favorites" : "/api/favorites"}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setFavoriteRecipes(response.data.favorites || []);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavoriteRecipes([]);
        }
    };

    const fetchFavoriteCount = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/favorites/count" : "/api/favorites/count"}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setFavoriteCount(response.data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching favorite count:', error);
            setFavoriteCount(0);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditForm({
                email: user?.email || '',
                bio: user?.bio || '',
                profileImage: null
            });
            setImagePreview(null);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditForm(prev => ({ ...prev, profileImage: file }));
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            let base64Image = null;
            if (editForm.profileImage) {
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(editForm.profileImage);
                });
            }
            const payload = {
                bio: editForm.bio,
                profileImage: base64Image,
            };
            const response = await axios.put(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/users/profile" : "/api/users/profile"}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true
                }
            );
            if (response.data.success) {
                setUser(response.data.user); // <-- UPDATE GLOBAL USER
                setIsEditing(false);
                setImagePreview(null);
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const getProfileImageUrl = () => {
        if (imagePreview) return imagePreview;
        // Use default image if no profileImage
        return user?.profileImage || DEFAULT_PROFILE_IMAGE;
    };

    const getRecipeImageUrl = (imageUrl) => {
        if (!imageUrl) return '/api/placeholder/200/150';
        
        if (imageUrl.startsWith('http')) return imageUrl;
        
        const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        return `${baseURL}${imageUrl}`;
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
        
        try {
            await axios.delete(`http://localhost:5000/api/favorites/${recipeId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            // Refresh favorites data
            await fetchUserFavorites();
            await fetchFavoriteCount();
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('Failed to remove from favorites. Please try again.');
        }
    };

    // Open modal and pass recipe data
    const handleEditRecipe = (recipe) => {
        setEditRecipeData(recipe);
        setShowEditModal(true);
    };

    // After save/cancel in modal
    const handleEditModalClose = (updated) => {
        setShowEditModal(false);
        setEditRecipeData(null);
        if (updated) fetchUserRecipes();
    };

    const handleShareRecipe = async (recipe, e) => {
        e.stopPropagation();
        try {
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
            await fetch(`${baseURL}/api/recipes/${recipe._id}/share`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            toast.success("Recipe shared successfully!", {
                style: {
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#222",
                    boxShadow: "0 4px 16px rgba(207,153,108,0.15)",
                    fontWeight: 600,
                },
                iconTheme: {
                    primary: "#10b981",
                    secondary: "#fff",
                },
            });
            setTimeout(() => navigate("/shared-recipes"), 1200);
        } catch (error) {
            toast.error("Failed to share recipe.", {
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
    };

    // Delete recipe handler
    const handleDeleteRecipe = (recipe, e) => {
        e.stopPropagation();
        setRecipeToDelete(recipe);
        setConfirmOpen(true);
    };

    // Actual delete logic
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

    if (!user) {
        return (
            <div className="user-profile-page">
                <Navbar />
                <div className="error-container">
                    <div className="error-message">
                        <i className="bx bx-error-circle"></i>
                        <h2>Invalid user ID</h2>
                        <p>Please log in to view your profile.</p>
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
                {/* Enhanced Profile Header */}
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
                    {/* Enhanced Profile Details Section */}
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
                                    <div className="profile-image-container">
                                        <img src={getProfileImageUrl()} alt="Profile" className="profile-image" />
                                        <label htmlFor="profile-image-input" className="image-upload-btn">
                                            <i className="bx bx-camera"></i>
                                        </label>
                                        <input
                                            id="profile-image-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                    <p className="upload-hint">Click the camera icon to change your photo</p>
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

                    {/* Enhanced My Recipes/Favorites Section */}
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
                                                        {/* EDIT & SHARE BUTTONS - ICON ONLY, SMALL */}
                                                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                                            <button
                                                                className="edit-recipe-btn-mini"
                                                                title="Edit Recipe"
                                                                onClick={e => { e.stopPropagation(); handleEditRecipe(recipe); }}
                                                            >
                                                                <i className="bx bx-edit"></i>
                                                            </button>
                                                            <button
                                                                className="edit-recipe-btn-mini"
                                                                title="Share Recipe"
                                                                onClick={e => handleShareRecipe(recipe, e)}
                                                                style={{ background: "#10b981" }}
                                                            >
                                                                <Share2 size={18} />
                                                            </button>
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
                                            {favoriteRecipes.map((favorite, index) => (
                                                <motion.div 
                                                    key={favorite._id} 
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
                                                            alt={favorite.recipe.title || favorite.recipe.name} 
                                                            onError={(e) => {
                                                                e.target.src = '/api/placeholder/200/150';
                                                            }}
                                                        />
                                                        <div className="recipe-overlay">
                                                            <i className="bx bx-right-arrow-alt"></i>
                                                        </div>
                                                        {/* Remove from favorites button */}
                                                        <button
                                                            className="remove-favorite-btn"
                                                            onClick={(e) => handleRemoveFromFavorites(favorite.recipe._id, e)}
                                                            title="Remove from favorites"
                                                        >
                                                            <i className="bx bxs-heart"></i>
                                                        </button>
                                                    </div>
                                                    <div className="recipe-info">
                                                        <h3>{favorite.recipe.title || favorite.recipe.name}</h3>
                                                        <p>{favorite.recipe.description}</p>
                                                        <div className="recipe-meta">
                                                            <div className="meta-item">
                                                                <i className="bx bx-category"></i>
                                                                <span className="category">{favorite.recipe.category}</span>
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
                onCancel={() => { setConfirmOpen(false); setRecipeToDelete(null); }}
                loading={deleting}
            />
        </div>
    );
};

export default UserProfilePage;