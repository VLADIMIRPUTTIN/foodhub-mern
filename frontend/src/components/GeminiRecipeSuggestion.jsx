import React from "react";
import { ArrowLeft, Sparkles, ShoppingBasket, CookingPot } from "lucide-react";
import "./GeminiRecipeSuggestion.scss";

// Expects: { ingredients: [string], steps: [string], title?: string }
const GeminiRecipeSuggestion = ({ title, ingredients, steps, onBack }) => {
  // Remove leading ## from ingredient titles and remove all * from steps
  const cleanTitle = title ? title.replace(/^#+\s*/, "") : "AI Suggested Recipe";
  // Remove lines in ingredients that look like a section/title (e.g. "This recipe focuses..." or lines starting with "this recipe" or "focuses")
  const cleanIngredients = ingredients
    ? ingredients
        .map(ing => ing.replace(/^#+\s*/, ""))
        .filter(
          ing =>
            !/^this recipe/i.test(ing.trim()) &&
            !/^focuses/i.test(ing.trim()) &&
            !/^ingredients:/i.test(ing.trim()) &&
            ing.trim().length > 0
        )
    : [];
  const cleanSteps = steps
    ? steps.map(step => step.replace(/\*/g, "").trim())
    : [];

  return (
    <div className="gemini-recipe-suggestion-page">
      <div className="gemini-recipe-modal">
        <button className="gemini-recipe-back" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back</span>
        </button>
        <div className="gemini-recipe-info">
          <div className="gemini-recipe-badge">
            <Sparkles size={14} aria-hidden="true" />
            <span>AI Recipe Suggestion</span>
          </div>
          <h1>{cleanTitle}</h1>
        </div>
        <div className="gemini-recipe-ingredients-card">
          <h2>
            <ShoppingBasket size={18} aria-hidden="true" />
            <span>Ingredients</span>
          </h2>
          <div className="gemini-recipe-ingredients-list">
            {cleanIngredients.map((ing, idx) => (
              <div key={idx} className="gemini-recipe-ingredient-row">
                <span>{ing}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="gemini-recipe-steps-section">
          <h2>
            <CookingPot size={18} aria-hidden="true" />
            <span>How to Prepare</span>
          </h2>
          <ol className="gemini-recipe-steps-list">
            {cleanSteps.map((step, idx) => (
              <li key={idx} className="gemini-recipe-step">
                <span className="step-num">{idx + 1}</span>
                <div>{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GeminiRecipeSuggestion;