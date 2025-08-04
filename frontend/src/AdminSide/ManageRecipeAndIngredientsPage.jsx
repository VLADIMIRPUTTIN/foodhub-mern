import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditRecipe from './EditRecipe';
import EditIngredientModal from './EditIngredientModal';
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

    return (
        <div className="manage-recipes-ingredients">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1 className="page-title">
                        <i className="bx bx-food-menu"></i>
                        Recipe & Ingredient Management
                    </h1>
                    <p className="page-subtitle">Manage recipes and ingredients in your system</p>
                </div>
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
                                    <motion.div
                                        key={recipe._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="list-item recipe-item"
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
                                                onClick={() => handleDeleteRecipe(recipe._id)}
                                                title="Delete Recipe"
                                            >
                                                <i className="bx bx-trash"></i>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
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
                                    <motion.div
                                        key={ingredient._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="list-item ingredient-item"
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
                                                onClick={() => handleDeleteIngredient(ingredient._id)}
                                                title="Delete Ingredient"
                                            >
                                                <i className="bx bx-trash"></i>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Recipe Modal */}
            <AnimatePresence>
                {editingRecipe && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditingRecipe(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
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
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Edit Ingredient Modal */}
            <EditIngredientModal
                ingredient={editingIngredient}
                onUpdated={handleIngredientUpdated}
                onCancel={closeEditModal}
                isOpen={isEditModalOpen}
            />
        </div>
    );
};

export default ManageRecipeAndIngredientsPage;