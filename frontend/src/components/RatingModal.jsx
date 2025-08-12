import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { toast } from "react-hot-toast";
import "./RatingModal.scss";

// Custom star icons (SVG paths)
const StarIcon = ({ filled }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width="32" 
    height="32" 
    className={`star-icon ${filled ? 'star-filled' : 'star-empty'}`}
    fill="currentColor"
  >
    <path d="M12.9,2.6l2.3,5c0.1,0.3,0.4,0.5,0.7,0.6l5.2,0.8C22,9,22.3,10,21.7,10.6l-3.8,3.9c-0.2,0.2-0.3,0.6-0.3,0.9
      l0.9,5.4c0.1,0.8-0.7,1.5-1.4,1.1l-4.7-2.6c-0.3-0.2-0.6-0.2-0.9,0l-4.7,2.6c-0.7,0.4-1.6-0.2-1.4-1.1l0.9-5.4
      c0.1-0.3-0.1-0.7-0.3-0.9l-3.8-3.9C1.7,10,2,9,2.8,8.9l5.2-0.8c0.3,0,0.6-0.3,0.7-0.6l2.3-5C11.5,1.8,12.5,1.8,12.9,2.6z"/>
  </svg>
);

// Rating labels with beautiful food-related descriptions
const ratingLabels = {
  1: "Needs Improvement",
  2: "Pleasant but Simple",
  3: "Delightfully Tasty",
  4: "Incredibly Delicious",
  5: "Absolute Culinary Masterpiece"
};

const RatingModal = ({ isOpen, onClose, recipe }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [animateLabel, setAnimateLabel] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Animate label when hovering over a new rating
    if (hoveredRating > 0) {
      setAnimateLabel(false);
      setTimeout(() => setAnimateLabel(true), 10);
    }
  }, [hoveredRating]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRatingHover = (hoverRating) => {
    setHoveredRating(hoverRating);
  };

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
    setShowConfirmation(true);
  };

  const handleRatingSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to rate recipes");
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      // Fix: Add base URL to ensure the API endpoint is correctly accessed
      const baseURL = import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : "";
        
      const response = await axios.post(`${baseURL}/api/recipes/${recipe._id}/rate`, {
        rating,
      }, {
        withCredentials: true // Ensure cookies are sent with the request
      });
      
      toast.success("Your rating has been submitted successfully!");
      onClose(response.data.recipe); // Pass updated recipe back
    } catch (error) {
      console.error("Rating error:", error);
      toast.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setRating(0);
  };

  if (!isOpen || !recipe) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="rating-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
      >
        <motion.div
          className="rating-modal"
          initial={{ opacity: 0, scale: 0.9, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -30 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="modal-icon">
              <i className='bx bx-star'></i>
            </div>
            <h2>Rate this Recipe</h2>
            <motion.button 
              className="modal-close"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className='bx bx-x'></i>
            </motion.button>
          </div>
          
          <div className="modal-body">
            <div className="recipe-info">
              <h3>{recipe.title || recipe.name}</h3>
              <p className="recipe-subtitle">Share your culinary experience</p>
            </div>
            
            {!showConfirmation ? (
              <div className="rating-stars-container">
                <div className="stars-wrapper">
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        className="rating-star-btn"
                        onMouseEnter={() => handleRatingHover(star)}
                        onMouseLeave={() => handleRatingHover(0)}
                        onClick={() => handleRatingClick(star)}
                        aria-label={`Rate ${star} stars`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <StarIcon filled={star <= (hoveredRating || rating)} />
                      </motion.button>
                    ))}
                  </div>
                  
                  <motion.div 
                    className="rating-label"
                    animate={{
                      opacity: hoveredRating > 0 ? 1 : 0,
                      y: hoveredRating > 0 ? 0 : 10
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {hoveredRating > 0 && ratingLabels[hoveredRating]}
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.div 
                className="confirmation-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="confirmation-title">
                  You selected {rating} {rating === 1 ? "star" : "stars"}
                </p>
                
                <div className="confirmation-rating">
                  {[...Array(5)].map((_, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: index < rating ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ 
                        repeat: index < rating ? Infinity : 0, 
                        repeatDelay: 1,
                        duration: 0.5,
                        delay: index * 0.1
                      }}
                    >
                      <StarIcon filled={index < rating} />
                    </motion.div>
                  ))}
                </div>
                
                <p className="confirmation-message">
                  {ratingLabels[rating]}
                </p>
                
                <p className="confirmation-question">
                  Would you like to submit this rating?
                </p>
              </motion.div>
            )}
          </div>
          
          <div className="modal-footer">
            {showConfirmation ? (
              <>
                <button 
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="submit-btn"
                  onClick={handleRatingSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Submitting...
                    </>
                  ) : "Submit Rating"}
                </button>
              </>
            ) : (
              <button 
                className="cancel-btn full-width"
                onClick={onClose}
              >
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RatingModal;