import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import IngredientsModal from "../recipessection/IngredientsModal";
import "./CreateRecipe.scss";

// Categories and options arrays
const categories = [
  "Appetizer",
  "Main Course",
  "Dessert",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Beverage",
  "Soup",
  "Salad",
];

const units = [
  "cups",
  "tbsp",
  "tsp",
  "oz",
  "lbs",
  "g",
  "kg",
  "ml",
  "l",
  "pieces",
];

const cuisineOptions = [
  "Filipino",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Mexican",
  "Indian",
  "Thai",
  "American",
  "French",
  "Mediterranean",
];

const CreateRecipe = ({ onRecipeSaved }) => {
  // Basic states
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState(null);
  const [allIngredients, setAllIngredients] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Add-one-by-one ingredient/step UI states
  const [newIngredient, setNewIngredient] = useState({ amount: "", unit: "", name: "" });
  const [newStep, setNewStep] = useState({ instruction: "", details: "" });
  const [isIngredientsModalOpen, setIsIngredientsModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  // Nutrition states
  const [nutritionalInfo, setNutritionalInfo] = useState({
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
    fiber: "",
    sugar: "",
  });
  const [servingSize, setServingSize] = useState("1 serving");
  const dietMultiChoices = [
    "Low-Carb",
    "High-Protein",
    "Keto",
    "Vegan",
    "Low-Fat",
    "Gluten-Free",
    "Sugar-Free",
  ];
  const [dietCategories, setDietCategories] = useState([]);

  // UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [price, setPrice] = useState("");
  const [servings, setServings] = useState("");
  const [isGeneratingIngredients, setIsGeneratingIngredients] = useState(false);
  const [suggestionSuccess, setSuggestionSuccess] = useState("");
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [stepSuggestionSuccess, setStepSuggestionSuccess] = useState("");

  // Preference states
  const [cuisine, setCuisine] = useState("Filipino");
  const [cookingTime, setCookingTime] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");

  // Diet category options
  const dietCategoryOptions = [
    "None",
    "Low-Carb",
    "High-Protein",
    "Low-Fat",
    "Keto",
    "Vegetarian",
    "Vegan",
    "Paleo",
    "Balanced",
  ];

  // Fetch ingredients on mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const baseURL =
          import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        const res = await axios.get(`${baseURL}/api/ingredients`);
        setAllIngredients(res.data.ingredients);
      } catch {
        setAllIngredients([]);
      }
    };
    fetchIngredients();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImage(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Search ingredients for autocomplete
  const searchIngredients = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
      const response = await axios.get(
        `${baseURL}/api/ingredients/search?query=${encodeURIComponent(query)}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setSuggestions(response.data.ingredients);
        setShowSuggestions(true);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleIngredientNameChange = (value) => {
    setNewIngredient((prev) => ({ ...prev, name: value }));
    if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    suggestionTimeoutRef.current = setTimeout(() => searchIngredients(value), 300);
  };

  const handleSuggestionSelect = (ingredientName) => {
    setNewIngredient((prev) => ({ ...prev, name: ingredientName }));
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.amount) {
      setIngredients((prev) => [...prev, { ...newIngredient }]);
      setNewIngredient({ amount: "", unit: "", name: "" });
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const removeIngredient = (idx) =>
    setIngredients(ingredients.filter((_, i) => i !== idx));

  const addStep = () => {
    if (newStep.instruction.trim()) {
      setSteps((prev) => [...prev, { ...newStep }]);
      setNewStep({ instruction: "", details: "" });
    }
  };

  const removeStep = (idx) => setSteps(steps.filter((_, i) => i !== idx));

  const resetForm = () => {
    setName("");
    setCategory("");
    setDescription("");
    setIngredients([]);
    setSteps([]);
    setNewIngredient({ amount: "", unit: "", name: "" });
    setNewStep({ instruction: "", details: "" });
    setImage(null);
    setImagePreview(null);
    setActiveTab("basic");
    setPrice("");
    setServings("");
    setCuisine("Filipino");
    setCookingTime("");
    setDifficulty("Easy");
    setNutritionalInfo({
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
      fiber: "",
      sugar: "",
    });
    setDietCategories([]);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
    };
  }, []);

  // Submit with confirmation, make sure nutrition is numeric where applicable
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", name);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("ingredients", JSON.stringify(ingredients));
      formData.append("instructions", JSON.stringify(steps));
      if (price) formData.append("price", price);
      if (servings) formData.append("servings", servings);
      if (cookingTime) formData.append("cookingTime", cookingTime);
      formData.append("difficulty", difficulty);
      formData.append("cuisine", cuisine);
      formData.append("dietCategories", JSON.stringify(dietCategories));
      formData.append("nutritionalInfo", JSON.stringify(nutritionalInfo));
      formData.append("servingSize", servingSize);
      if (image) formData.append("image", image);

      // âœ… Add baseURL prefix
      const baseURL = import.meta.env.MODE === "development" 
        ? "http://localhost:5000" 
        : "";

      const res = await fetch(`${baseURL}/api/recipes`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create recipe");
      setSuccess("Recipe created.");
      onRecipeSaved?.(data);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // AI ingredient generation
  const generateIngredientSuggestions = async () => {
    if (!name.trim()) {
      setError("Please enter a recipe name first");
      return;
    }

    setIsGeneratingIngredients(true);
    setError("");
    setSuggestionSuccess("");

    try {
      const baseURL =
        import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

      const response = await axios.post(
        `${baseURL}/api/vision/fetch-ninjas-recipe`,
        { query: name },
        { withCredentials: true, timeout: 20000 }
      );

      if (response.data.success && response.data.recipes?.length > 0) {
        const recipes = response.data.recipes;

        // Pick best recipe by title similarity
        const lower = name.toLowerCase();
        let bestRecipe =
          recipes.find((r) =>
            (r.title || r.name || "").toLowerCase().includes(lower)
          ) || recipes[0];

        if (bestRecipe.ingredients) {
          let parsedList = [];

          if (Array.isArray(bestRecipe.ingredients)) {
            // array of strings or objects
            parsedList = bestRecipe.ingredients
              .map((item) => {
                if (typeof item === "string") return item;
                if (item?.name) {
                  const amt = item.amount || "1";
                  const unit = units.includes(item.unit) ? item.unit : "pieces";
                  return `${amt} ${unit} ${item.name}`;
                }
                return null;
              })
              .filter(Boolean);
          } else if (typeof bestRecipe.ingredients === "string") {
            // delimited string
            parsedList = bestRecipe.ingredients.split("|").map((s) => s.trim());
          }

          const normalized = parseIngredientsFromText(parsedList.join("|"));
          if (normalized.length) {
            await processIngredientsResponse(normalized);
            return;
          }
        }
      }

      // Fallback
      useFallbackIngredients();
    } catch (err) {
      console.error("Error generating ingredients:", err);
      useFallbackIngredients();
    } finally {
      setIsGeneratingIngredients(false);
    }
  };

  const useFallbackIngredients = () => {
    const fallbackIngredients = getFallbackIngredientsForRecipe(name, allIngredients);
    setIngredients(fallbackIngredients);
    setSuggestionSuccess(
      `Added ${fallbackIngredients.length} common ingredients for "${name}" (offline mode)`
    );
    setActiveTab("ingredients");
  };

  const processIngredientsResponse = async (ingredientsList) => {
    try {
      // Do not auto-create new pantry ingredients here; just normalize units
      const newIngredients = ingredientsList.map((ing) => {
        const validUnit = units.includes(ing.unit) ? ing.unit : "pieces";
        return {
          name: ing.name,
          amount: ing.amount || "1",
          unit: validUnit,
        };
      });

      setSuggestionSuccess(
        `Found ${newIngredients.length} ingredients for "${name}"!`
      );
      setIngredients(newIngredients);
      setActiveTab("ingredients");
    } catch (error) {
      console.error("Error processing ingredients:", error);
      useFallbackIngredients();
    }
  };

  const getFallbackIngredientsForRecipe = (recipeName, allIngredientsState) => {
    const commonIngredients = [
      { name: "Salt", amount: "1", unit: "tsp" },
      { name: "Pepper", amount: "1/2", unit: "tsp" },
      { name: "Garlic", amount: "3", unit: "pieces" },
      { name: "Onion", amount: "1", unit: "pieces" },
      { name: "Vegetable oil", amount: "2", unit: "tbsp" },
      { name: "Water", amount: "1", unit: "cups" },
    ];

    if (allIngredientsState?.length > 0) {
      const randomIngredients = [...allIngredientsState]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10)
        .map((ing) => ({
          name: ing.name,
          amount: "1",
          unit: "pieces",
        }));

      if (randomIngredients.length >= 5) {
        return randomIngredients;
      }

      return [
        ...randomIngredients,
        ...commonIngredients.slice(0, 6 - randomIngredients.length),
      ];
    }

    return commonIngredients;
  };

  // AI step generation
  const generateStepSuggestions = async () => {
    if (!name.trim()) {
      setError("Please enter a recipe name first");
      return;
    }

    if (ingredients.length < 2 || !ingredients[0].name) {
      setError("Please add at least 2 ingredients first");
      return;
    }

    setIsGeneratingSteps(true);
    setError("");
    setStepSuggestionSuccess("");

    try {
      const baseURL =
        import.meta.env.MODE === "development" ? "http://localhost:5000" : "";

      const validIngredients = ingredients.filter(
        (ing) => ing.name && ing.name.trim() && ing.amount && ing.unit
      );

      if (validIngredients.length < 2) {
        setError("Please add at least 2 complete ingredients");
        setIsGeneratingSteps(false);
        return;
      }

      const ingredientsList = validIngredients.map(
        (ing) => `${ing.amount} ${ing.unit} ${ing.name}`
      );

      const response = await axios.post(
        `${baseURL}/api/vision/suggest-steps`,
        {
          recipeName: name,
          ingredients: ingredientsList,
          category: category || "Main Course",
        },
        {
          withCredentials: true,
          timeout: 30000,
        }
      );

      if (response.data.success && response.data.steps?.length > 0) {
        // steps could be strings or structured; normalize to { instruction, details }
        const normalizedSteps = response.data.steps.map((s) => {
          if (typeof s === "string") return { instruction: s, details: "" };
          return {
            instruction: s.instruction || "",
            details: s.details || "",
          };
        });
        setSteps(normalizedSteps);
        setStepSuggestionSuccess(
          `Generated ${normalizedSteps.length} preparation steps for "${name}"`
        );
      } else {
        useGenericSteps();
      }
    } catch (err) {
      console.error("Error generating steps:", err);
      let errorMessage = "Failed to generate preparation steps";

      if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        errorMessage =
          "Cannot connect to server. Using generic steps instead.";
        useGenericSteps();
      }

      setError(errorMessage);
    } finally {
      setIsGeneratingSteps(false);
    }
  };

  const useGenericSteps = () => {
    const genericSteps = [
      {
        instruction: "Prepare ingredients",
        details:
          "Gather and measure all ingredients. Wash, peel, and chop vegetables as needed.",
      },
      {
        instruction: "Heat cooking vessel",
        details:
          "Place a pot or pan over medium heat. Add oil or butter if the recipe requires it.",
      },
      {
        instruction: "Cook main ingredients",
        details:
          "Add the main ingredients to the pot/pan and cook according to their requirements.",
      },
      {
        instruction: "Add seasonings",
        details:
          "Add salt, pepper, and other seasonings to taste. Stir well to combine.",
      },
      {
        instruction: "Simmer if needed",
        details:
          "Cover and reduce heat if needed. Cook until all ingredients are tender and flavors are well combined.",
      },
      {
        instruction: "Serve",
        details: "Remove from heat and serve hot. Garnish if desired.",
      },
    ];

    setSteps(genericSteps);
    setStepSuggestionSuccess(
      `Added ${genericSteps.length} generic steps for "${name}" (offline mode)`
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <div className="tab-pane active">
            {/* Details section */}
            <div className="form-section">
              <div className="section-header">
                <i className="bx bx-info-circle"></i>
                <h3>Recipe Details</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Recipe Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter recipe name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your recipe"
                  rows={3}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Cost (â‚±)</label>
                  <input
                    type="number"
                    placeholder="Estimated cost"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Servings</label>
                  <input
                    type="number"
                    placeholder="Number of servings"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            </div>
            {/* Image section */}
            <div className="form-section image-section">
              <div className="section-header">
                <i className="bx bx-image"></i>
                <h3>Recipe Image</h3>
              </div>
              <div className="image-upload-compact">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload-admin"
                />
                <label htmlFor="image-upload-admin" className="upload-label">
                  {imagePreview ? (
                    <div className="preview-wrap">
                      <img src={imagePreview} alt="Preview" />
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={(e) => { e.preventDefault(); setImage(null); setImagePreview(null); }}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <i className="bx bx-cloud-upload"></i>
                      <span>Choose Image</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        );

      // ---- INGREDIENTS -------------------------------------------------------
      case "ingredients":
        return (
          <div className="tab-pane active">
            <div className="form-section">
              <div className="section-header">
                <i className="bx bx-list-ul"></i>
                <h3>Ingredients ({ingredients.length})</h3>
                <button
                  type="button"
                  className="ai-suggest-btn"
                  onClick={generateIngredientSuggestions}
                  disabled={isGeneratingIngredients || !name.trim()}
                >
                  {isGeneratingIngredients ? (
                    <><span className="spinner-xs"></span> Generating...</>
                  ) : (
                    <><i className="bx bx-bulb"></i> AI Suggest</>
                  )}
                </button>
              </div>

              {suggestionSuccess && (
                <div className="suggest-success">
                  <i className="bx bx-check-circle"></i> {suggestionSuccess}
                </div>
              )}

              <div className="input-row">
                <div className="ingredient-input-container" ref={inputRef}>
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={newIngredient.name}
                    onChange={(e) => handleIngredientNameChange(e.target.value)}
                    onClick={() => setIsIngredientsModalOpen(true)}
                  />
                  <button
                    type="button"
                    className="ingredient-suggest-btn"
                    onClick={() => setIsIngredientsModalOpen(true)}
                    title="Browse ingredients"
                  >
                    <i className="bx bx-search"></i>
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {isSearching && (
                        <div className="suggestion-item loading">
                          <i className="bx bx-loader-alt bx-spin"></i> Searching...
                        </div>
                      )}
                      {suggestions.map((ing, i) => (
                        <div
                          key={ing._id || i}
                          className="suggestion-item"
                          onClick={() => handleSuggestionSelect(ing.name)}
                        >
                          <i className="bx bx-leaf"></i>
                          {ing.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Amount"
                  value={newIngredient.amount}
                  onChange={(e) => setNewIngredient((p) => ({ ...p, amount: e.target.value }))}
                  className="amount-input"
                />
                <select
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient((p) => ({ ...p, unit: e.target.value }))}
                  className="unit-select"
                >
                  <option value="">Unit</option>
                  {units.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button type="button" onClick={addIngredient} className="add-btn">
                  <i className="bx bx-plus"></i><span>Add</span>
                </button>
              </div>

              <div className="items-list">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="list-item">
                    <span className="amount">{ingredient.amount} {ingredient.unit}</span>
                    <span className="name">{ingredient.name}</span>
                    <button type="button" onClick={() => removeIngredient(index)} className="remove-btn">
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
                {ingredients.length === 0 && (
                  <p className="empty-hint">No ingredients yet. Add some above or use AI Suggest.</p>
                )}
              </div>
            </div>
          </div>
        );

      // ---- STEPS -------------------------------------------------------------
      case "steps":
        return (
          <div className="tab-pane active">
            <div className="form-section">
              <div className="section-header">
                <i className="bx bx-detail"></i>
                <h3>Steps ({steps.length})</h3>
                <button
                  type="button"
                  className="ai-suggest-btn"
                  onClick={generateStepSuggestions}
                  disabled={isGeneratingSteps || !name.trim() || ingredients.length < 2}
                >
                  {isGeneratingSteps ? (
                    <><span className="spinner-xs"></span> Generating...</>
                  ) : (
                    <><i className="bx bx-bulb"></i> AI Suggest</>
                  )}
                </button>
              </div>

              {stepSuggestionSuccess && (
                <div className="suggest-success">
                  <i className="bx bx-check-circle"></i> {stepSuggestionSuccess}
                </div>
              )}

              <div className="step-input-group">
                <input
                  type="text"
                  placeholder="Step title (e.g. Prepare ingredients)"
                  value={newStep.instruction}
                  onChange={(e) => setNewStep((p) => ({ ...p, instruction: e.target.value }))}
                />
                <textarea
                  placeholder="Step details (optional)"
                  value={newStep.details}
                  onChange={(e) => setNewStep((p) => ({ ...p, details: e.target.value }))}
                  rows={2}
                />
                <button type="button" onClick={addStep} className="add-btn">
                  <i className="bx bx-plus"></i><span>Add Step</span>
                </button>
              </div>

              <div className="items-list">
                {steps.map((step, index) => (
                  <div key={index} className="list-item instruction-item">
                    <span className="step-number">{index + 1}</span>
                    <div className="step-text-wrap">
                      <span className="step-title">{step.instruction}</span>
                      {step.details && <span className="step-details">{step.details}</span>}
                    </div>
                    <button type="button" onClick={() => removeStep(index)} className="remove-btn">
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
                {steps.length === 0 && (
                  <p className="empty-hint">No steps yet. Add some above or use AI Suggest.</p>
                )}
              </div>
            </div>
          </div>
        );

      // ---- PREFERENCES -------------------------------------------------------
      case "preferences":
        return (
          <div className="tab-pane active">
            <div className="form-section">
              <div className="section-header">
                <i className="bx bx-cog"></i>
                <h3>Recipe Preferences</h3>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Cuisine</label>
                  <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                    {cuisineOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Cooking Time (min)</label>
                  <input
                    type="number"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(e.target.value)}
                    placeholder="e.g. 30"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      // ---- NUTRITION ---------------------------------------------------------
      case "nutrition":
        return (
          <div className="tab-pane active">
            <div className="form-section">
              <div className="section-header">
                <i className="bx bx-line-chart"></i>
                <h3>Nutrition Info</h3>
              </div>
              <div className="form-group">
                <label>Dietary Tags</label>
                <div className="dietary-tags-container">
                  {dietMultiChoices.map((tag) => {
                    const active = dietCategories.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        className={`dietary-tag ${active ? "active" : ""}`}
                        onClick={() =>
                          setDietCategories((prev) =>
                            prev.includes(tag)
                              ? prev.filter((t) => t !== tag)
                              : [...prev, tag]
                          )
                        }
                        aria-pressed={active}
                      >
                        <i className={`bx ${active ? "bx-check" : "bx-plus"}`} />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="form-grid three-col">
                {[
                  { key: "calories", label: "Calories (kcal)" },
                  { key: "protein", label: "Protein (g)" },
                  { key: "fat", label: "Fat (g)" },
                  { key: "carbs", label: "Carbs (g)" },
                  { key: "fiber", label: "Fiber (g)" },
                  { key: "sugar", label: "Sugar (g)" },
                ].map((item) => (
                  <div key={item.key} className="form-group">
                    <label>{item.label}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={nutritionalInfo[item.key]}
                      onChange={(e) =>
                        setNutritionalInfo((prev) => ({
                          ...prev,
                          [item.key]: e.target.value,
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ---- RENDER ---------------------------------------------------------------
  return (
    <div className="create-recipe-admin">
      {/* Header */}
      <div className="form-header">
        <h1>
          <i className="bx bx-food-menu"></i>
          Create Recipe
        </h1>
      </div>

      {/* Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
        >
          <i className="bx bx-info-circle"></i>
          <span>Basic Info</span>
        </button>
        <button
          className={`tab-button ${activeTab === "ingredients" ? "active" : ""}`}
          onClick={() => setActiveTab("ingredients")}
        >
          <i className="bx bx-leaf"></i>
          <span>Ingredients</span>
          {ingredients.length > 0 && <span className="tab-count">{ingredients.length}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === "steps" ? "active" : ""}`}
          onClick={() => setActiveTab("steps")}
        >
          <i className="bx bx-detail"></i>
          <span>Steps</span>
          {steps.length > 0 && <span className="tab-count">{steps.length}</span>}
        </button>
        <button
          className={`tab-button ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          <i className="bx bx-cog"></i>
          <span>Prefs</span>
        </button>
        <button
          className={`tab-button ${activeTab === "nutrition" ? "active" : ""}`}
          onClick={() => setActiveTab("nutrition")}
        >
          <i className="bx bx-line-chart"></i>
          <span>Nutrition</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="form-alert form-alert--error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <i className="bx bx-error-circle"></i>
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="alert-close">
                <i className="bx bx-x"></i>
              </button>
            </motion.div>
          )}
          {success && (
            <motion.div
              className="form-alert form-alert--success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <i className="bx bx-check-circle"></i>
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || !name.trim() || !category || !description.trim()}
          >
            {isLoading ? (
              <><span className="spinner-sm"></span> Creating...</>
            ) : (
              <><i className="bx bx-check"></i> Create Recipe</>
            )}
          </button>
        </div>
      </form>

      {/* Ingredients Modal */}
      <IngredientsModal
        isOpen={isIngredientsModalOpen}
        onClose={() => setIsIngredientsModalOpen(false)}
        onIngredientSelect={(ing) => setIngredients((prev) => [...prev, ing])}
        allIngredients={allIngredients}
        units={units}
      />
    </div>
  );
};


export default CreateRecipe;

// Helper function to parse ingredients from text
const parseIngredientsFromText = (ingredientsText) => {
  const pipeSeparated = ingredientsText.split("|");

  return pipeSeparated
    .map((ingredientStr) => {
      const cleaned = ingredientStr.trim();
      if (!cleaned) return null;

      const commonUnits = [
        "cups",
        "cup",
        "tablespoons",
        "tablespoon",
        "teaspoons",
        "teaspoon",
        "ounces",
        "ounce",
        "pounds",
        "pound",
        "grams",
        "gram",
        "kilograms",
        "kilogram",
        "milliliters",
        "milliliter",
        "liters",
        "liter",
        "tbsp",
        "tsp",
        "oz",
        "lb",
        "g",
        "kg",
        "ml",
        "l",
        "pieces",
        "piece",
        "slice",
        "slices",
        "clove",
        "cloves",
        "lg",
        "md",
        "c",
        "ts",
      ];

      const pattern1 = new RegExp(
        `^(\\d+(?:\\.\\d+)?(?:\\s+\\d+/\\d+)?)\\s+(${commonUnits.join(
          "|"
        )})\\s+(.+)$`,
        "i"
      );
      const pattern2 =
        /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?)(?:\s+)?(.+)$/i;
      const pattern3 = /^(.+)$/i;

      let match = cleaned.match(pattern1);
      if (match) {
        const [, amount, unit, name] = match;
        const normalizedUnit = normalizeUnit(unit.trim().toLowerCase());
        const validUnit = units.includes(normalizedUnit)
          ? normalizedUnit
          : "pieces";

        return {
          name: name.trim(),
          amount: amount.trim(),
          unit: validUnit,
        };
      }

      match = cleaned.match(pattern2);
      if (match) {
        const [, amount, name] = match;
        return {
          name: name.trim(),
          amount: amount.trim(),
          unit: "pieces",
        };
      }

      match = cleaned.match(pattern3);
      if (match) {
        return {
          name: match[1].trim(),
          amount: "1",
          unit: "pieces",
        };
      }

      return {
        name: cleaned,
        amount: "1",
        unit: "pieces",
      };
    })
    .filter(Boolean);
};

// Helper function to normalize units
const normalizeUnit = (unit) => {
  const unitMap = {
    cup: "cups",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    ounce: "oz",
    ounces: "oz",
    pound: "lbs",
    pounds: "lbs",
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    milliliter: "ml",
    milliliters: "ml",
    liter: "l",
    liters: "l",
    piece: "pieces",
    slice: "pieces",
    slices: "pieces",
    clove: "pieces",
    cloves: "pieces",
    c: "cups",
    ts: "tsp",
    tb: "tbsp",
    lg: "pieces",
    md: "pieces",
    sm: "pieces",
  };

  return unitMap[unit] || unit;
};

