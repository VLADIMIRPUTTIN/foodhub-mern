const NoRecipesFound = ({ selectedIngredients }) => {
    return (
        <div className="no-recipes-enhanced">
            <div className="no-recipes-animation">
                <div className="chef-hat">
                    <i className="bx bx-restaurant"></i>
                </div>
            </div>
            
            <div className="no-recipes-content">
                <h3 className="no-recipes-title">No Delicious Recipes Found</h3>
                <p className="no-recipes-subtitle">
                    {selectedIngredients.length > 0 
                        ? "Try adjusting your ingredient selection or search filters"
                        : "Looks like our kitchen is empty right now"
                    }
                </p>
            </div>
        </div>
    );
};

export default NoRecipesFound;