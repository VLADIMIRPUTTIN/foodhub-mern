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
            </select>
            <div className="price-filters">
                <input
                    type="number"
                    className="filter-price min-price"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    min={0}
                />
                <input
                    type="number"
                    className="filter-price max-price"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    min={0}
                />
            </div>
        </div>
    );
};

export default RecipeFilters;