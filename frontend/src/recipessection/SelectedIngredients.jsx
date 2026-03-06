import { useState, useEffect } from 'react';
import './SelectedIngredients.scss';

const SelectedIngredients = ({ selectedIngredients, onRemoveIngredient }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (selectedIngredients.length === 0) return null;

  return (
    <div className="selected-ingredients-section">

      {/* Header */}
      <div className="selected-header">
        <span className="selected-icon">🍽️</span>
        <span className="selected-label">Selected Ingredients</span>
        <span className="selected-count">{selectedIngredients.length} selected</span>
      </div>

      {/* Chips */}
      <div className="chips-container">
        {selectedIngredients.map(ing => (
          <button
            key={ing}
            className="selected-chip chip-button"
            onClick={() => onRemoveIngredient(ing)}
            aria-label={`Remove ${ing}`}
            title={`Remove ${ing}`}
            type="button"
          >
            <span className="chip-text">{ing}</span>
            <i className="bx bx-x"></i>
          </button>
        ))}
      </div>

    </div>
  );
};

export default SelectedIngredients;