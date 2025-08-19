import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditRecipe from './EditRecipe';
import EditIngredientModal from './EditIngredientModal';
import ConfirmDialog from '../components/ConfirmDialog';
import './ManageRecipeAndIngredientsPage.scss';

const ManageRecipeAndIngredientsPage = ({
    recipeSearch,
    ingredientSearch,
    setRecipeSearch,
    setIngredientSearch,
    filteredRecipes,
    filteredIngredients,
    handleDeleteRecipe,
    handleEditIngredient,
    handleDeleteIngredient,
    fetchRecipes,
    fetchIngredients
}) => {
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('recipes'); // For mobile view
    
    // Delete confirmation states for recipes
    const [deleteRecipeConfirmOpen, setDeleteRecipeConfirmOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState(null);
    const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);

    // Delete confirmation states for ingredients
    const [deleteIngredientConfirmOpen, setDeleteIngredientConfirmOpen] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState(null);
    const [isDeletingIngredient, setIsDeletingIngredient] = useState(false);

    const handleIngredientUpdated = (updatedIngredient) => {
        setEditingIngredient(null);
        setIsEditModalOpen(false);
        fetchIngredients();
    };

    const openEditModal = (ingredient) => {
        setEditingIngredient(ingredient);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditingIngredient(null);
        setIsEditModalOpen(false);
    };

    const clearRecipeSearch = () => {
        setRecipeSearch('');
    };

    const clearIngredientSearch = () => {
        setIngredientSearch('');
    };

    // Handle delete recipe click
    const handleDeleteRecipeClick = (recipe) => {
        setRecipeToDelete(recipe);
        setDeleteRecipeConfirmOpen(true);
    };

    // Confirm delete recipe
    const confirmDeleteRecipe = async () => {
        if (!recipeToDelete) return;
        
        setIsDeletingRecipe(true);
        try {
            await handleDeleteRecipe(recipeToDelete._id);
            setDeleteRecipeConfirmOpen(false);
            setRecipeToDelete(null);
        } catch (error) {
            console.error('Error deleting recipe:', error);
        } finally {
            setIsDeletingRecipe(false);
        }
    };

    // Cancel delete recipe
    const cancelDeleteRecipe = () => {
        setDeleteRecipeConfirmOpen(false);
        setRecipeToDelete(null);
    };

    // Handle delete ingredient click
    const handleDeleteIngredientClick = (ingredient) => {
        setIngredientToDelete(ingredient);
        setDeleteIngredientConfirmOpen(true);
    };

    // Confirm delete ingredient
    const confirmDeleteIngredient = async () => {
        if (!ingredientToDelete) return;
        
        setIsDeletingIngredient(true);
        try {
            await handleDeleteIngredient(ingredientToDelete._id);
            setDeleteIngredientConfirmOpen(false);
            setIngredientToDelete(null);
        } catch (error) {
            console.error('Error deleting ingredient:', error);
        } finally {
            setIsDeletingIngredient(false);
        }
    };

    // Cancel delete ingredient
    const cancelDeleteIngredient = () => {
        setDeleteIngredientConfirmOpen(false);
        setIngredientToDelete(null);
    };

    return (
        <div className="manage-recipes-ingredients">
            {/* Page Header */}
            <div className="page-header">
                
            </div>

            {/* Mobile Tab Navigation */}
            <div className="mobile-tabs">
                <button 
                    className={`tab-button ${activeTab === 'recipes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recipes')}
                >
                    <i className="bx bx-bowl-hot"></i>
                    Recipes ({filteredRecipes.length})
                </button>
                <button 
                    className={`tab-button ${activeTab === 'ingredients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ingredients')}
                >
                    <i className="bx bx-leaf"></i>
                    Ingredients ({filteredIngredients.length})
                </button>
            </div>

            {/* Content Grid */}
            <div className="content-grid">
                {/* Recipes Column */}
                <div className={`manage-column recipes-column ${activeTab === 'recipes' ? 'active' : ''}`}>
                    <div className="column-header">
                        <h2 className="column-title">
                            <i className="bx bx-bowl-hot"></i>
                            All Recipes
                            <span className="count">({filteredRecipes.length})</span>
                        </h2>
                        
                        <div className="search-container">
                            <div className="search-wrapper">
                                <i className="bx bx-search search-icon"></i>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search recipes by title, category, creator..."
                                    value={recipeSearch}
                                    onChange={e => setRecipeSearch(e.target.value)}
                                />
                                {recipeSearch && (
                                    <button 
                                        className="clear-search"
                                        onClick={clearRecipeSearch}
                                        title="Clear search"
                                    >
                                        <i className="bx bx-x"></i>
                                    </button>
                                )}
                            </div>
                            {recipeSearch && (
                                <div className="search-results">
                                    Found {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="column-content">
                        <div className="items-list">
                            {filteredRecipes.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bx bx-bowl-hot empty-icon"></i>
                                    <h3>No recipes found</h3>
                                    <p>
                                        {recipeSearch 
                                            ? `No recipes match your search for "${recipeSearch}"`
                                            : "No recipes available in the system"
                                        }
                                    </p>
                                    {recipeSearch && (
                                        <button 
                                            className="btn btn--primary"
                                            onClick={clearRecipeSearch}
                                        >
                                            <i className="bx bx-refresh"></i>
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredRecipes.map((recipe, index) => (
                                    <div
                                        key={recipe._id}
                                        className="list-item recipe-item"
                                        style={{
                                            opacity: 1,
                                            transform: 'translateY(0)',
                                        }}
                                    >
                                        <div className="item-content">
                                            <div className="item-header">
                                                <h4 className="item-title">
                                                    {recipe.title || recipe.name}
                                                </h4>
                                                <span className="item-category">
                                                    <i className="bx bx-category"></i>
                                                    {recipe.category}
                                                </span>
                                            </div>
                                            <div className="item-meta">
                                                <span className="creator">
                                                    <i className="bx bx-user"></i>
                                                    Created by: {recipe.createdBy?.name || 'Unknown'}
                                                </span>
                                                {recipe.createdAt && (
                                                    <span className="date">
                                                        <i className="bx bx-calendar"></i>
                                                        {new Date(recipe.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="item-actions">
                                            <button 
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => setEditingRecipe(recipe)}
                                                title="Edit Recipe"
                                            >
                                                <i className="bx bx-edit"></i>
                                                <span>Edit</span>
                                            </button>
                                            <button 
                                                className="btn btn--destructive btn--sm"
                                                onClick={() => handleDeleteRecipeClick(recipe)}
                                                title="Delete Recipe"
                                            >
                                                <i className="bx bx-trash"></i>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Ingredients Column */}
                <div className={`manage-column ingredients-column ${activeTab === 'ingredients' ? 'active' : ''}`}>
                    <div className="column-header">
                        <h2 className="column-title">
                            <i className="bx bx-leaf"></i>
                            All Ingredients
                            <span className="count">({filteredIngredients.length})</span>
                        </h2>
                        
                        <div className="search-container">
                            <div className="search-wrapper">
                                <i className="bx bx-search search-icon"></i>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search ingredients by name..."
                                    value={ingredientSearch}
                                    onChange={e => setIngredientSearch(e.target.value)}
                                />
                                {ingredientSearch && (
                                    <button 
                                        className="clear-search"
                                        onClick={clearIngredientSearch}
                                        title="Clear search"
                                    >
                                        <i className="bx bx-x"></i>
                                    </button>
                                )}
                            </div>
                            {ingredientSearch && (
                                <div className="search-results">
                                    Found {filteredIngredients.length} ingredient{filteredIngredients.length !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="column-content">
                        <div className="items-list">
                            {filteredIngredients.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bx bx-leaf empty-icon"></i>
                                    <h3>No ingredients found</h3>
                                    <p>
                                        {ingredientSearch 
                                            ? `No ingredients match your search for "${ingredientSearch}"`
                                            : "No ingredients available in the system"
                                        }
                                    </p>
                                    {ingredientSearch && (
                                        <button 
                                            className="btn btn--primary"
                                            onClick={clearIngredientSearch}
                                        >
                                            <i className="bx bx-refresh"></i>
                                            Clear Search
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredIngredients.map((ingredient, index) => (
                                    <div
                                        key={ingredient._id}
                                        className="list-item ingredient-item"
                                        style={{
                                            opacity: 1,
                                            transform: 'translateY(0)',
                                        }}
                                    >
                                        <div className="item-content">
                                            <div className="item-header">
                                                <h4 className="item-title">
                                                    <i className="bx bx-leaf"></i>
                                                    {ingredient.name}
                                                </h4>
                                            </div>
                                            {ingredient.description && (
                                                <div className="item-description">
                                                    {ingredient.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-actions">
                                            <button 
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => openEditModal(ingredient)}
                                                title="Edit Ingredient"
                                            >
                                                <i className="bx bx-edit"></i>
                                                <span>Edit</span>
                                            </button>
                                            <button 
                                                className="btn btn--destructive btn--sm"
                                                onClick={() => handleDeleteIngredientClick(ingredient)}
                                                title="Delete Ingredient"
                                            >
                                                <i className="bx bx-trash"></i>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Recipe Modal */}
            {editingRecipe && (
                <div
                    className="modal-overlay"
                    onClick={() => setEditingRecipe(null)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <EditRecipe
                            recipe={editingRecipe}
                            onRecipeUpdated={() => {
                                setEditingRecipe(null);
                                fetchRecipes();
                            }}
                            onCancel={() => setEditingRecipe(null)}
                        />
                    </div>
                </div>
            )}
            
            {/* Edit Ingredient Modal */}
            <EditIngredientModal
                ingredient={editingIngredient}
                onUpdated={handleIngredientUpdated}
                onCancel={closeEditModal}
                isOpen={isEditModalOpen}
            />

            {/* Delete Recipe Confirmation Dialog */}
            <ConfirmDialog
                open={deleteRecipeConfirmOpen}
                title="Delete Recipe"
                description={
                    recipeToDelete
                        ? `Are you sure you want to delete "${recipeToDelete.title || recipeToDelete.name}"? This action cannot be undone.`
                        : ""
                }
                confirmText="Delete Recipe"
                cancelText="Cancel"
                onConfirm={confirmDeleteRecipe}
                onCancel={cancelDeleteRecipe}
                loading={isDeletingRecipe}
            />

            {/* Delete Ingredient Confirmation Dialog */}
            <ConfirmDialog
                open={deleteIngredientConfirmOpen}
                title="Delete Ingredient"
                description={
                    ingredientToDelete
                        ? `Are you sure you want to delete "${ingredientToDelete.name}"? This action cannot be undone and may affect recipes that use this ingredient.`
                        : ""
                }
                confirmText="Delete Ingredient"
                cancelText="Cancel"
                onConfirm={confirmDeleteIngredient}
                onCancel={cancelDeleteIngredient}
                loading={isDeletingIngredient}
            />
        </div>
    );
};

export default ManageRecipeAndIngredientsPage;