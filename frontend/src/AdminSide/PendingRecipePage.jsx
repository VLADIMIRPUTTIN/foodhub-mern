import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './PendingRecipePage.scss';
import { useSocket } from '../context/SocketContext'; // Add this import

const baseURL = import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "";

const PendingRecipePage = ({ onRecipeModerated }) => {
    const [pendingRecipes, setPendingRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showRejectionDialog, setShowRejectionDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { socket } = useSocket(); // Add this line

    // Filter recipes based on search
    const filteredRecipes = pendingRecipes.filter(recipe => 
        recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchPendingRecipes();
    }, []);
    
    // Add Socket.IO event listeners for real-time updates
    useEffect(() => {
        if (!socket) return;
        
        // Listen for new pending recipes
        const handleRecipePending = (newRecipe) => {
            // Check if recipe is already in the list to avoid duplicates
            setPendingRecipes(prev => {
                const exists = prev.some(recipe => recipe._id === newRecipe._id);
                if (exists) return prev;
                return [newRecipe, ...prev];
            });
            
            // Show success notification
            setSuccess(`New recipe "${newRecipe.title}" pending approval`);
            setTimeout(() => setSuccess(''), 3000);
        };
        
        // Listen for recipe status changes
        const handleRecipeStatusChange = (recipeId) => {
            // Remove the recipe from the pending list
            setPendingRecipes(prev => prev.filter(recipe => recipe._id !== recipeId));
            
            // Notify parent component about the change
            if (onRecipeModerated) {
                onRecipeModerated();
            }
        };
        
        // Register event listeners
        socket.on('recipePending', handleRecipePending);
        socket.on('recipeApproved', data => handleRecipeStatusChange(data.recipeId));
        socket.on('recipeRejected', data => handleRecipeStatusChange(data.recipeId));
        
        // Cleanup event listeners on component unmount
        return () => {
            socket.off('recipePending', handleRecipePending);
            socket.off('recipeApproved');
            socket.off('recipeRejected');
        };
    }, [socket, onRecipeModerated]);

    const fetchPendingRecipes = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/recipes/admin/pending`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setPendingRecipes(response.data.recipes);
        } catch (error) {
            console.error('Error fetching pending recipes:', error);
            setError('Failed to fetch pending recipes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecipe = (recipe) => {
        setSelectedRecipe(recipe);
        setShowModal(true);
    };

    const handleModerateRecipe = async (recipeId, action, rejectionReason = '') => {
        setActionLoading(true);
        setError('');

        try {
            const response = await axios.patch(
                `${baseURL}/api/recipes/${recipeId}/moderate`,
                { action, rejectionReason },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success) {
                setPendingRecipes(prev => prev.filter(recipe => recipe._id !== recipeId));
                
                const actionText = action === 'approve' ? 'approved' : 'rejected';
                setSuccess(`Recipe ${actionText} successfully!`);
                
                // Close modals
                setShowModal(false);
                setSelectedRecipe(null);
                setShowApprovalDialog(false);
                setShowRejectionDialog(false);
                setRejectionReason('');
                
                // Notify parent component for dashboard updates
                if (onRecipeModerated) {
                    onRecipeModerated();
                }

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error moderating recipe:', error);
            setError('Failed to moderate recipe. Please try again.');
            setTimeout(() => setError(''), 3000);
        } finally {
            setActionLoading(false);
        }
    };

    const handleApprove = (recipeId) => {
        setSelectedRecipe(pendingRecipes.find(r => r._id === recipeId));
        setShowApprovalDialog(true);
    };

    const handleReject = (recipeId) => {
        setSelectedRecipe(pendingRecipes.find(r => r._id === recipeId));
        setShowRejectionDialog(true);
    };

    const confirmApproval = () => {
        handleModerateRecipe(selectedRecipe._id, 'approve');
    };

    const confirmRejection = () => {
        handleModerateRecipe(selectedRecipe._id, 'reject', rejectionReason || 'No reason provided');
    };

    const getImageUrl = (recipe) => {
        if (!recipe.imageUrl) {
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        if (recipe.imageUrl.startsWith('http')) {
            return recipe.imageUrl;
        }
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
        if (import.meta.env.MODE === "development") {
            return `http://localhost:5000/${cleanPath}`;
        }
        return `/${cleanPath}`;
    };

    const closeAllModals = () => {
        setShowModal(false);
        setShowApprovalDialog(false);
        setShowRejectionDialog(false);
        setSelectedRecipe(null);
        setRejectionReason('');
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    if (loading) {
        return (
            <div className="pending-recipes-page">
                <div className="loading-state">
                    <div className="spinner-large"></div>
                    <h3>Loading pending recipes...</h3>
                    <p>Please wait while we fetch the latest submissions</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-recipes-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1 className="page-title">
                            <i className="bx bx-time-five"></i>
                            Pending Recipe Reviews
                        </h1>
                        <p className="page-subtitle">
                            Review and moderate user-submitted recipes before they go public
                        </p>
                    </div>
                    <div className="stats-badge">
                        <span className="count">{filteredRecipes.length}</span>
                        <span className="label">pending reviews</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="search-container">
                    <div className="search-wrapper">
                        <i className="bx bx-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search recipes by title, category, or creator..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button 
                                className="clear-search"
                                onClick={clearSearch}
                                title="Clear search"
                            >
                                <i className="bx bx-x"></i>
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <div className="search-results">
                            <i className="bx bx-filter"></i>
                            Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </div>
                    )}
                </div>
            </div>

            {/* Alert Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="alert alert--error"
                    >
                        <i className="bx bx-error-circle alert__icon"></i>
                        {error}
                        <button onClick={() => setError('')} className="alert__close">
                            <i className="bx bx-x"></i>
                        </button>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="alert alert--success"
                    >
                        <i className="bx bx-check-circle alert__icon"></i>
                        {success}
                        <button onClick={() => setSuccess('')} className="alert__close">
                            <i className="bx bx-x"></i>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {filteredRecipes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__content">
                        <i className="bx bx-check-circle empty-state__icon"></i>
                        <h3 className="empty-state__title">
                            {searchTerm ? 'No recipes found' : 'All caught up!'}
                        </h3>
                        <p className="empty-state__description">
                            {searchTerm 
                                ? `No recipes match your search for "${searchTerm}"`
                                : "No recipes pending review at the moment. Great job keeping up with submissions!"
                            }
                        </p>
                        {searchTerm && (
                            <button 
                                className="btn btn--primary"
                                onClick={clearSearch}
                            >
                                <i className="bx bx-refresh"></i>
                                Clear Search
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="pending-recipes-grid">
                    {filteredRecipes.map((recipe, index) => (
                        <motion.div
                            key={recipe._id}
                            className="recipe-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                        >
                            <div className="recipe-card__image">
                                <img
                                    src={getImageUrl(recipe)}
                                    alt={recipe.title}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                    }}
                                />
                                <div className="recipe-card__overlay">
                                    <button
                                        className="btn btn--secondary btn--sm"
                                        onClick={() => handleViewRecipe(recipe)}
                                    >
                                        <i className="bx bx-show"></i>
                                        View Details
                                    </button>
                                </div>
                            </div>
                            
                            <div className="recipe-card__content">
                                <h3 className="recipe-card__title">{recipe.title}</h3>
                                <p className="recipe-card__description">{recipe.description}</p>
                                
                                <div className="recipe-card__meta">
                                    <span className="meta-item">
                                        <i className="bx bx-category"></i>
                                        {recipe.category}
                                    </span>
                                    <span className="meta-item">
                                        <i className="bx bx-user"></i>
                                        {recipe.createdBy?.name || 'Unknown User'}
                                    </span>
                                    <span className="meta-item">
                                        <i className="bx bx-calendar"></i>
                                        {new Date(recipe.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="recipe-card__actions">
                                    <button
                                        className="btn btn--success btn--sm"
                                        onClick={() => handleApprove(recipe._id)}
                                        disabled={actionLoading}
                                    >
                                        <i className="bx bx-check"></i>
                                        Approve
                                    </button>
                                    <button
                                        className="btn btn--destructive btn--sm"
                                        onClick={() => handleReject(recipe._id)}
                                        disabled={actionLoading}
                                    >
                                        <i className="bx bx-x"></i>
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Recipe Details Modal */}
            <AnimatePresence>
                {showModal && selectedRecipe && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--large"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal__header">
                                <h3 className="modal__title">
                                    <i className="bx bx-food-menu"></i>
                                    {selectedRecipe.title}
                                </h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <div className="recipe-detail__image">
                                    <img
                                        src={getImageUrl(selectedRecipe)}
                                        alt={selectedRecipe.title}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                        }}
                                    />
                                </div>
                                
                                <div className="recipe-detail__content">
                                    <div className="detail-section">
                                        <h4 className="detail-section__title">
                                            <i className="bx bx-detail"></i>
                                            Description
                                        </h4>
                                        <p className="detail-section__text">{selectedRecipe.description}</p>
                                    </div>

                                    <div className="detail-section">
                                        <h4 className="detail-section__title">
                                            <i className="bx bx-leaf"></i>
                                            Ingredients
                                        </h4>
                                        <div className="ingredients-grid">
                                            {selectedRecipe.ingredients.map((ingredient, index) => (
                                                <div key={`ingredient-${index}-${ingredient.name || 'unknown'}`} className="ingredient-item">
                                                    <span className="ingredient-amount">
                                                        {ingredient.amount} {ingredient.unit}
                                                    </span>
                                                    <span className="ingredient-name">{ingredient.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h4 className="detail-section__title">
                                            <i className="bx bx-list-ol"></i>
                                            Instructions
                                        </h4>
                                        <div className="instructions-list">
                                            {(selectedRecipe.instructions || selectedRecipe.steps || []).map((instruction, index) => (
                                                <div key={`instruction-${index}-${selectedRecipe._id}`} className="instruction-item">
                                                    <span className="instruction-number">{index + 1}</span>
                                                    <span className="instruction-text">
                                                        {typeof instruction === 'string' ? instruction : instruction.instruction || instruction.details}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="recipe-metadata">
                                        <div className="metadata-grid">
                                            <div className="metadata-item">
                                                <span className="metadata-label">
                                                    <i className="bx bx-category"></i>
                                                    Category
                                                </span>
                                                <span className="metadata-value">{selectedRecipe.category}</span>
                                            </div>
                                            <div className="metadata-item">
                                                <span className="metadata-label">
                                                    <i className="bx bx-user"></i>
                                                    Submitted by
                                                </span>
                                                <span className="metadata-value">{selectedRecipe.createdBy?.name || 'Unknown User'}</span>
                                            </div>
                                            <div className="metadata-item">
                                                <span className="metadata-label">
                                                    <i className="bx bx-calendar"></i>
                                                    Submitted on
                                                </span>
                                                <span className="metadata-value">{new Date(selectedRecipe.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {selectedRecipe.cookingTime && (
                                                <div className="metadata-item">
                                                    <span className="metadata-label">
                                                        <i className="bx bx-time"></i>
                                                        Cooking Time
                                                    </span>
                                                    <span className="metadata-value">{selectedRecipe.cookingTime} minutes</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal__actions">
                                <button
                                    className="btn btn--success"
                                    onClick={() => handleApprove(selectedRecipe._id)}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Processing...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-check"></i>
                                            Approve Recipe
                                        </>
                                    )}
                                </button>
                                <button
                                    className="btn btn--destructive"
                                    onClick={() => handleReject(selectedRecipe._id)}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Processing...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-x"></i>
                                            Decline Recipe
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Approval Confirmation Dialog */}
                {showApprovalDialog && selectedRecipe && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--small"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal__header">
                                <h3 className="modal__title">
                                    <i className="bx bx-check-circle"></i>
                                    Approve Recipe?
                                </h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Are you sure you want to approve "<strong>{selectedRecipe.title}</strong>"? This recipe will be made public and visible to all users.</p>
                            </div>

                            <div className="modal__actions">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--success"
                                    onClick={confirmApproval}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Approving...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-check"></i>
                                            Yes, Approve
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Rejection Dialog */}
                {showRejectionDialog && selectedRecipe && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--small"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal__header">
                                <h3 className="modal__title">
                                    <i className="bx bx-x-circle"></i>
                                    Decline Recipe
                                </h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Please provide a reason for declining "<strong>{selectedRecipe.title}</strong>" (optional):</p>
                                <div className="form-group">
                                    <label className="form-label">Decline Reason</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Enter reason for declining..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="modal__actions">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--destructive"
                                    onClick={confirmRejection}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Declining...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-x"></i>
                                            Decline Recipe
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PendingRecipePage;