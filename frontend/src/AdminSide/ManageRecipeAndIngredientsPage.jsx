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
    fetchIngredients,
    // ADD: bulk handlers from parent
    handleBulkDeleteRecipes,
    handleBulkDeleteIngredients,
}) => {
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [editingIngredient, setEditingIngredient] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('recipes');
    // ADD: selection state
    const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
    const [selectedIngredientIds, setSelectedIngredientIds] = useState([]);

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
        if (!recipe.imageUrl) return 'https://via.placeholder.com/80x80?text=No+Image';
        
        if (recipe.imageUrl.startsWith('http')) {
            return recipe.imageUrl;
        }
        
        const baseURL = import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '';
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
        return `${baseURL}/${cleanPath}`;
    };

    // ADD: selection helpers
    const toggleRecipeSelection = (id) => {
        setSelectedRecipeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };
    const toggleIngredientSelection = (id) => {
        setSelectedIngredientIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };
    const selectAllRecipes = (checked) => {
        setSelectedRecipeIds(checked ? filteredRecipes.map(r => r._id) : []);
    };
    const selectAllIngredients = (checked) => {
        setSelectedIngredientIds(checked ? filteredIngredients.map(i => i._id) : []);
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
                            {/* ADD: bulk actions for recipes */}
                            <div className="bulk-actions">
                                <label className="select-all">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredRecipes.length > 0 &&
                                            selectedRecipeIds.length === filteredRecipes.map(r => r._id).filter(Boolean).length
                                        }
                                        onChange={(e) => selectAllRecipes(e.target.checked)}
                                    />
                                    <span>Select All</span>
                                </label>
                                <button
                                    className="bulk-delete-btn"
                                    disabled={selectedRecipeIds.length === 0}
                                    onClick={async () => {
                                        await handleBulkDeleteRecipes(selectedRecipeIds);
                                        setSelectedRecipeIds([]);
                                    }}
                                    title="Delete selected recipes"
                                >
                                    <i className="bx bx-trash"></i>
                                    Delete Selected ({selectedRecipeIds.length})
                                </button>
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
                                            {/* ADD: item checkbox */}
                                            <input
                                                type="checkbox"
                                                className="item-checkbox"
                                                checked={selectedRecipeIds.includes(recipe._id)}
                                                onChange={() => toggleRecipeSelection(recipe._id)}
                                                aria-label={`Select ${recipe.title || recipe.name}`}
                                            />
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
                            {/* ADD: bulk actions for ingredients */}
                            <div className="bulk-actions">
                                <label className="select-all">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredIngredients.length > 0 &&
                                            selectedIngredientIds.length === filteredIngredients.map(i => i._id).filter(Boolean).length
                                        }
                                        onChange={(e) => selectAllIngredients(e.target.checked)}
                                    />
                                    <span>Select All</span>
                                </label>
                                <button
                                    className="bulk-delete-btn"
                                    disabled={selectedIngredientIds.length === 0}
                                    onClick={async () => {
                                        await handleBulkDeleteIngredients(selectedIngredientIds);
                                        setSelectedIngredientIds([]);
                                    }}
                                    title="Delete selected ingredients"
                                >
                                    <i className="bx bx-trash"></i>
                                    Delete Selected ({selectedIngredientIds.length})
                                </button>
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
                                            {/* ADD: item checkbox */}
                                            <input
                                                type="checkbox"
                                                className="item-checkbox"
                                                checked={selectedIngredientIds.includes(ingredient._id)}
                                                onChange={() => toggleIngredientSelection(ingredient._id)}
                                                aria-label={`Select ${ingredient.name}`}
                                            />
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