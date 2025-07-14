import "./RecipeModal.scss";
import { useNavigate } from "react-router-dom";

const RecipeModal = ({ open, recipe, onClose }) => {
    const navigate = useNavigate();

    if (!open || !recipe) return null;

    return (
        <div className="recipe-modal-overlay" onClick={onClose}>
            <div
                className="recipe-modal-content animated-modal"
                onClick={e => e.stopPropagation()}
            >
                <button className="modal-close" onClick={onClose}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="modal-header">
                    <h2 className="modal-title">{recipe.name}</h2>
                    <div className="modal-category">
                        <i className="bx bx-restaurant"></i>
                        {recipe.category}
                    </div>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h3 className="modal-section-title">
                            <i className="bx bx-detail"></i>
                            Description
                        </h3>
                        <p className="modal-description">{recipe.description}</p>
                    </div>

                    <div className="modal-section">
                        <h3 className="modal-section-title">
                            <i className="bx bx-basket"></i>
                            Ingredients
                        </h3>
                        <div className="modal-ingredients-list">
                            {recipe.ingredients &&
                                recipe.ingredients.slice(0, 4).map((ing, idx) => (
                                    <div key={idx} className="modal-ingredient-row">
                                        <span className="ingredient-amount">
                                            {ing.amount && `${ing.amount} `}
                                            {ing.unit && `${ing.unit}`}
                                        </span>
                                        <span className="ingredient-name">{ing.name}</span>
                                    </div>
                                ))
                            }
                            {recipe.ingredients && recipe.ingredients.length > 4 && (
                                <div className="modal-ingredient-more">
                                    +{recipe.ingredients.length - 4} more ingredients
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    className="modal-view-btn"
                    onClick={() => navigate(`/recipe/${recipe._id}`)}
                >
                    <i className="bx bx-book-open"></i>
                    View Full Recipe
                </button>
            </div>
        </div>
    );
};

export default RecipeModal;