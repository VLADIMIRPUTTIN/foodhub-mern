import './RecipeFilters.scss';
import React from 'react';

const dietOptions = [
  "Low-Carb",
  "High-Protein",
  "Keto",
  "Vegan",
  "Low-Fat",
  "Gluten-Free",
  "Sugar-Free",
];

const RecipeFilters = ({
  searchTerm, setSearchTerm,
  categoryFilter, setCategoryFilter,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  selectedDiets = [],
  setSelectedDiets = () => {},
}) => {
  const toggleDiet = (tag) => {
    setSelectedDiets(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearDiets = () => setSelectedDiets([]);

  return (
    <div className="recipe-filters">
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

      {/* Keep original price UI classes */}
      <div className="price-filters">
        <input
          type="number"
          className="filter-price min-price"
          placeholder="Min Cost"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          min="0"
        />
        <input
          type="number"
          className="filter-price max-price"
          placeholder="Max Cost"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          min="0"
        />

        {/* Minimal, additive diet UI beside Max Cost */}
        <div className="diet-filter">
          <label>Dietary</label>
          <div className="diet-chips">
            {dietOptions.map(opt => {
              const active = selectedDiets.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className={`diet-chip ${active ? 'active' : ''}`}
                  onClick={() => toggleDiet(opt)}
                  aria-pressed={active}
                >
                  {opt}
                </button>
              );
            })}
            {selectedDiets.length > 0 && (
              <button type="button" className="diet-clear" onClick={clearDiets}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeFilters;