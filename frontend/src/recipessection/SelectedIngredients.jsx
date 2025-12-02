import { useState, useEffect } from 'react';
import './SelectedIngredients.scss';

const SelectedIngredients = ({ selectedIngredients, onRemoveIngredient }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render if no ingredients selected
  if (selectedIngredients.length === 0) {
    return null;
  }

  return (
    <div className="selected-ingredients-section">
      <div className="selected-header">
        <span className="selected-icon">🍽️</span>
        <span className="selected-label">Selected Ingredients</span>
        <span className="selected-count">({selectedIngredients.length})</span>
      </div>
      <div className="chips-container two-column-grid">
        {selectedIngredients.map(ing => (
          <button
            key={ing}
            className="selected-chip chip-button"
            onClick={() => onRemoveIngredient(ing)}
            aria-label={`Remove ${ing}`}
            title={`Remove ${ing}`}
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