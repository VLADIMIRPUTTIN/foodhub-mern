import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import GeminiRecipeSuggestion from "./GeminiRecipeSuggestion";
import "./CameraModal.scss";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:5000" : "");

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const webcamRef = useRef(null);
  const imgRef = useRef(null);
  const [preview, setPreview] = useState(null); // dataUrl after capture
  const [scanResults, setScanResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [ingredientNames, setIngredientNames] = useState([]);
  const [geminiResult, setGeminiResult] = useState(null);
  const [showGeminiRecipe, setShowGeminiRecipe] = useState(false);
  const [geminiParsed, setGeminiParsed] = useState({ title: "", ingredients: [], steps: [] });
  const [newIngredient, setNewIngredient] = useState(""); // ADD THIS

  const capture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
      if (onCapture) onCapture(imageSrc);
    }
  }, [onCapture]);

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
      setIngredientNames([]); // <--- ADD THIS to reset detected ingredients
      setGeminiResult(null);  // <--- Optional: reset Gemini result
      setShowGeminiRecipe(false); // <--- Optional: reset recipe view
      setGeminiParsed({ title: "", ingredients: [], steps: [] }); // <--- Optional: reset parsed recipe
      setNewIngredient(""); // <--- Optional: reset add ingredient input
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // send image to server detect endpoint
  const handleScan = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setPreview(imageSrc);
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
      console.error("Scan failed", e);
      setScanResults([]);
    } finally {
      setScanning(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setScanResults(null);
  };

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

      // If coordinates look normalized (<=1), render in percentages
      let left, top, width, height;
      if (Math.abs(box.x) <= 1 && Math.abs(box.y) <= 1 && Math.abs(box.w) <= 1 && Math.abs(box.h) <= 1) {
        left = `${box.x * 100}%`;
        top = `${box.y * 100}%`;
        width = `${box.w * 100}%`;
        height = `${box.h * 100}%`;
      } else {
        // absolute pixel coords -> convert to percent
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

  async function handleProceed() {
    setGeminiResult("Loading...");
    try {
      const apiKey = "AIzaSyDGZT79Y2ixgLCL9sGAGf-eFIRNzPAiAVA";
      const prompt = `Suggest a recipe using only these ingredients: ${ingredientNames.join(", ")}. Give the recipe name and instructions.`;
      const resp = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Simple parsing logic
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      let title = lines[0];
      let ingStart = lines.findIndex(l => l.toLowerCase().includes("ingredient"));
      let stepStart = lines.findIndex(l => l.toLowerCase().includes("how to prepare") || l.toLowerCase().includes("instructions"));
      let ingredients = [];
      let steps = [];
      if (ingStart !== -1 && stepStart !== -1) {
        ingredients = lines.slice(ingStart + 1, stepStart).filter(l => l && !l.toLowerCase().includes("ingredient"));
        steps = lines.slice(stepStart + 1).filter(l => l && !l.toLowerCase().includes("how to prepare") && !l.toLowerCase().includes("instructions"));
      }
      setGeminiParsed({ title, ingredients, steps });
      setShowGeminiRecipe(true);
    } catch (e) {
      setGeminiResult("Failed to get recipe suggestion.");
    }
  }

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
              </div>
            )}

            <div className="camera-modal-btn-row">
              {!preview ? (
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="camera-modal-btn"
                >
                  {scanning ? "Scanning..." : "Scan"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleRetake}
                    className="camera-modal-btn retake"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => { if (onCapture) onCapture(preview); onClose(); }}
                    className="camera-modal-btn use-photo"
                  >
                    Use Photo
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="camera-modal-btn close"
              >
                Close
              </button>
            </div>

            <div className="camera-modal-ingredients-edit">
              <strong>Ingredients detected (edit if incorrect):</strong>
              {ingredientNames.length === 0 ? (
                <div style={{color:'#888',padding:'8px 0'}}>No ingredients detected.</div>
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
                        style={{
                          marginLeft: 4,
                          background: "#e26a00",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          cursor: "pointer"
                        }}
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
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Add ingredient"
                  value={newIngredient}
                  onChange={e => setNewIngredient(e.target.value)}
                  style={{
                    fontSize: "1.05rem",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    width: "70%",
                    marginRight: 4,
                    outline: "none"
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newIngredient.trim()) {
                      setIngredientNames([...ingredientNames, newIngredient.trim()]);
                      setNewIngredient("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="camera-modal-btn"
                  style={{ padding: "6px 12px", fontSize: "0.98rem", background: "#CF996C" }}
                  onClick={() => {
                    if (newIngredient.trim()) {
                      setIngredientNames([...ingredientNames, newIngredient.trim()]);
                      setNewIngredient("");
                    }
                  }}
                  disabled={!newIngredient.trim()}
                >
                  Add
                </button>
              </div>
              <button
                onClick={handleProceed}
                className="camera-modal-btn proceed"
                disabled={ingredientNames.length === 0}
              >
                Proceed
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraModal;