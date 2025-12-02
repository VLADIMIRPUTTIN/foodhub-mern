import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EditRecipe from './EditRecipe';
import EditIngredientModal from './EditIngredientModal';
import { buildRecipeImageUrl } from '../utils/imageUrls';
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
    const [activeTab, setActiveTab] = useState('recipes');

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

    const getImageUrl = (recipe) => {
        return buildRecipeImageUrl(recipe?.imageUrl);
    };

    return (
        <div className="manage-recipes-ingredients">
            {/* Page Header */}
            <motion.div 
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="page-title">
                    <i className="bx bx-food-menu"></i>
                    Manage Content
                </h1>
                <p className="page-subtitle">Organize and manage all recipes and ingredients</p>
            </motion.div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recipes')}
                >
                    <i className="bx bx-bowl-hot"></i>
                    <span>Recipes</span>
                    <span className="badge">{filteredRecipes.length}</span>
                </button>
                <button
                    className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ingredients')}
                >
                    <i className="bx bx-leaf"></i>
                    <span>Ingredients</span>
                    <span className="badge">{filteredIngredients.length}</span>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* Recipes Tab */}
                {activeTab === 'recipes' && (
                    <motion.div
                        key="recipes"
                        className="content-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Search Bar */}
                        <div className="search-bar">
                            <div className="search-wrapper">
                                <i className="bx bx-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search recipes by title, category, or creator..."
                                    value={recipeSearch}
                                    onChange={(e) => setRecipeSearch(e.target.value)}
                                />
                                {recipeSearch && (
                                    <button className="clear-btn" onClick={clearRecipeSearch}>
                                        <i className="bx bx-x"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Recipes List */}
                        <div className="items-list">
                            {filteredRecipes.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bx bx-bowl-hot"></i>
                                    <h3>No recipes found</h3>
                                    <p>
                                        {recipeSearch
                                            ? `No recipes match "${recipeSearch}"`
                                            : 'No recipes available'}
                                    </p>
                                </div>
                            ) : (
                                filteredRecipes.map((recipe, index) => (
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
                                                    src={getImageUrl(recipe)}
                                                    alt={recipe.title || recipe.name}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                                                    }}
                                                />
                                            </div>
                                            
                                            <div className="recipe-details">
                                                <h3 className="recipe-title">{recipe.title || recipe.name}</h3>
                                                <div className="recipe-meta">
                                                    <span className="category-badge">{recipe.category}</span>
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
                                                className="btn-action btn-edit"
                                                onClick={() => setEditingRecipe(recipe)}
                                                title="Edit Recipe"
                                            >
                                                <i className="bx bx-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDeleteRecipe(recipe._id)}
                                                title="Delete Recipe"
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Ingredients Tab */}
                {activeTab === 'ingredients' && (
                    <motion.div
                        key="ingredients"
                        className="content-section"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Search Bar */}
                        <div className="search-bar">
                            <div className="search-wrapper">
                                <i className="bx bx-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search ingredients by name..."
                                    value={ingredientSearch}
                                    onChange={(e) => setIngredientSearch(e.target.value)}
                                />
                                {ingredientSearch && (
                                    <button className="clear-btn" onClick={clearIngredientSearch}>
                                        <i className="bx bx-x"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Ingredients List */}
                        <div className="items-list">
                            {filteredIngredients.length === 0 ? (
                                <div className="empty-state">
                                    <i className="bx bx-leaf"></i>
                                    <h3>No ingredients found</h3>
                                    <p>
                                        {ingredientSearch
                                            ? `No ingredients match "${ingredientSearch}"`
                                            : 'No ingredients available'}
                                    </p>
                                </div>
                            ) : (
                                filteredIngredients.map((ingredient, index) => (
                                    <motion.div
                                        key={ingredient._id}
                                        className="ingredient-item"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                    >
                                        <div className="ingredient-main">
                                            <div className="ingredient-icon">
                                                <i className="bx bx-leaf"></i>
                                            </div>
                                            <h3 className="ingredient-name">{ingredient.name}</h3>
                                        </div>

                                        <div className="ingredient-actions">
                                            <button
                                                className="btn-action btn-edit"
                                                onClick={() => openEditModal(ingredient)}
                                                title="Edit Ingredient"
                                            >
                                                <i className="bx bx-edit"></i>
                                            </button>
                                            <button
                                                className="btn-action btn-delete"
                                                onClick={() => handleDeleteIngredient(ingredient._id)}
                                                title="Delete Ingredient"
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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