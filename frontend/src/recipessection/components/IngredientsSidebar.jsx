import { useEffect, useState } from 'react';
import './IngredientsSidebar.scss';

const IngredientsSidebar = ({ 
    ingredientSearch, 
    setIngredientSearch, 
    filteredIngredients, 
    selectedIngredients, 
    handleIngredientClick 
}) => {
    const [isAnimatedIn, setIsAnimatedIn] = useState(false);

    useEffect(() => {
        const timerId = window.setTimeout(() => {
            setIsAnimatedIn(true);
        }, 80);

        return () => {
            window.clearTimeout(timerId);
        };
    }, []);

    return (
        <aside className={`ingredients-sidebar${isAnimatedIn ? ' sidebar-animate-in' : ''}`}>
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
                {filteredIngredients.length > 0 ? (
                    filteredIngredients.map((ing, idx) => (
                        <button
                            key={idx}
                            className={`ingredient-btn${selectedIngredients.includes(ing) ? " selected" : ""}`}
                            onClick={() => handleIngredientClick(ing)}
                            type="button"
                        >
                            {ing}
                        </button>
                    ))
                ) : (
                    <div className="no-ingredients">
                        <i className="bx bx-search-alt"></i>
                        <p>No ingredients found. Try another search.</p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default IngredientsSidebar;