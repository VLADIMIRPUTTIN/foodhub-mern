/**
 * Helper function to check if a recipe ingredient matches a selected ingredient
 */
export const ingredientMatches = (recipeIngredient, selectedIngredient) => {
    // Normalize selected ingredient
    const selectedLower = selectedIngredient.toLowerCase().trim();
    
    // Handle pluralization
    const singularSelected = selectedLower.endsWith('s') ? selectedLower.slice(0, -1) : selectedLower;
    const pluralSelected = selectedLower.endsWith('s') ? selectedLower : selectedLower + 's';
    
    // Recipe ingredient might be an object or string
    if (typeof recipeIngredient === 'string') {
        const ingredientLower = recipeIngredient.toLowerCase().trim();
        return ingredientLower === selectedLower || 
               ingredientLower === singularSelected || 
               ingredientLower === pluralSelected;
    }
    
    // If it's an object with name property
    if (recipeIngredient && recipeIngredient.name) {
        const ingredientLower = recipeIngredient.name.toLowerCase().trim();
        return ingredientLower === selectedLower || 
               ingredientLower === singularSelected || 
               ingredientLower === pluralSelected;
    }
    
    return false;
}

/**
 * Helper function to construct proper image URL for recipes
 */
export const getImageUrl = (recipe) => {
    if (!recipe.imageUrl) {
        // Return a default placeholder image if no image URL
        return 'https://via.placeholder.com/300x200?text=No+Image';
    }
    // If imageUrl is already a full URL (starts with http), use it as is
    if (recipe.imageUrl.startsWith('http')) {
        return recipe.imageUrl;
    }

    // If imageUrl is a relative path, construct the full URL
    const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
    const baseURL = import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : "";
    return `${baseURL}/${cleanPath}`;
};