import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './PendingRecipePage.scss';

const baseURL = import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "";

const PendingRecipePage = () => {
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

    useEffect(() => {
        fetchPendingRecipes();
    }, []);

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

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            console.error('Error moderating recipe:', error);
            setError('Failed to moderate recipe. Please try again.');
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
            <div className="page-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1 className="page-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            Pending Recipe Reviews
                        </h1>
                        <p className="page-subtitle">
                            Review and moderate user-submitted recipes before they go public
                        </p>
                    </div>
                    <div className="stats-badge">
                        <span className="count">{pendingRecipes.length}</span>
                        <span className="label">pending reviews</span>
                    </div>
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
                        <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                        <button onClick={() => setError('')} className="alert__close">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
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
                        <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                        <button onClick={() => setSuccess('')} className="alert__close">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {pendingRecipes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__content">
                        <svg className="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 className="empty-state__title">All caught up!</h3>
                        <p className="empty-state__description">
                            No recipes pending review at the moment. Great job keeping up with submissions!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="pending-recipes-grid">
                    {pendingRecipes.map((recipe, index) => (
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
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        View Details
                                    </button>
                                </div>
                            </div>
                            
                            <div className="recipe-card__content">
                                <h3 className="recipe-card__title">{recipe.title}</h3>
                                <p className="recipe-card__description">{recipe.description}</p>
                                
                                <div className="recipe-card__meta">
                                    <span className="meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M4 6h16M4 12h16M4 18h7"></path>
                                        </svg>
                                        {recipe.category}
                                    </span>
                                    <span className="meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        {recipe.createdBy?.name || 'Unknown User'}
                                    </span>
                                    <span className="meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        {new Date(recipe.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="recipe-card__actions">
                                    <button
                                        className="btn btn--success btn--sm"
                                        onClick={() => handleApprove(recipe._id)}
                                        disabled={actionLoading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <polyline points="20,6 9,17 4,12"></polyline>
                                        </svg>
                                        Approve
                                    </button>
                                    <button
                                        className="btn btn--destructive btn--sm"
                                        onClick={() => handleReject(recipe._id)}
                                        disabled={actionLoading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        Reject
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
                                <h3 className="modal__title">{selectedRecipe.title}</h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
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
                                        <h4 className="detail-section__title">Description</h4>
                                        <p className="detail-section__text">{selectedRecipe.description}</p>
                                    </div>

                                    <div className="detail-section">
                                        <h4 className="detail-section__title">Ingredients</h4>
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
                                        <h4 className="detail-section__title">Instructions</h4>
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
                                                <span className="metadata-label">Category</span>
                                                <span className="metadata-value">{selectedRecipe.category}</span>
                                            </div>
                                            <div className="metadata-item">
                                                <span className="metadata-label">Submitted by</span>
                                                <span className="metadata-value">{selectedRecipe.createdBy?.name || 'Unknown User'}</span>
                                            </div>
                                            <div className="metadata-item">
                                                <span className="metadata-label">Submitted on</span>
                                                <span className="metadata-value">{new Date(selectedRecipe.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {selectedRecipe.cookingTime && (
                                                <div className="metadata-item">
                                                    <span className="metadata-label">Cooking Time</span>
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
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="20,6 9,17 4,12"></polyline>
                                            </svg>
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
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            Reject Recipe
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
                                <h3 className="modal__title">Approve Recipe?</h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
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
                                        "Yes, Approve"
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
                                <h3 className="modal__title">Reject Recipe</h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Please provide a reason for rejecting "<strong>{selectedRecipe.title}</strong>" (optional):</p>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Enter reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={4}
                                />
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
                                            Rejecting...
                                        </span>
                                    ) : (
                                        "Reject Recipe"
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