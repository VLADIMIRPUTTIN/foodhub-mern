import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './CameraModal.scss';

const BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://foodhub-mern-production.up.railway.app";

const CameraModal = ({ open, onClose }) => {
    const webcamRef = useRef(null);
    const [detectedIngredients, setDetectedIngredients] = useState([]);
    const [suggestedRecipes, setSuggestedRecipes] = useState([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [detectionStatus, setDetectionStatus] = useState(''); // 'success' | 'none' | 'error'

    if (!open) return null;

    const handleDetect = async () => {
        if (!webcamRef.current) return;
        setIsDetecting(true);
        setDetectionStatus('');
        setSuggestedRecipes([]);
        setDetectedIngredients([]);

        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) {
                setDetectionStatus('error');
                setIsDetecting(false);
                return;
            }
            const base64 = imageSrc.replace(/^data:image\/\w+;base64,/, "");
            const res = await axios.post(`${BASE_URL}/api/vision/detect`, { imageBase64: base64 });
            const objects = res.data.objects || [];
            setDetectedIngredients(objects);

            if (objects.length > 0) {
                setDetectionStatus('success');
            } else {
                setDetectionStatus('none');
            }
        } catch (err) {
            setDetectionStatus('error');
            console.error("Detection error:", err);
        }
        setIsDetecting(false);
    };

    const handleSuggestRecipes = async () => {
        if (detectedIngredients.length === 0) return;
        setIsSuggesting(true);
        setSuggestedRecipes([]);

        try {
            const ingredientNames = detectedIngredients.map(obj => obj.name.toLowerCase());
            const identifyRes = await axios.post(`${BASE_URL}/api/gemini/identify-vegetables`, {
                detectedObjects: ingredientNames
            });
            const foodItems = identifyRes.data.vegetables;

            if (!foodItems || foodItems.length === 0) {
                setSuggestedRecipes([{
                    title: "No Food Items Found",
                    instructions: ["Walang na-identify na pagkain. Subukan ulit o palitan ang ipapakita sa camera."]
                }]);
                setIsSuggesting(false);
                return;
            }

            const recipeRes = await axios.post(`${BASE_URL}/api/gemini/suggest-recipes`, {
                vegetables: foodItems
            });
            setSuggestedRecipes([{
                title: "AI Suggested Recipes",
                instructions: [recipeRes.data.suggestions]
            }]);
        } catch (err) {
            console.error("Recipe suggestion error:", err);
            setSuggestedRecipes([{
                title: "Error",
                instructions: ["Hindi makuha ang mga recipe suggestions. Subukan ulit."]
            }]);
        }
        setIsSuggesting(false);
    };

    const handleClose = () => {
        setDetectedIngredients([]);
        setSuggestedRecipes([]);
        setDetectionStatus('');
        onClose();
    };

    return (
        <div className="camera-modal-overlay" onClick={handleClose}>
            <div className="camera-modal-content" onClick={e => e.stopPropagation()}>
                <button className="camera-modal-close" onClick={handleClose} aria-label="Close">
                    &times;
                </button>

                <h3 className="camera-modal-title">
                    <span>🍽️</span> Detect Ingredients
                </h3>

                <div className="camera-webcam-container">
                    <Webcam
                        audio={false}
                        screenshotFormat="image/jpeg"
                        ref={webcamRef}
                        videoConstraints={{ facingMode: "environment" }}
                        className="camera-webcam"
                    />
                </div>

                <div className="camera-actions">
                    <button
                        className="btn-detect"
                        onClick={handleDetect}
                        disabled={isDetecting}
                    >
                        {isDetecting ? "Detecting..." : "📷 Detect Ingredients"}
                    </button>
                </div>

                {detectionStatus === 'none' && (
                    <p className="detection-msg detection-none">
                        Walang na-detect na pagkain. Subukan ulit.
                    </p>
                )}
                {detectionStatus === 'error' && (
                    <p className="detection-msg detection-error">
                        Detection error. Please retry.
                    </p>
                )}

                {detectionStatus === 'success' && detectedIngredients.length > 0 && (
                    <div className="detected-ingredients">
                        <h4>✅ Detected Ingredients:</h4>
                        <div className="ingredient-chips">
                            {detectedIngredients.map((ing, idx) => (
                                <span key={idx} className="ingredient-chip">
                                    {ing.name}
                                    <span className="chip-score">
                                        {Math.round(ing.score * 100)}%
                                    </span>
                                </span>
                            ))}
                        </div>
                        <button
                            className="btn-suggest"
                            onClick={handleSuggestRecipes}
                            disabled={isSuggesting}
                        >
                            {isSuggesting ? "Getting Recipes..." : "🍳 Suggest Recipes"}
                        </button>
                    </div>
                )}

                {suggestedRecipes.length > 0 && (
                    <div className="recipe-suggestions">
                        <h4>🍽️ Recipe Suggestions:</h4>
                        {suggestedRecipes.map((recipe, idx) => (
                            <div key={idx} className="recipe-suggestion-card">
                                <h5>{recipe.title}</h5>
                                {(recipe.instructions[0] || "")
                                    .split('\n')
                                    .filter(s => s.trim())
                                    .map((step, sidx) => (
                                        <div key={sidx} className="recipe-step">
                                            <span className="step-num">{sidx + 1}</span>
                                            <span>{step}</span>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraModal;
