import { useRef, useEffect } from 'react';

const IngredientsSidebar = ({ 
    ingredientSearch, 
    setIngredientSearch, 
    filteredIngredients, 
    selectedIngredients, 
    handleIngredientClick 
}) => {
    const sidebarRef = useRef(null);

    useEffect(() => {
        // Add animation class after mount
        if (sidebarRef.current) {
            setTimeout(() => {
                sidebarRef.current.classList.add('sidebar-animate-in');
            }, 80); // slight delay for effect
        }
    }, []);

    return (
        <aside className="ingredients-sidebar" ref={sidebarRef}>
            <div className="sidebar-header">
                <span className="sidebar-title">Select <span className="highlight">Ingredients</span></span>
                <div className="sidebar-underline"></div>
            </div>
            <div className="search-container">
                <input
                    type="text"
                    className="ingredient-search"
                    placeholder="Search ingredients..."
                    value={ingredientSearch}
                    onChange={e => setIngredientSearch(e.target.value)}
                />
            </div>
            <div className="ingredient-list">
                {filteredIngredients.map((ing, idx) => (
                    <button
                        key={idx}
                        className={`ingredient-btn${selectedIngredients.includes(ing) ? " selected" : ""}`}
                        onClick={() => handleIngredientClick(ing)}
                        type="button"
                    >
                        {ing}
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default IngredientsSidebar;