import React from "react";
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
        <button className="gemini-recipe-back" onClick={onBack}>← Back</button>
        <div className="gemini-recipe-info">
          <h1>{cleanTitle}</h1>
        </div>
        <div className="gemini-recipe-ingredients-card">
          <h2>Ingredients</h2>
          <div className="gemini-recipe-ingredients-list">
            {cleanIngredients.map((ing, idx) => (
              <div key={idx} className="gemini-recipe-ingredient-row">
                <span>{ing}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="gemini-recipe-steps-section">
          <h2>How to Prepare</h2>
          <ol className="gemini-recipe-steps-list">
            {cleanSteps.map((step, idx) => (
              <li key={idx} className="gemini-recipe-step">
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