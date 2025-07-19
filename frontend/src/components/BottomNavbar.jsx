import React from 'react';
import { Camera } from 'lucide-react'; // Or use any camera icon you prefer

const BottomNavbar = ({ onCameraClick }) => {
  return (
    <nav className="bottom-navbar">
      <button
        className="create-recipe-btn"
        aria-label="Open Camera"
        onClick={onCameraClick}
      >
        <Camera className="icon" />
      </button>
    </nav>
  );
};

export default BottomNavbar;