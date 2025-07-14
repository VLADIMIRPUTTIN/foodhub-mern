import { useState } from 'react';
import EditRecipe from './EditRecipe';

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
    fetchRecipes
}) => {
    const [editingRecipe, setEditingRecipe] = useState(null);

    return (
        <div className="manage-recipes-ingredients">
            <div className="manage-column recipes-column">
                <h2>All Recipes</h2>
                <input
                    type="text"
                    className="admin-search"
                    placeholder="Search recipes..."
                    value={recipeSearch}
                    onChange={e => setRecipeSearch(e.target.value)}
                />
                <div className="admin-list">
                    {filteredRecipes.length === 0 && <div className="empty-msg">No recipes found.</div>}
                    {filteredRecipes.map(recipe => (
                        <div key={recipe._id} className="admin-list-item">
                            <div>
                                <strong>{recipe.title || recipe.name}</strong>
                                <div className="admin-list-meta">{recipe.category}</div>
                                <div className="admin-list-meta">
                                    Created by: {recipe.createdBy?.name || 'Unknown'}
                                </div>
                            </div>
                            <div className="admin-list-actions">
                                <button className="edit-btn" onClick={() => setEditingRecipe(recipe)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDeleteRecipe(recipe._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                {editingRecipe && (
                    <EditRecipe
                        recipe={editingRecipe}
                        onRecipeUpdated={() => {
                            setEditingRecipe(null);
                            fetchRecipes();
                        }}
                        onCancel={() => setEditingRecipe(null)}
                    />
                )}
            </div>
            <div className="manage-column ingredients-column">
                <h2>All Ingredients</h2>
                <input
                    type="text"
                    className="admin-search"
                    placeholder="Search ingredients..."
                    value={ingredientSearch}
                    onChange={e => setIngredientSearch(e.target.value)}
                />
                <div className="admin-list">
                    {filteredIngredients.length === 0 && <div className="empty-msg">No ingredients found.</div>}
                    {filteredIngredients.map(ingredient => (
                        <div key={ingredient._id} className="admin-list-item">
                            <div>
                                <strong>{ingredient.name}</strong>
                            </div>
                            <div className="admin-list-actions">
                                <button className="edit-btn" onClick={() => handleEditIngredient(ingredient)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDeleteIngredient(ingredient._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageRecipeAndIngredientsPage;