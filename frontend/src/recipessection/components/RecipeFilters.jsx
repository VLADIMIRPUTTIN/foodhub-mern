import './RecipeFilters.scss';

const RecipeFilters = ({
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice
}) => {
    return (
        <div className="recipe-controls">
            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select
                className="filter-category"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
            >
                <option value="">Filter by Category</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
                <option value="Dessert">Dessert</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Beverage">Beverage</option>
            </select>
            
            <div className="price-filters">
                <input
                    type="number"
                    id="minPrice"
                    placeholder="Min Cost"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                    className="filter-price min-price"
                />
                <input
                    type="number"
                    id="maxPrice"
                    placeholder="Max Cost"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                    className="filter-price max-price"
                />
            </div>
        </div>
    );
};

export default RecipeFilters;