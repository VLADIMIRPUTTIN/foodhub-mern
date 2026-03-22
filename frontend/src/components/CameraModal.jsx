import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import {
  Camera,
  RefreshCw,
  Search,
  Upload,
  X,
  Plus,
  Sparkles,
  Salad,
} from "lucide-react";
import GeminiRecipeSuggestion from "./GeminiRecipeSuggestion";
import api from "../utils/apiClient";
import "./CameraModal.scss";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5000" : "");

const INGREDIENT_TAGALOG_MAP = {
  tomato: "kamatis",
  onion: "sibuyas",
  garlic: "bawang",
  ginger: "luya",
  rice: "bigas",
  chicken: "manok",
  pork: "baboy",
  beef: "baka",
  fish: "isda",
  egg: "itlog",
  carrot: "karot",
  potato: "patatas",
  cabbage: "repolyo",
  lettuce: "letsugas",
  spinach: "espinaka",
  eggplant: "talong",
  cucumber: "pipino",
  corn: "mais",
  chili: "sili",
  pepper: "paminta",
  salt: "asin",
  sugar: "asukal",
  flour: "harina",
  milk: "gatas",
  oil: "mantika",
  vinegar: "suka",
  "soy sauce": "toyo",
  shrimp: "hipon",
  crab: "alimango",
  squid: "pusit",
  mushroom: "kabute",
  banana: "saging",
  apple: "mansanas",
  lemon: "limon",
  lime: "dayap",
  calamansi: "kalamansi",
  coconut: "niyog",
};

const normalizeIngredientKey = (name = "") =>
  name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTagalogIngredientName = (name = "") => {
  const normalized = normalizeIngredientKey(name);
  if (!normalized) return null;

  if (INGREDIENT_TAGALOG_MAP[normalized]) {
    return INGREDIENT_TAGALOG_MAP[normalized];
  }

  const singular = normalized.endsWith("s") ? normalized.slice(0, -1) : normalized;
  return INGREDIENT_TAGALOG_MAP[singular] || null;
};

const getBilingualIngredientLabel = (name = "") => {
  const tagalog = getTagalogIngredientName(name);
  return tagalog ? `${name} / ${tagalog}` : name;
};

const CameraModal = ({ isOpen, onClose, onCapture, onIngredientsDetected }) => {
  // All useState hooks must be at the top and always called
  const [preview, setPreview] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [ingredientNames, setIngredientNames] = useState([]);
  const [geminiResult, setGeminiResult] = useState(null);
  const [showGeminiRecipe, setShowGeminiRecipe] = useState(false);
  const [geminiParsed, setGeminiParsed] = useState({ title: "", ingredients: [], steps: [] });
  const [newIngredient, setNewIngredient] = useState("");
  const [uploadMode, setUploadMode] = useState(false);

  // All useRef hooks
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  // All useCallback hooks
  const handleAutoScan = useCallback(async (imageSrc) => {
    setScanning(true);
    setScanResults(null);
    
    try {
      const requestPath = `${API_BASE}/api/vision/detect-and-suggest`;
      const resp = await api.post(requestPath, { imageBase64: imageSrc });
      const data = resp?.data || {};

      const detectedNames = data?.segmentation
        ? data.segmentation.map(item => item.label).filter(Boolean)
        : data?.detected
          ? data.detected.filter(Boolean)
          : [];

      if (!Array.isArray(detectedNames)) {
        setScanResults([]);
        setIngredientNames([]);
        return;
      }

      const uniqueDetected = Array.from(new Set(detectedNames.map(name => name.trim()).filter(Boolean)));

      if (data && data.segmentation) {
        setScanResults(data.segmentation);
        setIngredientNames(uniqueDetected);
      } else if (data && data.detected) {
        setScanResults(data.detected.map(d => ({ label: d, box: null })));
        setIngredientNames(uniqueDetected);
      } else {
        setScanResults([]);
        setIngredientNames([]);
      }

      if (typeof onIngredientsDetected === "function" && uniqueDetected.length > 0) {
        onIngredientsDetected(uniqueDetected);
      }
    } catch (e) {
      console.error("Auto-scan failed", e);
      setScanResults([]);
    } finally {
      setScanning(false);
    }
  }, [onIngredientsDetected]);

  const captureWithScan = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
      setUploadMode(false);
      if (onCapture) onCapture(imageSrc);
      // Auto-scan after capture
      await handleAutoScan(imageSrc);
    }
  }, [onCapture, handleAutoScan]);

  const handleFileUploadWithScan = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageSrc = e.target.result;
        setPreview(imageSrc);
        setUploadMode(true);
        if (onCapture) onCapture(imageSrc);
        // Auto-scan after upload
        await handleAutoScan(imageSrc);
      };
      reader.readAsDataURL(file);
    }
  }, [onCapture, handleAutoScan]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setScanResults(null);
    setIngredientNames([]);
    setUploadMode(false);
  }, []);

  const handleProceed = useCallback(async () => {
    if (ingredientNames.length === 0) {
      alert("Please add some ingredients first!");
      return;
    }

    setGeminiResult("Loading...");
    
    try {
      const requestPath = `${API_BASE}/api/vision/generate-recipe-suggestion`;
      const resp = await api.post(requestPath, { ingredients: ingredientNames });
      const data = resp?.data || {};
      
      if (data.success && data.recipe) {
        setGeminiParsed({
          title: data.recipe.title || "AI Generated Recipe",
          ingredients: data.recipe.ingredients || [],
          steps: data.recipe.steps || []
        });
        setShowGeminiRecipe(true);
      } else {
        throw new Error("No recipe generated");
      }
    } catch (e) {
      console.error("Recipe generation failed:", e);
      setGeminiResult("Failed to get recipe suggestion. Please try again.");
    }
  }, [ingredientNames]);

  // All useEffect hooks
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPreview(null);
      setScanResults(null);
      setScanning(false);
      setIngredientNames([]);
      setGeminiResult(null);
      setShowGeminiRecipe(false);
      setGeminiParsed({ title: "", ingredients: [], steps: [] });
      setNewIngredient("");
      setUploadMode(false);
    }
  }, [isOpen]);

  // Early return after all hooks
  if (!isOpen) return null;

  // Render overlay boxes on preview image
  const renderBoxes = () => {
    if (!scanResults || !imgRef.current) return null;
    const imgW = imgRef.current.naturalWidth || imgRef.current.width;
    const imgH = imgRef.current.naturalHeight || imgRef.current.height;

    return scanResults.map((it, idx) => {
      const box = it.box;
      if (!box) {
        return (
          <div key={idx} style={{
            position: "absolute",
            bottom: 8 + (idx * 24),
            left: 8,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 6,
            fontSize: 12
          }}>{getBilingualIngredientLabel(it.label || "unknown")}</div>
        );
      }

      let left, top, width, height;
      if (Math.abs(box.x) <= 1 && Math.abs(box.y) <= 1 && Math.abs(box.w) <= 1 && Math.abs(box.h) <= 1) {
        left = `${box.x * 100}%`;
        top = `${box.y * 100}%`;
        width = `${box.w * 100}%`;
        height = `${box.h * 100}%`;
      } else {
        left = `${(box.x / imgW) * 100}%`;
        top = `${(box.y / imgH) * 100}%`;
        width = `${(box.w / imgW) * 100}%`;
        height = `${(box.h / imgH) * 100}%`;
      }

      return (
        <div key={idx} style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          border: "2px solid rgba(207,153,108,0.95)",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: "-20px",
            background: "rgba(207,153,108,0.95)",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 6,
            fontSize: 12,
            whiteSpace: "nowrap"
          }}>
            {getBilingualIngredientLabel(it.label || (it.raw && it.raw.name) || "item")}
            {it.probability ? ` ${(Math.round(it.probability * 100))}%` : ""}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="camera-modal-overlay" onClick={onClose}>
      <div className="camera-modal-main" onClick={e => e.stopPropagation()}>
        {showGeminiRecipe ? (
          <GeminiRecipeSuggestion
            title={geminiParsed.title}
            ingredients={geminiParsed.ingredients}
            steps={geminiParsed.steps}
            onBack={() => setShowGeminiRecipe(false)}
          />
        ) : (
          <>
            {!preview ? (
              <div className="camera-modal-capture-section">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                  }}
                  className="camera-modal-webcam"
                />
                
                {/* Upload option */}
                <div className="camera-modal-upload-section">
                  <p>Or upload an image:</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUploadWithScan}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="camera-modal-btn upload"
                  >
                    <Upload size={16} aria-hidden="true" />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%" }}>
                <img
                  ref={imgRef}
                  src={preview}
                  alt="preview"
                  className="camera-modal-preview-img"
                />
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  {renderBoxes()}
                </div>
                
                {/* Scanning indicator */}
                {scanning && (
                  <div className="scanning-overlay">
                    <div className="scanning-spinner"></div>
                    <p>AI is analyzing your ingredients...</p>
                  </div>
                )}
              </div>
            )}

            <div className="camera-modal-btn-row">
              {!preview ? (
                <button
                  onClick={captureWithScan}
                  disabled={scanning}
                  className="camera-modal-btn capture"
                >
                  <Camera size={16} aria-hidden="true" />
                  <span>Capture & Scan</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    className="camera-modal-btn retake"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    <span>Retake</span>
                  </button>
                  <button
                    onClick={() => handleAutoScan(preview)}
                    className="camera-modal-btn rescan"
                    disabled={scanning}
                  >
                    <Search size={16} aria-hidden="true" />
                    <span>{scanning ? "Scanning..." : "Rescan"}</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="camera-modal-btn close"
              >
                <X size={16} aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>

            {/* Ingredients editing section */}
            <div className="camera-modal-ingredients-edit">
              <strong>
                <Salad size={17} aria-hidden="true" />
                <span>Detected Ingredients {scanning && "(Analyzing...)"}</span>
              </strong>
              {ingredientNames.length === 0 && !scanning ? (
                <div style={{color:'#888',padding:'8px 0'}}>
                  {preview ? "No ingredients detected. Try rescanning or add manually." : "Take a photo or upload an image to detect ingredients."}
                </div>
              ) : (
                <ul>
                  {ingredientNames.map((name, i) => (
                    <li key={i}>
                      <div className="ingredient-input-group">
                        <input
                          type="text"
                          value={name}
                          onChange={e => {
                            const newNames = [...ingredientNames];
                            newNames[i] = e.target.value;
                            setIngredientNames(newNames);
                          }}
                        />
                        {getTagalogIngredientName(name) && (
                          <div className="ingredient-translation">
                            Tagalog: {getTagalogIngredientName(name)}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="remove-ingredient-btn"
                        onClick={() => {
                          const newNames = ingredientNames.filter((_, idx) => idx !== i);
                          setIngredientNames(newNames);
                        }}
                        aria-label="Remove ingredient"
                        title="Remove"
                      >×</button>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Add ingredient manually */}
              <div className="add-ingredient-section">
                <input
                  type="text"
                  placeholder="Add ingredient manually"
                  value={newIngredient}
                  onChange={e => setNewIngredient(e.target.value)}
                  className="add-ingredient-input"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newIngredient.trim()) {
                      setIngredientNames([...ingredientNames, newIngredient.trim()]);
                      setNewIngredient("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="camera-modal-btn add"
                  onClick={() => {
                    if (newIngredient.trim()) {
                      setIngredientNames([...ingredientNames, newIngredient.trim()]);
                      setNewIngredient("");
                    }
                  }}
                  disabled={!newIngredient.trim()}
                >
                  <Plus size={15} aria-hidden="true" />
                  <span>Add</span>
                </button>
              </div>
              
              {/* Proceed button */}
              <button
                onClick={handleProceed}
                className="camera-modal-btn proceed"
                disabled={ingredientNames.length === 0}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>Generate Recipe with AI</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraModal;