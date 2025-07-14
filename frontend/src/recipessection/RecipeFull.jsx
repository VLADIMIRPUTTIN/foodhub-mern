import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./RecipeFull.scss";

const RecipeFull = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);

  // Helper function to construct proper image URL (same as in RecipePage.jsx)
  const getImageUrl = (recipe) => {
    if (!recipe.imageUrl) {
      return 'https://via.placeholder.com/800x400?text=No+Image';
    }
    if (recipe.imageUrl.startsWith('http')) {
      return recipe.imageUrl;
    }
    const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
    if (import.meta.env.MODE === "development") {
      return `http://localhost:5000/${cleanPath}`;
    }
    return `/${cleanPath}`;
  };

  useEffect(() => {
    const baseURL = import.meta.env.MODE === "development"
      ? "http://localhost:5000"
      : "";
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/recipes/${id}`);
        setRecipe(response.data.recipe);
      } catch (error) {
        setRecipe(null);
      }
    };
    
    fetchRecipe();
  }, [id]);

  if (!recipe) return <div>Loading...</div>;

  return (
    <div className="full-recipe-page">
      <div className="full-recipe-banner">
        <img 
          src={getImageUrl(recipe)} 
          alt={recipe.title || recipe.name} 
          className="full-recipe-img"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
          }}
        />
        <div className="full-recipe-overlay" />
        <button className="full-recipe-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="full-recipe-info">
          <h1>{recipe.title || recipe.name}</h1>
          <div className="full-recipe-tags">
            <span className="tag">{recipe.category}</span>
            <span className="tag">Added: {new Date(recipe.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="full-recipe-desc">{recipe.description}</p>
        </div>
        <div className="full-recipe-ingredients-card">
          <h2>Ingredients</h2>
          <div className="full-recipe-ingredients-list">
            {recipe.ingredients && recipe.ingredients.map((ing, idx) => (
              <div key={idx} className="full-recipe-ingredient-row">
                <span className="amount">
                  {ing.amount && <b>{ing.amount} </b>}
                  {ing.unit && <b>{ing.unit} </b>}
                </span>
                <span>{ing.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="full-recipe-steps-section">
        <h2>How to Prepare</h2>
        {(recipe.instructions || recipe.steps) && (recipe.instructions || recipe.steps).map((step, idx) => (
          <div key={idx} className="full-recipe-step">
            <span className="step-num">{idx + 1}</span>
            <div>
              {/* Support both string and object */}
              {typeof step === 'string' ? (
                <b>{step}</b>
              ) : (
                <>
                  <b>{step.instruction}</b>
                  <div>{step.details}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeFull;