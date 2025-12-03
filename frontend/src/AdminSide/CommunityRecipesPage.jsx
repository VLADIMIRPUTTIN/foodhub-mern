import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buildRecipeImageUrl } from '../utils/imageUrls';
import api from '../utils/apiClient';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/ui/toast';
import './CommunityRecipesPage.scss';

const CommunityRecipesPage = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, recipeId: null, recipeName: '', loading: false });
    
    const { toast } = useToast();

    useEffect(() => {
        fetchCommunityRecipes();
    }, []);

    const fetchCommunityRecipes = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/api/recipes/admin/all');
            setRecipes(data.recipes.filter(recipe => recipe.shareStatus !== 'not_shared'));
        } catch (error) {
            console.error('Error fetching community recipes:', error);
            toast.error('Failed to load recipes', 'Please try again later');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (recipe, e) => {
        e?.stopPropagation();
        setDeleteDialog({ open: true, recipeId: recipe._id, recipeName: recipe.title, loading: false });
    };

    const handleConfirmDelete = async () => {
        setDeleteDialog(prev => ({ ...prev, loading: true }));
        try {
            await api.delete(`/api/recipes/${deleteDialog.recipeId}`);
            setRecipes(recipes.filter(r => r._id !== deleteDialog.recipeId));
            setShowDetailsModal(false);
            setDeleteDialog({ open: false, recipeId: null, recipeName: '', loading: false });
            toast.success('Recipe Deleted', 'Community recipe has been removed successfully');
        } catch (error) {
            console.error('Error deleting recipe:', error);
            setDeleteDialog(prev => ({ ...prev, loading: false }));
            toast.error('Delete Failed', error.response?.data?.message || 'Failed to delete recipe');
        }
    };

    const handleModerateRecipe = async (recipeId, action, rejectionReason = '') => {
        try {
            await api.patch(`/api/recipes/${recipeId}/moderate`, { action, rejectionReason });
            fetchCommunityRecipes();
            setShowDetailsModal(false);
            toast.success(
                action === 'approve' ? 'Recipe Approved' : 'Recipe Rejected',
                `Recipe has been ${action === 'approve' ? 'approved' : 'rejected'} successfully`
            );
        } catch (error) {
            console.error('Error moderating recipe:', error);
            toast.error('Moderation Failed', 'Failed to update recipe status');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            approved: { color: '#10b981', text: 'Approved', icon: 'bx-check-circle' },
            pending: { color: '#f59e0b', text: 'Pending', icon: 'bx-time' },
            rejected: { color: '#ef4444', text: 'Rejected', icon: 'bx-x-circle' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className="status-badge" style={{ background: badge.color }}>
                <i className={`bx ${badge.icon}`}></i>
                {badge.text}
            </span>
        );
    };

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            recipe.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || recipe.shareStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filterButtons = [
        { value: 'all', icon: 'bx-list-ul', label: 'All' },
        { value: 'approved', icon: 'bx-check-circle', label: 'Approved' },
        { value: 'pending', icon: 'bx-time', label: 'Pending' },
        { value: 'rejected', icon: 'bx-x-circle', label: 'Rejected' }
    ];

    return (
        <div className="community-recipes-page">
            <div className="search-filter-section">
                <div className="search-bar">
                    <div className="search-wrapper">
                        <i className="bx bx-search"></i>
                        <input
                            type="text"
                            placeholder="Search by recipe title or creator..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="clear-btn" onClick={() => setSearchTerm('')}>
                                <i className="bx bx-x"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="status-filters">
                    {filterButtons.map(filter => (
                        <button
                            key={filter.value}
                            className={`filter-btn ${statusFilter === filter.value ? 'active' : ''}`}
                            onClick={() => setStatusFilter(filter.value)}
                        >
                            <i className={`bx ${filter.icon}`}></i>
                            <span>{filter.label}</span>
                            <span className={`count ${filter.value}`}>
                                {filter.value === 'all' ? recipes.length : recipes.filter(r => r.shareStatus === filter.value).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="content-section">
                {loading ? (
                    <div className="loading-state">
                        <i className="bx bx-loader-alt bx-spin"></i>
                        <p>Loading community recipes...</p>
                    </div>
                ) : filteredRecipes.length === 0 ? (
                    <div className="empty-state">
                        <i className="bx bx-bowl-hot"></i>
                        <h3>No recipes found</h3>
                        <p>
                            {searchTerm ? `No recipes match "${searchTerm}"` :
                             statusFilter !== 'all' ? `No ${statusFilter} recipes` :
                             'No community recipes available'}
                        </p>
                    </div>
                ) : (
                    <div className="items-list">
                        {filteredRecipes.map((recipe, index) => (
                            <motion.div
                                key={recipe._id}
                                className="recipe-item"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <div className="recipe-main">
                                    <div className="recipe-image-small">
                                        <img
                                            src={buildRecipeImageUrl(recipe?.imageUrl)}
                                            alt={recipe.title}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'}
                                        />
                                    </div>
                                    
                                    <div className="recipe-details">
                                        <h3 className="recipe-title">{recipe.title}</h3>
                                        <div className="recipe-meta">
                                            <span className="category-badge">
                                                <i className="bx bx-category"></i>
                                                {recipe.category}
                                            </span>
                                            {getStatusBadge(recipe.shareStatus)}
                                            <span className="meta-item">
                                                <i className="bx bx-user"></i>
                                                {recipe.createdBy?.name || 'Unknown'}
                                            </span>
                                            {recipe.cookingTime && (
                                                <span className="meta-item">
                                                    <i className="bx bx-time"></i>
                                                    {recipe.cookingTime} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="recipe-actions">
                                    <button
                                        className="btn-action btn-view"
                                        onClick={() => { setSelectedRecipe(recipe); setShowDetailsModal(true); }}
                                        title="View Details"
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                    <button
                                        className="btn-action btn-delete"
                                        onClick={(e) => handleDeleteClick(recipe, e)}
                                        title="Delete Recipe"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showDetailsModal && selectedRecipe && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDetailsModal(false)}
                    >
                        <motion.div
                            className="modal-content recipe-details-modal"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>{selectedRecipe.title}</h2>
                                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>

                            <div className="modal-body">
                                <img
                                    src={buildRecipeImageUrl(selectedRecipe?.imageUrl)}
                                    alt={selectedRecipe.title}
                                    className="recipe-image-large"
                                />

                                <div className="recipe-info">
                                    <div className="info-row">
                                        <span className="label">Status:</span>
                                        {getStatusBadge(selectedRecipe.shareStatus)}
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Creator:</span>
                                        <span>{selectedRecipe.createdBy?.name || 'Unknown'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Category:</span>
                                        <span>{selectedRecipe.category}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Description:</span>
                                        <p>{selectedRecipe.description}</p>
                                    </div>

                                    {selectedRecipe.shareStatus === 'rejected' && selectedRecipe.rejectionReason && (
                                        <div className="rejection-reason">
                                            <i className="bx bx-info-circle"></i>
                                            <div>
                                                <strong>Rejection Reason:</strong>
                                                <p>{selectedRecipe.rejectionReason}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {selectedRecipe.shareStatus === 'pending' && (
                                    <div className="moderation-actions">
                                        <button
                                            className="btn-approve"
                                            onClick={() => handleModerateRecipe(selectedRecipe._id, 'approve')}
                                        >
                                            <i className="bx bx-check"></i>
                                            Approve Recipe
                                        </button>
                                        <button
                                            className="btn-reject"
                                            onClick={() => {
                                                const reason = prompt('Enter rejection reason:');
                                                if (reason) handleModerateRecipe(selectedRecipe._id, 'reject', reason);
                                            }}
                                        >
                                            <i className="bx bx-x"></i>
                                            Reject Recipe
                                        </button>
                                    </div>
                                )}

                                <div className="modal-delete-action">
                                    <button
                                        className="btn-delete-modal"
                                        onClick={(e) => handleDeleteClick(selectedRecipe, e)}
                                    >
                                        <i className="bx bx-trash"></i>
                                        Delete Recipe
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmDialog
                open={deleteDialog.open}
                title="Delete Community Recipe?"
                description={`Are you sure you want to delete "${deleteDialog.recipeName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteDialog({ open: false, recipeId: null, recipeName: '', loading: false })}
                loading={deleteDialog.loading}
            />
        </div>
    );
};

export default CommunityRecipesPage;