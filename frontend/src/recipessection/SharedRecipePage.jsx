import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../pages/NavbarPage";
import "./SharedRecipePage.scss";

const SharedRecipePage = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const baseURL = import.meta.env.MODE === "development"
            ? "http://localhost:5000"
            : "";
        fetch(`${baseURL}/api/recipes/shared`, {
            credentials: "include",
        })
            .then(res => res.json())
            .then(data => {
                // Make sure to populate createdBy in your backend for this to work!
                if (Array.isArray(data.recipes)) {
                    setRecipes(data.recipes);
                } else if (Array.isArray(data.sharedRecipes)) {
                    setRecipes(data.sharedRecipes);
                } else {
                    setRecipes([]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getImageUrl = (recipe) => {
        if (!recipe.imageUrl) {
            return 'https://via.placeholder.com/300x200?text=No+Image';
        }
        if (recipe.imageUrl.startsWith('http')) {
            return recipe.imageUrl;
        }
        const cleanPath = recipe.imageUrl.startsWith('/') ? recipe.imageUrl.slice(1) : recipe.imageUrl;
        // Use absolute URL in development, relative path in production
        if (import.meta.env.MODE === "development") {
            return `http://localhost:5000/${cleanPath}`;
        }
        return `/${cleanPath}`;
    };

    return (
        <>
            <Navbar />
            <div className="shared-recipes-page">
                <h2>Shared Recipes</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : recipes.length === 0 ? (
                    <div className="no-recipes-enhanced">
                        <div className="no-recipes-animation">
                            <div className="chef-hat">
                                <i className="bx bx-restaurant"></i>
                            </div>
                            <div className="floating-ingredients">
                                <div className="ingredient-float ing-1">🥕</div>
                                <div className="ingredient-float ing-2">🍅</div>
                                <div className="ingredient-float ing-3">🧄</div>
                                <div className="ingredient-float ing-4">🌿</div>
                            </div>
                        </div>
                        <div className="no-recipes-content">
                            <h3 className="no-recipes-title">No Shared Recipes Yet</h3>
                            <p className="no-recipes-subtitle">
                                Be the first to share your delicious creation!
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="recipes-grid">
                        {recipes.map(recipe => (
                            <div
                                key={recipe._id}
                                className="recipe-card"
                                onClick={() => navigate(`/recipe/${recipe._id}`)}
                                title="View full recipe"
                            >
                                <div className="recipe-image">
                                    <img
                                        src={getImageUrl(recipe)}
                                        alt={recipe.title || "Recipe"}
                                        onError={e => {
                                            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}
                                    />
                                </div>
                                <div className="recipe-content">
                                    <h3 className="recipe-title">{recipe.title}</h3>
                                    <p className="recipe-desc">{recipe.description}</p>
                                    <div className="recipe-category">{recipe.category}</div>
                                    {/* Show who shared the recipe */}
                                    <div className="recipe-meta" style={{ marginTop: "0.5rem", fontSize: "0.92em", color: "#7c7c7c" }}>
                                        <span>
                                            <i className="bx bx-user"></i>
                                            Shared by:{" "}
                                            {recipe.createdBy?.name
                                                ? recipe.createdBy.name
                                                : recipe.createdBy?.email
                                                    ? recipe.createdBy.email
                                                    : "Unknown"}
                                        </span>
                                    </div>
                                    {recipe.cookingTime && (
                                        <div className="recipe-meta">
                                            <span>
                                                <i className="bx bx-timer"></i> {recipe.cookingTime} mins
                                            </span>
                                        </div>
                                    )}
                                    {recipe.createdAt && (
                                        <div className="recipe-meta">
                                            <span>
                                                <i className="bx bx-calendar"></i> {new Date(recipe.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SharedRecipePage;