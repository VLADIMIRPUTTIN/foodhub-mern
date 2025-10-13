import { useState } from 'react';
import axios from 'axios';

const RatingModal = ({ isOpen, recipe, onClose }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        setError('');
        
        try {
            const response = await axios.post(
                `/api/recipes/${recipe._id}/rate`,
                { rating },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                onClose(response.data.recipe);
            } else {
                setError('Failed to submit rating');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error submitting rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-modal-overlay" onClick={() => onClose()}>
            <div className="rating-modal-content" onClick={e => e.stopPropagation()}>
                <button className="rating-modal-close" onClick={() => onClose()}>
                    <i className="bx bx-x"></i>
                </button>
                
                <h2 className="rating-modal-title">Rate this Recipe</h2>
                <h3 className="rating-recipe-name">{recipe.title || recipe.name}</h3>
                
                <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className="rating-star"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                        >
                            <i className={`bx ${(hoveredRating || rating) >= star ? 'bxs-star' : 'bx-star'}`}></i>
                        </button>
                    ))}
                </div>
                
                <div className="rating-label">
                    {rating === 0 && 'Click to rate'}
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                </div>
                
                {error && <div className="rating-error">{error}</div>}
                
                <button 
                    className="rating-submit" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

export default RatingModal;