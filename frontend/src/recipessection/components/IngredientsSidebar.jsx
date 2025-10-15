import { useRef, useEffect } from 'react';
import './IngredientsSidebar.scss';

const IngredientsSidebar = ({ 
    ingredientSearch, 
    setIngredientSearch, 
    filteredIngredients, 
    selectedIngredients, 
    handleIngredientClick 
}) => {
    const sidebarRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        // Add animation class after mount
        if (sidebarRef.current) {
            setTimeout(() => {
                sidebarRef.current.classList.add('sidebar-animate-in');
            }, 80); // slight delay for effect
        }

        // Add search icon programmatically
        if (searchRef.current) {
            const addSearchIcon = () => {
                const searchInput = searchRef.current;
                if (!searchInput.parentNode.querySelector('.search-icon')) {
                    const searchIcon = document.createElement('i');
                    searchIcon.className = 'bx bx-search search-icon';
                    searchIcon.style.position = 'absolute';
                    searchIcon.style.left = '14px';
                    searchIcon.style.top = '50%';
                    searchIcon.style.transform = 'translateY(-50%)';
                    searchIcon.style.color = '#CF996C';
                    searchIcon.style.fontSize = '1.1rem';
                    searchIcon.style.pointerEvents = 'none';
                    searchInput.parentNode.style.position = 'relative';
                    searchInput.parentNode.insertBefore(searchIcon, searchInput);
                }
            };

            setTimeout(addSearchIcon, 100);
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
                    ref={searchRef}
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