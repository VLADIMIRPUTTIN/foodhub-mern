import React from 'react';
import './CommunityRateRecipe.scss';

const CommunityRateRecipe = ({ recipe, onRateClick, loading = false }) => {
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent triggering the parent card's click event
    if (!loading) {
      onRateClick(recipe, e);
    }
  };

  return (
    <div className="community-rate-container">
      <button
        className={`rate-recipe-btn community-rate-btn ${loading ? 'loading' : ''}`}
        onClick={handleClick}
        disabled={loading}
        aria-label="Rate this community recipe"
        title="Rate this recipe"
      >
        <i className='bx bx-star'></i>
        {loading ? 'Rating...' : 'Rate'}
      </button>
    </div>
  );
};

export default CommunityRateRecipe;