import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import './PendingRecipePage.scss';

const baseURL = import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "";

const PendingRecipePage = () => {
    const [pendingRecipes, setPendingRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
            Swal.fire('Error', 'Failed to fetch pending recipes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewRecipe = (recipe) => {
        setSelectedRecipe(recipe);
        setShowModal(true);
    };

    const handleModerateRecipe = async (recipeId, action, rejectionReason = '') => {
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
                // Remove the recipe from pending list
                setPendingRecipes(prev => prev.filter(recipe => recipe._id !== recipeId));
                
                const actionText = action === 'approve' ? 'approved' : 'rejected';
                Swal.fire('Success', `Recipe ${actionText} successfully!`, 'success');
                
                if (showModal) {
                    setShowModal(false);
                    setSelectedRecipe(null);
                }
            }
        } catch (error) {
            console.error('Error moderating recipe:', error);
            Swal.fire('Error', 'Failed to moderate recipe', 'error');
        }
    };

    const handleApprove = (recipeId) => {
        Swal.fire({
            title: 'Approve Recipe?',
            text: 'This recipe will be shared publicly.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4caf50',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, approve it!'
        }).then((result) => {
            if (result.isConfirmed) {
                handleModerateRecipe(recipeId, 'approve');
            }
        });
    };

    const handleReject = (recipeId) => {
        Swal.fire({
            title: 'Reject Recipe',
            input: 'textarea',
            inputLabel: 'Rejection Reason (optional)',
            inputPlaceholder: 'Enter reason for rejection...',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Reject Recipe'
        }).then((result) => {
            if (result.isConfirmed) {
                handleModerateRecipe(recipeId, 'reject', result.value || 'No reason provided');
            }
        });
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

    if (loading) {
        return (
            <div className="pending-recipes-page">
                <div className="loading-spinner">
                    <i className="bx bx-loader-alt bx-spin"></i>
                    <p>Loading pending recipes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pending-recipes-page">
            <div className="page-header">
                <h2>
                    <i className="bx bx-time-five"></i>
                    Pending Recipe Reviews
                </h2>
                <p className="page-subtitle">
                    Review and moderate user-submitted recipes before they go public
                </p>
                <div className="stats-badge">
                    <span className="count">{pendingRecipes.length}</span>
                    <span className="label">pending reviews</span>
                </div>
            </div>

            {pendingRecipes.length === 0 ? (
                <div className="no-pending-recipes">
                    <div className="empty-state">
                        <i className="bx bx-check-circle"></i>
                        <h3>All caught up!</h3>
                        <p>No recipes pending review at the moment.</p>
                    </div>
                </div>
            ) : (
                <div className="pending-recipes-grid">
                    {pendingRecipes.map((recipe, index) => (
                        <motion.div
                            key={recipe._id}
                            className="pending-recipe-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="recipe-image">
                                <img
                                    src={getImageUrl(recipe)}
                                    alt={recipe.title}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                    }}
                                />
                                <div className="recipe-overlay">
                                    <button
                                        className="view-details-btn"
                                        onClick={() => handleViewRecipe(recipe)}
                                    >
                                        <i className="bx bx-show"></i>
                                        View Details
                                    </button>
                                </div>
                            </div>
                            
                            <div className="recipe-content">
                                <h3 className="recipe-title">{recipe.title}</h3>
                                <p className="recipe-description">{recipe.description}</p>
                                
                                <div className="recipe-meta">
                                    <span className="category">
                                        <i className="bx bx-category"></i>
                                        {recipe.category}
                                    </span>
                                    <span className="submitted-by">
                                        <i className="bx bx-user"></i>
                                        {recipe.createdBy?.name || 'Unknown User'}
                                    </span>
                                    <span className="submit-date">
                                        <i className="bx bx-calendar"></i>
                                        {new Date(recipe.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="action-buttons">
                                    <button
                                        className="approve-btn"
                                        onClick={() => handleApprove(recipe._id)}
                                    >
                                        <i className="bx bx-check"></i>
                                        Approve
                                    </button>
                                    <button
                                        className="reject-btn"
                                        onClick={() => handleReject(recipe._id)}
                                    >
                                        <i className="bx bx-x"></i>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Recipe Details Modal */}
            {showModal && selectedRecipe && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedRecipe.title}</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowModal(false)}
                            >
                                <i className="bx bx-x"></i>
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="recipe-image-large">
                                <img
                                    src={getImageUrl(selectedRecipe)}
                                    alt={selectedRecipe.title}
                                    onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                    }}
                                />
                            </div>
                            
                            <div className="recipe-details">
                                <div className="detail-section">
                                    <h4>Description</h4>
                                    <p>{selectedRecipe.description}</p>
                                </div>

                                <div className="detail-section">
                                    <h4>Ingredients</h4>
                                    <ul className="ingredients-list">
                                        {selectedRecipe.ingredients.map((ingredient, index) => (
                                            <li key={index}>
                                                <span className="amount">{ingredient.amount} {ingredient.unit}</span>
                                                <span className="name">{ingredient.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="detail-section">
                                    <h4>Instructions</h4>
                                    <ol className="instructions-list">
                                        {selectedRecipe.instructions.map((instruction, index) => (
                                            <li key={index}>{instruction}</li>
                                        ))}
                                    </ol>
                                </div>

                                <div className="recipe-metadata">
                                    <div className="meta-item">
                                        <strong>Category:</strong> {selectedRecipe.category}
                                    </div>
                                    <div className="meta-item">
                                        <strong>Submitted by:</strong> {selectedRecipe.createdBy?.name || 'Unknown User'}
                                    </div>
                                    <div className="meta-item">
                                        <strong>Submitted on:</strong> {new Date(selectedRecipe.createdAt).toLocaleDateString()}
                                    </div>
                                    {selectedRecipe.cookingTime && (
                                        <div className="meta-item">
                                            <strong>Cooking Time:</strong> {selectedRecipe.cookingTime} minutes
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="approve-btn-large"
                                onClick={() => handleApprove(selectedRecipe._id)}
                            >
                                <i className="bx bx-check"></i>
                                Approve Recipe
                            </button>
                            <button
                                className="reject-btn-large"
                                onClick={() => handleReject(selectedRecipe._id)}
                            >
                                <i className="bx bx-x"></i>
                                Reject Recipe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingRecipePage;