import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import GeminiRecipeSuggestion from "./GeminiRecipeSuggestion";
import "./CameraModal.scss";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:5000" : "");

const CameraModal = ({ isOpen, onClose, onCapture }) => {
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
      const resp = await fetch(`${API_BASE}/api/vision/detect-and-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageSrc })
      });
      
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        console.error("Recognition request failed:", resp.status, txt);
        setScanResults([]);
        return;
      }
      
      const text = await resp.text();
      const data = text ? JSON.parse(text) : {};
      
      if (data && data.segmentation) {
        setScanResults(data.segmentation);
        setIngredientNames(data.segmentation.map(item => item.label));
      } else if (data && data.detected) {
        setScanResults(data.detected.map(d => ({ label: d, box: null })));
        setIngredientNames(data.detected);
      } else {
        setScanResults([]);
        setIngredientNames([]);
      }
    } catch (e) {
      console.error("Auto-scan failed", e);
      setScanResults([]);
    } finally {
      setScanning(false);
    }
  }, []);

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
      const resp = await fetch(`${API_BASE}/api/vision/generate-recipe-suggestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ingredients: ingredientNames 
        })
      });

      if (!resp.ok) {
        throw new Error("Failed to generate recipe");
      }

      const data = await resp.json();
      
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
          }}>{it.label || "unknown"}</div>
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
            {it.label || (it.raw && it.raw.name) || "item"}
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
                    📁 Upload Image
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
                  📸 Capture & Scan
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    className="camera-modal-btn retake"
                  >
                    🔄 Retake
                  </button>
                  <button
                    onClick={() => handleAutoScan(preview)}
                    className="camera-modal-btn rescan"
                    disabled={scanning}
                  >
                    {scanning ? "Scanning..." : "🔍 Rescan"}
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="camera-modal-btn close"
              >
                ✕ Close
              </button>
            </div>

            {/* Ingredients editing section */}
            <div className="camera-modal-ingredients-edit">
              <strong>🥗 Detected Ingredients {scanning && "(Analyzing...)"}</strong>
              {ingredientNames.length === 0 && !scanning ? (
                <div style={{color:'#888',padding:'8px 0'}}>
                  {preview ? "No ingredients detected. Try rescanning or add manually." : "Take a photo or upload an image to detect ingredients."}
                </div>
              ) : (
                <ul>
                  {ingredientNames.map((name, i) => (
                    <li key={i}>
                      <input
                        type="text"
                        value={name}
                        onChange={e => {
                          const newNames = [...ingredientNames];
                          newNames[i] = e.target.value;
                          setIngredientNames(newNames);
                        }}
                      />
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
                  ➕ Add
                </button>
              </div>
              
              {/* Proceed button */}
              <button
                onClick={handleProceed}
                className="camera-modal-btn proceed"
                disabled={ingredientNames.length === 0}
              >
                🤖 Generate Recipe with AI
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraModal;