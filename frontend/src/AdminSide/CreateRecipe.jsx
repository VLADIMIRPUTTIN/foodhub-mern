import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
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
  const [ingredients, setIngredients] = useState([
    { amount: "", unit: "", name: "" },
  ]);
  const [steps, setSteps] = useState([{ instruction: "", details: "" }]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState(null);
  const [allIngredients, setAllIngredients] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");

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

  const handleIngredientChange = (idx, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[idx][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () =>
    setIngredients([...ingredients, { amount: "", unit: "", name: "" }]);
  const removeIngredient = (idx) =>
    setIngredients(ingredients.filter((_, i) => i !== idx));

  const handleStepChange = (idx, field, value) => {
    const newSteps = [...steps];
    newSteps[idx][field] = value;
    setSteps(newSteps);
  };

  const addStep = () =>
    setSteps([...steps, { instruction: "", details: "" }]);
  const removeStep = (idx) => setSteps(steps.filter((_, i) => i !== idx));

  const resetForm = () => {
    setName("");
    setCategory("");
    setDescription("");
    setIngredients([{ amount: "", unit: "", name: "" }]);
    setSteps([{ instruction: "", details: "" }]);
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

      // ✅ Add baseURL prefix
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
          <motion.div
            className="tab-content-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="form-card">
              <h2 className="card-title">
                <i className="bx bx-info-circle"></i>
                Basic Recipe Information
              </h2>
              <div className="form-content">
                <div className="form-group">
                  <label className="form-label" htmlFor="recipeName">
                    <i className="bx bx-food-menu"></i>
                    Recipe Name
                  </label>
                  <input
                    type="text"
                    id="recipeName"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter recipe name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="category">
                    <i className="bx bx-category"></i>
                    Category
                  </label>
                  <select
                    id="category"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">
                    <i className="bx bx-message-alt-detail"></i>
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your recipe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="bx bx-money-withdraw"></i>
                    Cost (₱)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter estimated cost"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <p className="form-description">
                    <i className="bx bx-info-circle"></i>
                    Enter the estimated cost for this recipe
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="bx bx-group"></i>
                    Total Servings
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Number of servings"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    min="1"
                  />
                  <p className="form-description">
                    <i className="bx bx-info-circle"></i>
                    Ilang portions ang buong recipe
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="bx bx-image"></i>
                    Recipe Image
                  </label>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      id="recipeImage"
                      className="form-input-file"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                    <label
                      htmlFor="recipeImage"
                      className="image-upload-label"
                    >
                      <i className="bx bx-upload"></i>
                      <span>Click to upload image</span>
                    </label>
                    {imagePreview && (
                      <div className="image-preview-container">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="image-preview"
                        />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            setImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <i className="bx bx-x"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "ingredients":
        return (
          <motion.div
            className="tab-content-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="form-card">
              <div className="ingredients-header">
                <h2 className="card-title">
                  <i className="bx bx-leaf"></i>
                  Ingredients
                </h2>
                <button
                  type="button"
                  className="btn btn--ai ingredients-ai-button"
                  onClick={generateIngredientSuggestions}
                  disabled={isGeneratingIngredients || !name.trim()}
                >
                  {isGeneratingIngredients ? (
                    <span className="btn__loading">
                      <span className="spinner"></span>
                      Generating...
                    </span>
                  ) : (
                    <>
                      <i className="bx bx-bulb"></i>
                      Suggest Ingredients
                    </>
                  )}
                </button>
              </div>

              {suggestionSuccess && (
                <div className="ingredients-success">
                  <i className="bx bx-check-circle"></i> {suggestionSuccess}
                </div>
              )}

              <div className="ingredients-list">
                {ingredients.map((ingredient, idx) => (
                  <div key={idx} className="ingredient-row">
                    <div className="ingredient-fields">
                      <input
                        type="text"
                        className="form-input ingredient-amount"
                        value={ingredient.amount}
                        onChange={(e) =>
                          handleIngredientChange(idx, "amount", e.target.value)
                        }
                        placeholder="Amount"
                      />
                      <select
                        className="form-select ingredient-unit"
                        value={ingredient.unit || ""}
                        onChange={(e) =>
                          handleIngredientChange(idx, "unit", e.target.value)
                        }
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-input ingredient-name"
                        value={ingredient.name}
                        onChange={(e) =>
                          handleIngredientChange(idx, "name", e.target.value)
                        }
                        placeholder="Ingredient name"
                        list="ingredient-options"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn--destructive btn--icon"
                      onClick={() => removeIngredient(idx)}
                      disabled={ingredients.length === 1}
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                ))}

                <datalist id="ingredient-options">
                  {allIngredients.map((ing) => (
                    <option key={ing._id} value={ing.name} />
                  ))}
                </datalist>
              </div>

              <button
                type="button"
                className="btn btn--add"
                onClick={addIngredient}
              >
                <i className="bx bx-plus"></i>
                Add Ingredient
              </button>
            </div>
          </motion.div>
        );

      case "steps":
        return (
          <motion.div
            className="tab-content-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="form-card">
              <div className="ingredients-header">
                <h2 className="card-title">
                  <i className="bx bx-list-ol"></i>
                  Preparation Steps
                </h2>
                <button
                  type="button"
                  className="btn btn--ai ingredients-ai-button"
                  onClick={generateStepSuggestions}
                  disabled={
                    isGeneratingSteps || !name.trim() || ingredients.length < 2
                  }
                >
                  {isGeneratingSteps ? (
                    <span className="btn__loading">
                      <span className="spinner"></span>
                      Generating...
                    </span>
                  ) : (
                    <>
                      <i className="bx bx-bulb"></i>
                      Suggest Steps
                    </>
                  )}
                </button>
              </div>

              {stepSuggestionSuccess && (
                <div className="ingredients-success">
                  <i className="bx bx-check-circle"></i> {stepSuggestionSuccess}
                </div>
              )}

              <div className="steps-list">
                {steps.map((step, idx) => (
                  <div key={idx} className="step-row">
                    <div className="step-number">{idx + 1}</div>
                    <div className="step-content">
                      <input
                        type="text"
                        className="form-input"
                        value={step.instruction}
                        onChange={(e) =>
                          handleStepChange(idx, "instruction", e.target.value)
                        }
                        placeholder="Step title"
                      />
                      <textarea
                        className="form-textarea"
                        value={step.details}
                        onChange={(e) =>
                          handleStepChange(idx, "details", e.target.value)
                        }
                        placeholder="Step details"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn--destructive btn--icon"
                      onClick={() => removeStep(idx)}
                      disabled={steps.length === 1}
                    >
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn btn--add" onClick={addStep}>
                <i className="bx bx-plus"></i>
                Add Step
              </button>
            </div>
          </motion.div>
        );

      case "preferences":
        return (
          <motion.div
            className="tab-content-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="form-card">
              <h2 className="card-title">
                <i className="bx bx-food-menu"></i>
                Recipe Details
              </h2>
              <div className="form-content">
                <div className="form-group">
                  <label className="form-label" htmlFor="cuisine">
                    <i className="bx bx-world"></i>
                    Cuisine
                  </label>
                  <select
                    id="cuisine"
                    name="cuisine"
                    className="form-select"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                  >
                    {cuisineOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cookingTime">
                    <i className="bx bx-time"></i>
                    Cooking Time (minutes)
                  </label>
                  <input
                    id="cookingTime"
                    name="cookingTime"
                    type="number"
                    className="form-input"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(e.target.value)}
                    min="0"
                    placeholder="e.g. 30"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="difficulty">
                    <i className="bx bx-trending-up"></i>
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    className="form-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "nutrition":
        return (
          <motion.div className="tab-content-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="form-card">
              <h2 className="card-title">
                <i className="bx bx-line-chart"></i>
                Nutrition
              </h2>
              <div className="form-content">
                <div className="form-group">
                  <label className="form-label">
                    <i className="bx bx-purchase-tag"></i>
                    Dietary Categories (multi-select)
                  </label>
                  <div className="dietary-tags-container">
                    {dietMultiChoices.map(tag => {
                      const active = dietCategories.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          className={`dietary-tag ${active ? "active" : ""}`}
                          onClick={() =>
                            setDietCategories(prev =>
                              prev.includes(tag)
                                ? prev.filter(t => t !== tag)
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

                <div className="nutrition-grid">
                  {[
                    { key: "calories", label: "Calories (kcal)" },
                    { key: "protein", label: "Protein (g)" },
                    { key: "fat", label: "Fat (g)" },
                    { key: "carbs", label: "Carbs (g)" },
                    { key: "fiber", label: "Fiber (g)" },
                    { key: "sugar", label: "Sugar (g)" },
                  ].map((item) => (
                    <div key={item.key} className="form-group">
                      <label className="form-label">
                        <i className="bx bx-dots-horizontal-rounded"></i>
                        {item.label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        className="form-input"
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
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-recipe">
      <div className="create-recipe__container">
        <div className="create-recipe__tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === "basic" ? "active" : ""}`}
            onClick={() => setActiveTab("basic")}
          >
            <i className="bx bx-info-circle"></i>
            Basic Info
          </button>
          <button
            type="button"
            className={`tab-button ${
              activeTab === "ingredients" ? "active" : ""
            }`}
            onClick={() => setActiveTab("ingredients")}
          >
            <i className="bx bx-leaf"></i>
            Ingredients
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "steps" ? "active" : ""}`}
            onClick={() => setActiveTab("steps")}
          >
            <i className="bx bx-list-ol"></i>
            Steps
          </button>
          <button
            type="button"
            className={`tab-button ${
              activeTab === "preferences" ? "active" : ""
            }`}
            onClick={() => setActiveTab("preferences")}
          >
            <i className="bx bx-food-menu"></i>
            Preferences
          </button>
          <button
            type="button"
            className={`tab-button ${
              activeTab === "nutrition" ? "active" : ""
            }`}
            onClick={() => setActiveTab("nutrition")}
          >
            <i className="bx bx-line-chart"></i>
            Nutrition
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-recipe__form">
          <div className="create-recipe__content">{renderTabContent()}</div>

          {/* Fixed bottom actions */}
          <div className="form-actions form-actions--fixed">
            <AnimatePresence>
              {error && (
                <motion.div
                  className="alert alert--error"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="bx bx-error-circle alert__icon"></i>
                  {error}
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="alert__close"
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </motion.div>
              )}

              {success && (
                <motion.div
                  className="alert alert--success"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="bx bx-check-circle alert__icon"></i>
                  {success}
                  <button
                    type="button"
                    onClick={() => setSuccess("")}
                    className="alert__close"
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn btn--primary btn--lg create-recipe-btn"
              disabled={
                isLoading || !name.trim() || !category || !description.trim()
              }
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isLoading ? (
                <span className="btn__loading">
                  <span className="spinner"></span>
                  Creating Recipe...
                </span>
              ) : (
                <>
                  <i className="bx bx-check"></i>
                  Create Recipe
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
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

