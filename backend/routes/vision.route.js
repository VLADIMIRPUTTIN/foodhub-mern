import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";

dotenv.config();

const router = express.Router();
const MIN_ROBOFLOW_CONFIDENCE = Number(process.env.ROBOFLOW_MIN_CONFIDENCE || 0.7);
const GEMINI_VERIFY_THRESHOLD = Number(process.env.GEMINI_VERIFY_THRESHOLD || 0.75);

// Setup Google Gemini API with better error handling
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini API initialized successfully");
  } else {
    console.warn("GEMINI_API_KEY not found in environment variables");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
}

// Helper function to strip data URL prefix
function stripDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
}

function normalizeIngredientLabel(label) {
  if (!label) return "ingredient";

  return String(label)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function canonicalizeIngredientLabel(label) {
  const normalized = normalizeIngredientLabel(label);

  if (/eggplant|aubergine|brinjal|talong/.test(normalized)) return "eggplant";
  if (/chili|chilli|pepper|sili/.test(normalized)) return "chili pepper";
  if (/tomato|kamatis/.test(normalized)) return "tomato";
  if (/onion|sibuyas/.test(normalized)) return "onion";
  if (/garlic|bawang/.test(normalized)) return "garlic";
  if (/potato|patatas/.test(normalized)) return "potato";
  if (/carrot|karot/.test(normalized)) return "carrot";

  return normalized;
}

function toDisplayIngredientLabel(label) {
  return canonicalizeIngredientLabel(label);
}

function labelsLikelyMatch(labelA, labelB) {
  const a = canonicalizeIngredientLabel(labelA);
  const b = canonicalizeIngredientLabel(labelB);

  if (!a || !b) return false;
  if (a === b) return true;

  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  const overlap = [...tokensA].filter(token => tokensB.has(token)).length;

  return overlap > 0;
}

function shouldGeminiVerify(topDetection) {
  if (!topDetection) return false;

  const label = normalizeIngredientLabel(topDetection.label);
  const confidence = Number(topDetection.probability || 0);

  if (confidence < 0.9) return true;
  if (/unknown|ingredient|khursani/.test(label)) return true;

  return false;
}

function shouldGeminiAssist(result) {
  if (!result?.success || !Array.isArray(result.segmentation) || result.segmentation.length === 0) {
    return false;
  }

  const hasLowConfidence = result.segmentation.some(item => Number(item?.probability || 0) < 0.88);
  const hasSuspiciousLabel = result.segmentation.some(item =>
    /unknown|ingredient|khursani/.test(normalizeIngredientLabel(item?.label))
  );

  // If we only got very few ingredients, Gemini can help fill likely misses.
  return hasLowConfidence || hasSuspiciousLabel || result.segmentation.length <= 2;
}

function toSegmentationFromGeminiCandidates(candidates, provider = "gemini-recovery") {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  return candidates.map(item => ({
    label: toDisplayIngredientLabel(item.name),
    probability: Number(item.confidence || 0),
    box: null,
    raw: {
      source: provider,
      geminiVerification: item
    }
  }));
}

async function getGeminiIngredientCandidates(base64Image) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
    Analyze this image and identify visible FOOD INGREDIENTS only.
    Return only JSON in this exact format:
    {
      "top": {"name":"ingredient name", "confidence":0.0},
      "ingredients": [
        {"name":"ingredient name", "confidence":0.0}
      ]
    }

    Rules:
    - Use common ingredient name in English.
    - confidence must be between 0 and 1
    - Include 1 to 12 ingredients in "ingredients"
    - Sort ingredients by confidence (highest first)
    - No explanation, JSON only.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const parseCandidate = fencedJson?.[1] || text;
    const firstBrace = parseCandidate.indexOf("{");
    const lastBrace = parseCandidate.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

    const parsed = JSON.parse(parseCandidate.slice(firstBrace, lastBrace + 1));
    const topName = toDisplayIngredientLabel(parsed?.top?.name || "");
    const topConfidence = Number(parsed?.top?.confidence || 0);

    const ingredients = Array.isArray(parsed?.ingredients)
      ? parsed.ingredients
          .map(item => ({
            name: toDisplayIngredientLabel(item?.name || ""),
            confidence: Number(item?.confidence || 0)
          }))
          .filter(item => item.name && !Number.isNaN(item.confidence))
      : [];

    if (topName && !Number.isNaN(topConfidence)) {
      const topExists = ingredients.some(item => labelsLikelyMatch(item.name, topName));
      if (!topExists) {
        ingredients.unshift({ name: topName, confidence: topConfidence });
      }
    }

    if (ingredients.length === 0) return null;

    return ingredients
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 12);
  } catch (error) {
    console.warn("Gemini verification failed:", error.message);
    return null;
  }
}

async function refineRoboflowWithGemini(base64Image, result) {
  if (!result?.success || !Array.isArray(result.segmentation) || result.segmentation.length === 0) {
    return result;
  }

  if (!shouldGeminiAssist(result)) {
    return result;
  }

  const topIndex = result.segmentation.reduce((bestIdx, item, idx, arr) =>
    (arr[bestIdx]?.probability || 0) >= (item.probability || 0) ? bestIdx : idx
  , 0);

  const topDetection = result.segmentation[topIndex];
  const shouldVerifyTop = shouldGeminiVerify(topDetection);
  const geminiCandidates = await getGeminiIngredientCandidates(base64Image);

  if (!geminiCandidates || geminiCandidates.length === 0) {
    return result;
  }

  const geminiTop = geminiCandidates[0];

  let updatedSegmentation = [...result.segmentation];
  let changed = false;

  if (
    shouldVerifyTop &&
    geminiTop?.confidence >= GEMINI_VERIFY_THRESHOLD &&
    !labelsLikelyMatch(topDetection.label, geminiTop.name)
  ) {
    const correctedLabel = normalizeIngredientLabel(geminiTop.name);
    updatedSegmentation[topIndex] = {
      ...updatedSegmentation[topIndex],
      label: correctedLabel,
      probability: Math.max(updatedSegmentation[topIndex].probability || 0, geminiTop.confidence),
      raw: {
        ...updatedSegmentation[topIndex].raw,
        geminiVerification: geminiTop
      }
    };
    changed = true;

    console.log(
      `Gemini corrected top detection from "${topDetection.label}" to "${correctedLabel}" ` +
      `(rf=${topDetection.probability}, gemini=${geminiTop.confidence})`
    );
  }

  const currentLabels = updatedSegmentation.map(item => item.label);
  const missingHighConfidenceGemini = geminiCandidates
    .filter(item => item.confidence >= GEMINI_VERIFY_THRESHOLD)
    .filter(item => !currentLabels.some(existing => labelsLikelyMatch(existing, item.name)))
    .slice(0, 3)
    .map(item => ({
      label: toDisplayIngredientLabel(item.name),
      probability: item.confidence,
      box: null,
      raw: {
        source: "gemini-assist",
        geminiVerification: item
      }
    }));

  if (missingHighConfidenceGemini.length > 0) {
    updatedSegmentation = [...updatedSegmentation, ...missingHighConfidenceGemini];
    changed = true;
    console.log(
      `Gemini added ${missingHighConfidenceGemini.length} missing ingredient(s): ` +
      `${missingHighConfidenceGemini.map(item => item.label).join(", ")}`
    );
  }

  if (!changed) {
    return result;
  }

  return {
    ...result,
    segmentation: updatedSegmentation,
    provider: `${result.provider}+gemini-assisted`,
    count: updatedSegmentation.length,
    note: "Roboflow detection refined and enriched with Gemini verification"
  };
}

// Enhanced Roboflow detection with multiple methods
router.post("/detect-and-suggest", async (req, res) => {
  try {
    let { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ 
        success: false, 
        message: "imageBase64 required" 
      });
    }

    // Extract base64 data
    const rawBase64 = stripDataUrl(imageBase64);
    if (!rawBase64) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid imageBase64 format" 
      });
    }

    // Check if Roboflow is configured
    if (!process.env.ROBOFLOW_API_KEY) {
      console.warn("Roboflow not configured - using Gemini fallback");
      return await handleGeminiFallback(rawBase64, res);
    }

    const rfKey = process.env.ROBOFLOW_API_KEY;
    const rfProject = process.env.ROBOFLOW_PROJECT;
    const rfVersion = process.env.ROBOFLOW_MODEL_VERSION || "1";

    console.log("Starting enhanced Roboflow detection...");

    // Method 1: Try the standard detect.roboflow.com API
    const detectResults = await tryRoboflowDetect(rawBase64, rfProject, rfVersion, rfKey);
    
    if (detectResults.success) {
      console.log("Roboflow detect successful");
      const refined = await refineRoboflowWithGemini(rawBase64, detectResults);
      return res.json(refined);
    }

    // Method 2: Try the infer.roboflow.com API (alternative endpoint)
    const inferResults = await tryRoboflowInfer(rawBase64, rfProject, rfVersion, rfKey);
    
    if (inferResults.success) {
      console.log("Roboflow infer successful");
      const refined = await refineRoboflowWithGemini(rawBase64, inferResults);
      return res.json(refined);
    }

    // Method 3: Try upload with hosted model URL
    const hostedResults = await tryRoboflowHosted(rawBase64, rfProject, rfVersion, rfKey);
    
    if (hostedResults.success) {
      console.log("Roboflow hosted successful");
      const refined = await refineRoboflowWithGemini(rawBase64, hostedResults);
      return res.json(refined);
    }

    // Fallback to Gemini if all Roboflow methods fail
    console.warn("All Roboflow methods failed, falling back to Gemini");
    return await handleGeminiFallback(rawBase64, res);

  } catch (error) {
    console.error("detect-and-suggest error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Method 1: Standard Roboflow Detect API
async function tryRoboflowDetect(base64Image, project, version, apiKey) {
  try {
    const detectUrl = `https://detect.roboflow.com/${project}/${version}?api_key=${apiKey}&format=json`;
    
    console.log("Trying Roboflow detect URL:", detectUrl);

    const response = await axios({
      method: 'POST',
      url: detectUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: base64Image,
      timeout: 30000,
      validateStatus: () => true
    });

    console.log("Roboflow detect response status:", response.status);
    console.log("Roboflow detect response:", JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300 && response.data) {
      return processRoboflowResponse(response.data, 'detect');
    }

    return { success: false, error: `Status ${response.status}` };
  } catch (error) {
    console.error("Roboflow detect error:", error.message);
    return { success: false, error: error.message };
  }
}

// Method 2: Roboflow Infer API
async function tryRoboflowInfer(base64Image, project, version, apiKey) {
  try {
    const inferUrl = `https://infer.roboflow.com/${project}/${version}?api_key=${apiKey}`;
    
    console.log("Trying Roboflow infer URL:", inferUrl);

    const imageBuffer = Buffer.from(base64Image, "base64");
    const form = new FormData();
    form.append("file", imageBuffer, { 
      filename: "image.jpg", 
      contentType: "image/jpeg" 
    });

    const response = await axios.post(inferUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000,
      validateStatus: () => true
    });

    console.log("Roboflow infer response status:", response.status);
    console.log("Roboflow infer response:", JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300 && response.data) {
      return processRoboflowResponse(response.data, 'infer');
    }

    return { success: false, error: `Status ${response.status}` };
  } catch (error) {
    console.error("Roboflow infer error:", error.message);
    return { success: false, error: error.message };
  }
}

// Method 3: Roboflow Hosted Model
async function tryRoboflowHosted(base64Image, project, version, apiKey) {
  try {
    const hostedUrl = `https://api.roboflow.com/v1/detect/${project}/${version}?api_key=${apiKey}`;
    
    console.log("Trying Roboflow hosted URL:", hostedUrl);

    const response = await axios({
      method: 'POST',
      url: hostedUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        image: `data:image/jpeg;base64,${base64Image}`
      },
      timeout: 30000,
      validateStatus: () => true
    });

    console.log("Roboflow hosted response status:", response.status);
    console.log("Roboflow hosted response:", JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300 && response.data) {
      return processRoboflowResponse(response.data, 'hosted');
    }

    return { success: false, error: `Status ${response.status}` };
  } catch (error) {
    console.error("Roboflow hosted error:", error.message);
    return { success: false, error: error.message };
  }
}

// Process Roboflow response into consistent format
function processRoboflowResponse(data, method) {
  try {
    let items = [];
    const imageWidth = data.image?.width || data.image_width || 640;
    const imageHeight = data.image?.height || data.image_height || 640;
    
    // Handle different response formats
    if (Array.isArray(data.predictions)) {
      items = data.predictions.map(p => ({
        label: toDisplayIngredientLabel(p.class || p.label || p.name || "ingredient"),
        probability: p.confidence || p.conf || p.score || 0.5,
        box: Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.width) && Number.isFinite(p.height) ? {
          x: (p.x - (p.width / 2)) / imageWidth,
          y: (p.y - (p.height / 2)) / imageHeight,
          w: p.width / imageWidth,
          h: p.height / imageHeight
        } : null,
        raw: p
      }));
    } else if (Array.isArray(data.detections)) {
      items = data.detections.map(d => ({
        label: toDisplayIngredientLabel(d.class || d.label || d.name || "ingredient"),
        probability: d.confidence || d.conf || d.score || 0.5,
        box: Array.isArray(d.bbox) && d.bbox.length >= 4 ? {
          x: d.bbox[0] / imageWidth,
          y: d.bbox[1] / imageHeight,
          w: d.bbox[2] / imageWidth,
          h: d.bbox[3] / imageHeight
        } : d.bbox && Number.isFinite(d.bbox.x) && Number.isFinite(d.bbox.y) && Number.isFinite(d.bbox.w) && Number.isFinite(d.bbox.h) ? {
          x: d.bbox.x / imageWidth,
          y: d.bbox.y / imageHeight,
          w: d.bbox.w / imageWidth,
          h: d.bbox.h / imageHeight
        } : null,
        raw: d
      }));
    } else if (data.predicted_classes) {
      // Classification format
      items = data.predicted_classes.map(cls => ({
        label: toDisplayIngredientLabel(typeof cls === "string" ? cls : cls.class || cls.name || "ingredient"),
        probability: typeof cls === "string" ? 0.5 : cls.confidence || cls.conf || cls.score || 0.5,
        box: null,
        raw: cls
      }));
    }

    const beforeFilter = [...items];

    // Filter out low-confidence detections to reduce obvious misclassifications.
    items = items.filter(item => item.probability >= MIN_ROBOFLOW_CONFIDENCE);

    // If strict threshold removes everything but Roboflow returned predictions,
    // keep the strongest candidates at a softer floor instead of returning empty.
    if (items.length === 0 && beforeFilter.length > 0) {
      const relaxedFloor = Math.max(0.35, MIN_ROBOFLOW_CONFIDENCE - 0.25);
      items = beforeFilter
        .filter(item => item.probability >= relaxedFloor)
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);

      if (items.length > 0) {
        console.warn(
          `Roboflow ${method} used relaxed threshold ${relaxedFloor} ` +
          `from strict ${MIN_ROBOFLOW_CONFIDENCE}`
        );
      }
    }

    // Deduplicate by label and keep the highest-confidence detection
    const bestByLabel = new Map();
    for (const item of items) {
      const current = bestByLabel.get(item.label);
      if (!current || item.probability > current.probability) {
        bestByLabel.set(item.label, item);
      }
    }
    items = Array.from(bestByLabel.values());

    if (items.length === 0) {
      return {
        success: false,
        error: `No detections above confidence threshold (${MIN_ROBOFLOW_CONFIDENCE})`,
        provider: `roboflow-${method}`,
      };
    }

    const segmentation = items.map(item => ({
      label: item.label,
      probability: item.probability,
      box: item.box,
      raw: item.raw
    }));

    console.log(`Processed ${items.length} ingredients from ${method} method`);

    return {
      success: true, 
      segmentation, 
      providerData: data,
      provider: `roboflow-${method}`,
      count: items.length
    };
  } catch (error) {
    console.error("Error processing Roboflow response:", error);
    return { success: false, error: error.message };
  }
}

// Enhanced Gemini Vision fallback with better ingredient detection
async function handleGeminiFallback(base64Image, res) {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "Both Roboflow and Gemini are not configured"
      });
    }

    console.log("Using enhanced Gemini Vision API for ingredient detection");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // image+text multimodal
    
    const prompt = `
    You are an expert food ingredient detector. Analyze this image very carefully and identify ALL visible food ingredients, cooking items, spices, vegetables, fruits, proteins, grains, and any edible items.

    Look for:
    - Fresh vegetables and fruits
    - Meat, fish, and proteins
    - Grains, rice, pasta, bread
    - Spices and seasonings
    - Dairy products
    - Canned or packaged foods
    - Cooking oils and sauces
    - Herbs and aromatics

    Return ONLY a JSON array in this exact format:
    [
      {"name": "tomato", "confidence": 0.95},
      {"name": "onion", "confidence": 0.90},
      {"name": "garlic", "confidence": 0.85}
    ]

    Be very specific with ingredient names. If you see multiple items, list them all. Only return the JSON array, nothing else.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini raw response:", text);

    // Enhanced JSON parsing
    let ingredients = [];
    try {
      // Try to extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        ingredients = parsed.filter(item => 
          item.name && 
          item.name.trim().length > 0 &&
          typeof item.confidence === 'number'
        );
      }
    } catch (parseError) {
      console.warn("Failed to parse Gemini JSON, using text extraction");
      
      // Enhanced text extraction
      const lines = text.split('\n');
      const ingredientWords = [];
      
      for (const line of lines) {
        // Look for ingredient names in quotes or after common patterns
        const matches = line.match(/["']([a-zA-Z\s]+)["']|(\b[a-zA-Z]{3,}\b)/g);
        if (matches) {
          matches.forEach(match => {
            const clean = match.replace(/['"]/g, '').trim().toLowerCase();
            if (clean.length > 2 && !clean.includes('name') && !clean.includes('confidence')) {
              ingredientWords.push(clean);
            }
          });
        }
      }
      
      // Convert to ingredient objects
      ingredients = [...new Set(ingredientWords)].slice(0, 15).map(name => ({
        name: name,
        confidence: 0.7
      }));
    }

    // If still no ingredients, try one more extraction method
    if (ingredients.length === 0) {
      const commonIngredients = [
        'tomato', 'onion', 'garlic', 'rice', 'chicken', 'beef', 'pork', 
        'potato', 'carrot', 'bell pepper', 'ginger', 'soy sauce', 'oil',
        'salt', 'pepper', 'egg', 'flour', 'sugar', 'lettuce', 'cabbage'
      ];
      
      const textLower = text.toLowerCase();
      ingredients = commonIngredients
        .filter(ing => textLower.includes(ing))
        .slice(0, 8)
        .map(name => ({ name, confidence: 0.6 }));
    }

    const segmentation = ingredients.map(ing => ({
      label: toDisplayIngredientLabel(ing.name),
      probability: ing.confidence,
      box: null,
      raw: ing
    }));

    console.log(`Gemini detected ${ingredients.length} ingredients:`, ingredients.map(i => i.name));

    return res.json({
      success: true,
      segmentation,
      provider: 'gemini-enhanced',
      note: "Detected using enhanced Gemini Vision API",
      count: ingredients.length
    });

  } catch (geminiError) {
    console.error("Enhanced Gemini fallback error:", geminiError);

    // Recovery path: use lighter Gemini candidate extraction before giving up.
    try {
      const candidates = await getGeminiIngredientCandidates(base64Image);
      const segmentation = toSegmentationFromGeminiCandidates(candidates, "gemini-recovery");
      if (segmentation.length > 0) {
        return res.json({
          success: true,
          segmentation,
          provider: "gemini-recovery",
          note: "Recovered ingredient detection using Gemini assist mode.",
          count: segmentation.length
        });
      }
    } catch (recoveryError) {
      console.error("Gemini recovery detection error:", recoveryError);
    }
    
    // Last resort: return empty results but with success=true
    return res.json({
      success: true,
      segmentation: [],
      provider: 'fallback',
      note: "Could not detect ingredients (Roboflow + Gemini failed). Please add manually.",
      count: 0
    });
  }
}

// Generate recipe suggestions based on ingredients
router.post("/generate-recipe-suggestion", async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Ingredients array is required" 
      });
    }
    
    // Check if Gemini API is available
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured. Please add GEMINI_API_KEY to your environment variables."
      });
    }
    
    // Create the prompt for recipe generation
    const prompt = `
    You are a professional chef and recipe creator. Based on the following ingredients, create a delicious and practical recipe:

    Available Ingredients: ${ingredients.join(", ")}

    Please provide:
    1. A creative recipe name
    2. A complete ingredients list (including quantities and any additional ingredients needed)
    3. Step-by-step cooking instructions

    Format your response exactly like this:
    RECIPE NAME: [Name of the recipe]

    INGREDIENTS:
    - [ingredient 1 with quantity]
    - [ingredient 2 with quantity]
    - [etc...]

    INSTRUCTIONS:
    1. [First step]
    2. [Second step]
    3. [etc...]

    Make sure the recipe is practical and uses most of the detected ingredients. If some ingredients don't work well together, suggest the best combination and mention alternatives.
    `;
    
    try {
      // Generate content with Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      let title = "AI Generated Recipe";
      let ingredients_list = [];
      let steps = [];
      
      let currentSection = 'none';
      
      for (const line of lines) {
        if (line.startsWith('RECIPE NAME:')) {
          title = line.replace('RECIPE NAME:', '').trim();
        } else if (line.toUpperCase().includes('INGREDIENTS:')) {
          currentSection = 'ingredients';
        } else if (line.toUpperCase().includes('INSTRUCTIONS:')) {
          currentSection = 'instructions';
        } else if (currentSection === 'ingredients' && (line.startsWith('-') || line.startsWith('•'))) {
          ingredients_list.push(line.replace(/^[-•]\s*/, '').trim());
        } else if (currentSection === 'instructions' && /^\d+\./.test(line)) {
          steps.push(line.replace(/^\d+\.\s*/, '').trim());
        }
      }
      
      // Fallback parsing if structured format fails
      if (ingredients_list.length === 0 || steps.length === 0) {
        const titleMatch = text.match(/(?:recipe name|title):\s*(.+)/i);
        if (titleMatch) title = titleMatch[1].trim();
        
        const ingredientSection = text.match(/ingredients?:?\s*([\s\S]*?)(?:instructions?|steps?|method)/i);
        if (ingredientSection) {
          ingredients_list = ingredientSection[1]
            .split('\n')
            .map(line => line.replace(/^[-•*]\s*/, '').trim())
            .filter(line => line.length > 0);
        }
        
        const instructionSection = text.match(/(?:instructions?|steps?|method):?\s*([\s\S]*)/i);
        if (instructionSection) {
          steps = instructionSection[1]
            .split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 0);
        }
      }
      
      res.json({ 
        success: true, 
        recipe: {
          title,
          ingredients: ingredients_list,
          steps
        },
        rawResponse: text
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      
      // Provide a fallback response
      const fallbackRecipe = {
        title: `Simple Recipe with ${ingredients.slice(0, 3).join(", ")}`,
        ingredients: ingredients.map(ing => `1 portion ${ing}`),
        steps: [
          "Prepare all ingredients by washing and cutting as needed.",
          "Heat a pan or pot over medium heat.",
          "Add the main ingredients and cook according to their requirements.",
          "Season with salt, pepper, and any available spices.",
          "Cook until tender and flavors are well combined.",
          "Serve hot and enjoy your meal!"
        ]
      };
      
      res.json({
        success: true,
        recipe: fallbackRecipe,
        note: "Generated using fallback method due to AI service limitations."
      });
    }
  } catch (error) {
    console.error("Error generating recipe suggestion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate recipe suggestion",
      error: error.message 
    });
  }
});

// Enhanced generate cooking instructions route with AI-powered suggestions
router.post("/generate-cooking-instructions", async (req, res) => {
  try {
    const { recipeName, recipeInstructions, availableIngredients, missingIngredients } = req.body;
    
    console.log("Generating cooking instructions for:", recipeName);
    console.log("Available ingredients:", availableIngredients);
    console.log("Missing ingredients:", missingIngredients);
    
    if (!recipeName || !availableIngredients || !Array.isArray(availableIngredients)) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name and available ingredients are required" 
      });
    }
    
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured. Please add GEMINI_API_KEY to your environment variables."
      });
    }
    
    // Format ingredients properly
    const availableIngredientsText = availableIngredients
      .map(ing => {
        if (typeof ing === 'string') return ing;
        return `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing}`.trim();
      })
      .filter(ing => ing.length > 0)
      .join("\n- ");
    
    const missingIngredientsText = missingIngredients && missingIngredients.length > 0
      ? missingIngredients
          .map(ing => {
            if (typeof ing === 'string') return ing;
            return `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ing}`.trim();
          })
          .filter(ing => ing.length > 0)
          .join("\n- ")
      : "None - You have all ingredients!";
    
    const instructionsText = Array.isArray(recipeInstructions) 
      ? recipeInstructions.map((step, idx) => {
          if (typeof step === 'string') return `${idx + 1}. ${step}`;
          return `${idx + 1}. ${step.instruction || step.details || step}`;
        }).join("\n")
      : recipeInstructions || "No instructions provided";
    
    const prompt = `
You are an expert chef and cooking instructor. A home cook wants to make "${recipeName}" but is missing some ingredients.

ORIGINAL RECIPE INSTRUCTIONS:
${instructionsText}

INGREDIENTS THEY HAVE:
- ${availableIngredientsText}

INGREDIENTS THEY ARE MISSING:
- ${missingIngredientsText}

YOUR TASK:
Provide creative, practical, and detailed cooking suggestions based on what they have. Consider these scenarios:

1. If they have MOST key ingredients (80%+):
   - Adapt the original recipe with substitutions
   - Explain which missing ingredients can be omitted or substituted
   - Provide modified step-by-step instructions
   - Mention how the taste/texture might differ

2. If they have SOME key ingredients (50-80%):
   - Suggest a simplified version of the original recipe
   - OR suggest a completely different but related dish
   - Provide complete cooking instructions
   - Explain ingredient substitutions clearly

3. If they have FEW matching ingredients (<50%):
   - Suggest 2-3 completely different recipes they CAN make
   - Focus on simple, quick dishes using their available ingredients
   - Provide full recipes with ingredients they have
   - Be encouraging and creative

FORMAT YOUR RESPONSE:
Use clear sections with emojis for better readability:

🎯 **Assessment**: Brief analysis of what they can make

📋 **Recommended Recipe(s)**: Name(s) of suggested dish(es)

🥘 **What You'll Make**: Describe the final dish

📝 **Ingredients Needed** (from what you have):
- List only the ingredients from their available list
- Include amounts if important

👨‍🍳 **Step-by-Step Instructions**:
1. Clear, numbered steps
2. Include timing and temperatures
3. Mention techniques and tips

💡 **Tips & Substitutions**:
- Helpful advice
- Flavor enhancement ideas
- What to watch for

⚠️ **Missing Ingredients Impact**:
- What they're missing and why it matters
- Possible substitutes from their pantry

Be conversational, encouraging, and specific. Use metric measurements. Make them excited to cook!
    `;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("AI cooking suggestions generated successfully");
      
      res.json({ 
        success: true, 
        instructions: text,
        metadata: {
          availableCount: availableIngredients.length,
          missingCount: missingIngredients?.length || 0,
          recipeName: recipeName
        }
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      
      // Enhanced fallback response
      const availableCount = availableIngredients.length;
      const totalCount = availableCount + (missingIngredients?.length || 0);
      const availabilityPercent = totalCount > 0 ? (availableCount / totalCount) * 100 : 0;
      
      let fallbackResponse = `
🎯 **Assessment**
You have ${availableCount} out of ${totalCount} ingredients (${Math.round(availabilityPercent)}%).

📋 **What You Can Make**

Based on your available ingredients: ${availableIngredientsText.substring(0, 100)}...

Here are some general suggestions:

👨‍🍳 **Cooking Approach**

1. **Assess your ingredients**: Look at what proteins, vegetables, and seasonings you have
2. **Choose a cooking method**: 
   - Stir-fry for quick meals with vegetables
   - Simmer for soups and stews
   - Roast for deeper flavors
3. **Build layers of flavor**: Start with aromatics like onions and garlic if available
4. **Season progressively**: Taste and adjust as you cook
5. **Finish strong**: Add fresh herbs or a splash of acid (lemon, vinegar) at the end

💡 **Tips**
- Use what you have creatively
- Don't be afraid to experiment
- Simple dishes can be delicious
- Trust your instincts

Missing ingredients from "${recipeName}": ${missingIngredientsText}

Consider checking your pantry for common substitutes!
      `;
      
      res.json({
        success: true,
        instructions: fallbackResponse,
        isFallback: true,
        metadata: {
          availableCount: availableIngredients.length,
          missingCount: missingIngredients?.length || 0,
          recipeName: recipeName,
          availabilityPercent: Math.round(availabilityPercent)
        }
      });
    }
  } catch (error) {
    console.error("Error generating cooking instructions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate cooking instructions",
      error: error.message 
    });
  }
});

// Update the suggest-ingredients route to search existing ingredients
router.post("/suggest-ingredients", async (req, res) => {
  try {
    console.log("Ingredient suggestion request received for:", req.body.recipeName);
    const { recipeName, category, description } = req.body;
    
    if (!recipeName) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name is required" 
      });
    }
    
    // First get keywords from the recipe
    const keywords = extractKeywords(recipeName, category, description);
    console.log("Extracted keywords:", keywords);
    
    // Search the ingredient database for matching ingredients
    const matchedIngredients = await searchIngredientsInDatabase(keywords);
    console.log(`Found ${matchedIngredients.length} matching ingredients in database`);
    
    if (matchedIngredients.length >= 3) {
      // If we found enough ingredients, use them
      const formattedIngredients = formatIngredientsWithUnits(matchedIngredients, recipeName, category);
      return res.json({
        success: true,
        ingredients: formattedIngredients,
        source: "database-search"
      });
    }
    
    // If we don't have enough ingredients from the database, use AI to fill in the gaps
    if (genAI) {
      try {
        // Generate content with Gemini using complete recipe context
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Include matched ingredients in the prompt to guide AI suggestions
        const existingIngredientsText = matchedIngredients.length > 0 
          ? `Include these ingredients that I already have: ${matchedIngredients.join(", ")}.` 
          : "";
        
        const prompt = `
        You are a professional chef creating a recipe for "${recipeName}".
        
        Recipe Category: ${category || "Main Course"}
        Recipe Description: ${description || ""}
        
        ${existingIngredientsText}
        
        Please create a realistic list of ingredients needed for this recipe.
        Include quantities and units where possible.
        
        Format your response as a JSON array of ingredient objects with "name", "amount", and "unit" properties:
        [
          {
            "name": "Ingredient name",
            "amount": "quantity",
            "unit": "unit of measure"
          }
        ]

        Only provide the JSON array, nothing else.
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Raw AI ingredients response:", text);
        
        // Parse the JSON from the response
        const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const ingredients = JSON.parse(jsonMatch[0]);
          
          // Validate ingredients format and ensure we include database matches
          if (Array.isArray(ingredients) && ingredients.length > 0) {
            // Ensure database matches are included
            const combinedIngredients = ensureDatabaseMatchesIncluded(ingredients, matchedIngredients);
            return res.json({
              success: true,
              ingredients: combinedIngredients,
              source: "database-and-ai"
            });
          }
        }
      } catch (aiError) {
        console.error("Error generating ingredients with AI:", aiError);
      }
    }
    
    // Use the fallback method if both database search and AI fail
    return await handleFallbackIngredients(recipeName, res, matchedIngredients);
    
  } catch (error) {
    console.error("Error in suggest-ingredients:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating ingredients",
      error: error.message
    });
  }
});

// Helper function to extract keywords from recipe info
function extractKeywords(name, category, description) {
  const keywords = [];
  
  // Extract words from recipe name
  if (name) {
    const nameWords = name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
    keywords.push(...nameWords);
  }
  
  // Add category as a keyword
  if (category && category.toLowerCase() !== 'main course') {
    keywords.push(category.toLowerCase());
  }
  
  // Extract main words from description
  if (description) {
    const descWords = description.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['with', 'and', 'the', 'for', 'this', 'that'].includes(word)
      );
    keywords.push(...descWords);
  }
  
  // Remove duplicates and return
  return [...new Set(keywords)];
}

// Search database for ingredients matching keywords
async function searchIngredientsInDatabase(keywords) {
  try {
    const { Ingredient } = await import('../models/ingredient.model.js');
    
    // Get all ingredients from the database
    const allIngredients = await Ingredient.find().lean();
    const matchedIngredients = [];
    
    // For each ingredient, check if it contains any keyword
    for (const ingredient of allIngredients) {
      const ingredientName = ingredient.name.toLowerCase();
      
      // Check if any keyword is in the ingredient name
      for (const keyword of keywords) {
        if (ingredientName.includes(keyword) || keyword.includes(ingredientName)) {
          matchedIngredients.push(ingredient.name);
          break;
        }
      }
      
      // Also add some common essential ingredients
      const essentials = ['salt', 'pepper', 'olive oil', 'onion', 'garlic'];
      if (essentials.includes(ingredientName) && Math.random() > 0.3) {
        matchedIngredients.push(ingredient.name);
      }
    }
    
    // Add some random ingredients if we don't have enough matches
    if (matchedIngredients.length < 3) {
      const randomIngredients = allIngredients
        .sort(() => 0.5 - Math.random())
        .slice(0, 5 - matchedIngredients.length)
        .map(ing => ing.name);
      
      matchedIngredients.push(...randomIngredients);
    }
    
    return [...new Set(matchedIngredients)]; // Remove duplicates
  } catch (error) {
    console.error("Error searching ingredients database:", error);
    return [];
  }
}

// Add units and amounts to ingredients from database
function formatIngredientsWithUnits(ingredientNames, recipeName, category) {
  const units = ['cups', 'tbsp', 'tsp', 'g', 'kg', 'ml', 'l', 'pieces'];
  
  return ingredientNames.map(name => {
    // Assign appropriate units based on ingredient type
    let unit = units[Math.floor(Math.random() * units.length)];
    let amount = "1";
    
    // Customize units based on ingredient type
    const nameLower = name.toLowerCase();
    if (nameLower.includes('salt') || nameLower.includes('pepper') || 
        nameLower.includes('spice') || nameLower.includes('powder')) {
      unit = Math.random() > 0.5 ? 'tsp' : 'tbsp';
      amount = Math.random() > 0.5 ? '1' : '1/2';
    } else if (nameLower.includes('water') || nameLower.includes('milk') || 
               nameLower.includes('juice') || nameLower.includes('broth')) {
      unit = Math.random() > 0.5 ? 'cups' : 'ml';
      amount = Math.random() > 0.5 ? '1' : '2';
    } else if (nameLower.includes('onion') || nameLower.includes('tomato') || 
               nameLower.includes('potato') || nameLower.includes('apple')) {
      unit = 'pieces';
      amount = '1';
    }
    
    return {
      name: name,
      amount: amount,
      unit: unit
    };
  });
}

// Ensure database matches are included in AI suggestions
function ensureDatabaseMatchesIncluded(aiIngredients, databaseMatches) {
  // First, map all AI ingredients to lowercase names for comparison
  const aiIngredientNames = aiIngredients.map(ing => ing.name.toLowerCase());
  
  // For each database match, check if it's already in AI ingredients
  for (const dbIngName of databaseMatches) {
    const dbNameLower = dbIngName.toLowerCase();
    
    // Check if this ingredient is already included in AI results
    const isIncluded = aiIngredientNames.some(aiName => 
      aiName.includes(dbNameLower) || dbNameLower.includes(aiName)
    );
    
    // If not included, add it
    if (!isIncluded) {
      const units = ['cups', 'tbsp', 'tsp', 'pieces'];
      aiIngredients.push({
        name: dbIngName,
        amount: "1",
        unit: units[Math.floor(Math.random() * units.length)]
      });
    }
  }
  
  return aiIngredients;
}

// Update the handleFallbackIngredients function to include database matches
async function handleFallbackIngredients(recipeName, res, matchedIngredients = []) {
  try {
    // Get default ingredients
    let ingredients = await getDefaultIngredients(recipeName);
    
    // Add any database matches that aren't already included
    for (const matchName of matchedIngredients) {
      const matchNameLower = matchName.toLowerCase();
      const isIncluded = ingredients.some(ing => 
        ing.name.toLowerCase().includes(matchNameLower) || 
        matchNameLower.includes(ing.name.toLowerCase())
      );
      
      if (!isIncluded) {
        ingredients.push({
          name: matchName,
          amount: "1",
          unit: "tbsp"
        });
      }
    }
    
    console.log(`Using dynamic ingredients from system: ${ingredients.length} items`);
    
    return res.json({
      success: true,
      ingredients: ingredients,
      source: "system-database"
    });
  } catch (error) {
    console.error("Error in fallback ingredients:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating ingredients",
      error: error.message
    });
  }
}

// Update the suggest-steps endpoint handler to include description
router.post("/suggest-steps", async (req, res) => {
  try {
    console.log("Step suggestion request received for:", req.body.recipeName);
    const { recipeName, ingredients, category, description } = req.body;
    
    if (!recipeName) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name is required" 
      });
    }
    
    // Use handleFallbackSteps to generate steps, now including description
    return await handleFallbackSteps(recipeName, ingredients || [], category, description, res);
    
  } catch (error) {
    console.error("Error in suggest-steps:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating preparation steps",
      error: error.message
    });
  }
});

// Replace the generateGenericSteps function with this AI-powered version
async function generateGenericSteps(recipeName, ingredients, category, description = "") {
  try {
    // Check if Gemini AI is available
    if (!genAI) {
      console.log("Gemini AI not available, using minimal fallback for steps");
      return generateMinimalSteps(recipeName, ingredients);
    }

    // Process ingredients to get proper format
    const ingredientsList = ingredients.map(ing => 
      typeof ing === 'string' ? ing : ing.name
    );
    
    // Create a more focused prompt for step generation
    const prompt = `
    You are a professional chef creating a recipe for "${recipeName}".
    
    Recipe Category: ${category || "Main Course"}
    Recipe Description: ${description}
    
    INGREDIENTS:
    ${ingredientsList.map(ing => `- ${ing}`).join('\n')}
    
    Please create 4-8 detailed cooking steps that SPECIFICALLY use the ingredients listed above.
    Each step should:
    1. Mention specific ingredients from the list
    2. Include precise cooking techniques
    3. Specify cooking times and temperatures where appropriate
    4. Follow a logical preparation sequence
    
    Format your response as a JSON array of step objects with "instruction" and "details" properties:
    [
      {
        "instruction": "Short step name that mentions key ingredients",
        "details": "Detailed explanation including specific measurements, techniques, and timing"
      }
    ]

    IMPORTANT: Every step must reference at least one of the ingredients in the list. Do not add ingredients that are not in the list.
    Only provide the JSON array, nothing else.
    `;
    
    try {
      // Generate content with Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("Raw AI steps response:", text);
      
      // Parse the JSON from the response
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const steps = JSON.parse(jsonMatch[0]);
        
        // Validate steps format
        if (Array.isArray(steps) && steps.length > 0 && steps[0].instruction && steps[0].details) {
          console.log(`Generated ${steps.length} ingredient-focused AI steps for "${recipeName}"`);
          return steps;
        }
      }
      
      // If parsing failed or format is incorrect, try a different extraction approach
      console.log("JSON parsing failed, trying alternative extraction");
      return extractStepsFromText(text, recipeName, ingredients);
      
    } catch (aiError) {
      console.error("Error generating steps with AI:", aiError);
      return generateMinimalSteps(recipeName, ingredients);
    }
  } catch (error) {
    console.error("Error in step generation:", error);
    return generateMinimalSteps(recipeName, ingredients);
  }
}

// Helper function to extract steps from unstructured text
function extractStepsFromText(text, recipeName, ingredients) {
  const steps = [];
  const lines = text.split('\n');
  
  // Process ingredients to get a clean list of names
  const ingredientNames = ingredients.map(ing => 
    typeof ing === 'string' ? ing : ing.name
  );
  
  let currentInstruction = "";
  let currentDetails = "";
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if this line looks like a new step (has a number or step keyword)
    if (/^(\d+\.|\[\d+\]|Step \d+:)/i.test(trimmedLine)) {
      // If we have an existing instruction, save it
      if (currentInstruction) {
        steps.push({
          instruction: currentInstruction,
          details: currentDetails || `Prepare the ${ingredientNames.slice(0, 2).join(" and ")} for ${recipeName}`
        });
      }
      
      // Start a new instruction
      currentInstruction = trimmedLine.replace(/^(\d+\.|\[\d+\]|Step \d+:)\s*/i, "");
      currentDetails = "";
    } else if (currentInstruction) {
      // Add to existing details
      if (currentDetails) currentDetails += " ";
      currentDetails += trimmedLine;
    } else {
      // If no instruction yet, this might be the first one
      currentInstruction = trimmedLine;
    }
  }
  
  // Add the last step if exists
  if (currentInstruction) {
    steps.push({
      instruction: currentInstruction,
      details: currentDetails || `Complete this step using ${ingredientNames.slice(0, 2).join(" and ")} for ${recipeName}`
    });
  }
  
  // If we extracted steps but they don't reference ingredients, enhance them
  if (steps.length > 0) {
    steps.forEach((step, index) => {
      // Check if step already mentions ingredients
      const mentionsIngredient = ingredientNames.some(ing => 
        step.instruction.toLowerCase().includes(ing.toLowerCase()) ||
        step.details.toLowerCase().includes(ing.toLowerCase())
      );
      
      // If not, add references to ingredients
      if (!mentionsIngredient) {
        // Choose ingredients based on step position
        const relevantIngredients = ingredientNames.slice(
          Math.floor(index * ingredientNames.length / steps.length),
          Math.floor((index + 1) * ingredientNames.length / steps.length) + 1
        );
        
        if (relevantIngredients.length > 0) {
          step.details += ` Use ${relevantIngredients.join(", ")} for this step.`;
        }
      }
    });
  } else {
    // If we couldn't extract steps properly, generate minimal steps
    return generateMinimalSteps(recipeName, ingredients);
  }
  
  return steps;
}

// Simple fallback if AI is unavailable
function generateMinimalSteps(recipeName, ingredients) {
  // Get ingredients for reference
  const processedIngredients = ingredients.map(ing => 
    typeof ing === 'string' ? ing : ing.name
  );
  
  // Group ingredients by likely use
  const mainIngredients = processedIngredients.slice(0, 3).join(", ");
  const remainingIngredients = processedIngredients.slice(3).join(", ");
  
  // Create more specific steps based on ingredient types
  const hasProtein = processedIngredients.some(ing => 
    /chicken|beef|fish|pork|tofu|meat|shrimp|lamb/i.test(ing)
  );
  
  const hasVegetables = processedIngredients.some(ing =>
    /onion|garlic|carrot|potato|tomato|pepper|vegetable|broccoli|spinach|lettuce/i.test(ing)
  );
  
  const steps = [
    {
      instruction: "Prepare ingredients",
      details: `Gather all ingredients for ${recipeName}. Wash, peel, and chop ${mainIngredients} as needed.`
    }
  ];
  
  // Add protein preparation step if applicable
  if (hasProtein) {
    steps.push({
      instruction: "Prepare protein",
      details: `Season the protein ingredients (${processedIngredients.filter(ing => 
        /chicken|beef|fish|pork|tofu|meat|shrimp|lamb/i.test(ing)
      ).join(", ")}) with salt and pepper. Set aside while preparing other ingredients.`
    });
  }
  
  // Add vegetable preparation if applicable
  if (hasVegetables) {
    steps.push({
      instruction: "Prepare vegetables",
      details: `Chop and prepare ${processedIngredients.filter(ing => 
        /onion|garlic|carrot|potato|tomato|pepper|vegetable|broccoli|spinach|lettuce/i.test(ing)
      ).join(", ")}. Keep them separate as they may be added at different cooking stages.`
    });
  }
  
  // Main cooking step
  steps.push({
    instruction: "Cook main ingredients",
    details: `Heat cooking vessel over medium heat. ${hasProtein ? 'Add protein and cook until browned. ' : ''}Add ${mainIngredients} and cook for 5-7 minutes until tender.`
  });
  
  // Add remaining ingredients step if we have more than 3
  if (remainingIngredients) {
    steps.push({
      instruction: "Add remaining ingredients",
      details: `Add ${remainingIngredients} to the mixture. Stir well to combine all flavors.`
    });
  }
  
  // Final steps
  steps.push({
    instruction: "Season and finish",
    details: `Season ${recipeName} with additional spices from the ingredient list if available. Adjust taste as needed.`
  });
  
  steps.push({
    instruction: "Serve",
    details: `Plate your ${recipeName} and serve while hot. Garnish with any remaining fresh ingredients from the list.`
  });
  
  return steps;
}

// Update the handleFallbackSteps function to use the async version
async function handleFallbackSteps(recipeName, ingredients, category, description, res) {
  try {
    // Generate steps based on recipe name, ingredients, and description
    const steps = await generateGenericSteps(recipeName, ingredients, category, description);
    
    console.log(`Generated ${steps.length} steps for "${recipeName}"`);
    
    return res.json({
      success: true,
      steps: steps,
      source: "ai-generated"
    });
  } catch (error) {
    console.error("Error generating steps:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating steps",
      error: error.message
    });
  }
}

// Add this new endpoint to fetch recipes from API Ninjas
router.post("/fetch-ninjas-recipe", async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Recipe query is required"
      });
    }
    
    console.log(`Fetching API Ninjas recipe for: ${query}`);
    
    // Use environment variable instead of hardcoded API key
    const apiKey = process.env.API_NINJAS_KEY || 'L03pvjV25sI419QlCrWheg==nBVi4RhtQY48lw14';
    
    // Make the request to API Ninjas
    const response = await axios.get(
      `https://api.api-ninjas.com/v1/recipe?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-Api-Key': apiKey
        },
        timeout: 10000
      }
    );
    
    // Return the data
    return res.json({
      success: true,
      recipes: response.data
    });
    
  } catch (error) {
    console.error("Error fetching from API Ninjas:", error);
    
    // Provide detailed error information
    return res.status(500).json({
      success: false,
      message: "Error fetching recipe data from API Ninjas",
      error: error.message,
      details: error.response?.data || "No additional details"
    });
  }
});

export default router;