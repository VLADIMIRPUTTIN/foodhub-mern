import React from 'react';
import './RateButton.scss';

const RateButton = ({ recipe, onRateClick }) => {
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent triggering the parent card's click event
    onRateClick(recipe, e);
  };

  return (
    <button
      className="rate-recipe-btn"
      onClick={handleClick}
      aria-label="Rate recipe"
    >
      <i className='bx bx-star'></i>
      Rate
    </button>
  );
};

export default RateButton;