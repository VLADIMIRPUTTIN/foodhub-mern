import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const router = express.Router();

// Setup Google Gemini API if the key exists
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Gemini API initialized successfully");
} else {
  console.warn("GEMINI_API_KEY not found in environment variables");
}

// Log Roboflow env at startup for easier debug
console.log('ROBOFLOW env:', {
  hasKey: !!process.env.ROBOFLOW_API_KEY,
  keyPreview: process.env.ROBOFLOW_API_KEY ? process.env.ROBOFLOW_API_KEY.slice(0, 6) + '...' : undefined,
  hasUrl: !!process.env.ROBOFLOW_URL,
  url: process.env.ROBOFLOW_URL,
  hasProject: !!process.env.ROBOFLOW_PROJECT,
  project: process.env.ROBOFLOW_PROJECT,
  modelVersion: process.env.ROBOFLOW_MODEL_VERSION || '1'
});

// Detect objects using configured image-recognition provider (Roboflow preferred)
router.post("/detect-and-suggest", async (req, res) => {
  try {
    let { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: "imageBase64 required" });

    // detect MIME type from data URL (if provided), default to jpeg
    const mimeMatch = (imageBase64 || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const rawBase64 = stripDataUrl(imageBase64);
    if (!rawBase64) return res.status(400).json({ success: false, message: "Invalid imageBase64" });

    // providerData will hold the recognition response
    let providerData = null;

    // Roboflow integration
    if (process.env.ROBOFLOW_API_KEY && (process.env.ROBOFLOW_URL || process.env.ROBOFLOW_PROJECT)) {
      const rfKey = process.env.ROBOFLOW_API_KEY;
      const rfProject = process.env.ROBOFLOW_PROJECT;
      const rfVersion = process.env.ROBOFLOW_MODEL_VERSION || "1";

      // Prefer explicit ROBOFLOW_URL, otherwise build serverless URL
      let rfUrl = process.env.ROBOFLOW_URL || `https://serverless.roboflow.com/${rfProject}/${rfVersion}`;
      // ensure api_key present
      rfUrl = rfUrl.includes("api_key=") ? rfUrl : (rfUrl.includes("?") ? `${rfUrl}&api_key=${rfKey}` : `${rfUrl}?api_key=${rfKey}`);

      console.log("Roboflow URL:", rfUrl);

      const imageBuffer = Buffer.from(rawBase64, "base64");

      // helper to pretty log headers
      const debugHeaders = (h) => console.log("-> Sending headers:", JSON.stringify(h));

      // Try serverless (raw binary) first
      try {
        const serverlessHeaders = {
          "Content-Type": mimeType,
          "Content-Length": imageBuffer.length,
          "Accept": "application/json"
        };
        debugHeaders(serverlessHeaders);

        const resp = await axios.post(rfUrl, imageBuffer, {
          headers: serverlessHeaders,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 45000,
          validateStatus: () => true
        });

        console.log("Roboflow serverless response status:", resp.status);
        console.log("Roboflow serverless response data:", resp.data);

        if (resp.status >= 200 && resp.status < 300) {
          providerData = resp.data || {};
        } else if (resp.status === 403) {
          console.error("Roboflow 403 — check ROBOFLOW_API_KEY (use Private API Key) and ROBOFLOW_URL", resp.data);
          return res.status(502).json({
            success: false,
            message: "Roboflow returned 403 Forbidden — check ROBOFLOW_API_KEY (use Private API Key) and ROBOFLOW_URL. Make sure you are using a PRIVATE API KEY from Roboflow dashboard.",
            detail: resp.data
          });
        } else {
          // inspect message to decide fallback
          const bodyMessage = (resp.data && (resp.data.message || resp.data.error || "")) || "";
          if (resp.status >= 400 && resp.status < 500 && (bodyMessage.toLowerCase().includes("content-type") || resp.status === 405 || resp.status === 415)) {
            console.warn("Serverless rejected request; falling back to detect.roboflow (multipart/form-data)");
            const detectUrl = process.env.ROBOFLOW_URL && process.env.ROBOFLOW_URL.includes("detect.roboflow")
              ? process.env.ROBOFLOW_URL
              : `https://detect.roboflow.com/${rfProject}/${rfVersion}?api_key=${rfKey}`;
            console.log("Roboflow detect URL:", detectUrl);

            const form = new FormData();
            form.append("file", imageBuffer, { filename: "image.jpg", contentType: mimeType });
            debugHeaders(form.getHeaders());

            const detectResp = await axios.post(detectUrl, form, {
              headers: { ...form.getHeaders() },
              maxContentLength: Infinity,
              maxBodyLength: Infinity,
              timeout: 45000,
              validateStatus: () => true
            });

            console.log("Roboflow detect response status:", detectResp.status);
            console.log("Roboflow detect response data:", detectResp.data);

            if (detectResp.status >= 200 && detectResp.status < 300) {
              providerData = detectResp.data || {};
            } else if (detectResp.status === 403) {
              console.error("Roboflow detect 403 — check API key permissions", detectResp.data);
              return res.status(502).json({
                success: false,
                message: "Roboflow detect returned 403 Forbidden — check API key permissions. Make sure you are using a PRIVATE API KEY from Roboflow dashboard.",
                detail: detectResp.data
              });
            } else {
              return res.status(502).json({ success: false, message: "Roboflow returned error on both serverless and detect", detail: { serverless: resp.data, detect: detectResp.data } });
            }
          } else {
            return res.status(502).json({ success: false, message: "Roboflow serverless returned error", detail: resp.data });
          }
        }
      } catch (err) {
        console.error("Roboflow recognition request failed (exception):", err?.response?.data || err?.message || err);
        return res.status(502).json({ success: false, message: "Image recognition request to Roboflow failed", detail: err?.response?.data || err?.message });
      }
    } else {
      // Better debug: tell which env vars are missing so it's easier to fix
      const missing = [];
      if (!process.env.ROBOFLOW_API_KEY) missing.push('ROBOFLOW_API_KEY');
      if (!process.env.ROBOFLOW_URL && !process.env.ROBOFLOW_PROJECT) missing.push('ROBOFLOW_URL|ROBOFLOW_PROJECT');
      console.error('Roboflow not configured. Missing env vars:', missing);
      return res.status(400).json({
        success: false,
        message: "Roboflow not configured on server",
        missing
      });
    }

    // 3) Normalize provider response into segmentation-like items
    // Support Roboflow shapes: predictions array with x,y,width,height,confidence,class or label/name
    let items = [];
    try {
      if (!providerData) providerData = {};
      if (Array.isArray(providerData.predictions)) {
        items = providerData.predictions.map(p => {
          // Roboflow often returns center x,y and width,height (pixels)
          const x = typeof p.x === "number" ? p.x : (p.bbox && p.bbox.x) || null;
          const y = typeof p.y === "number" ? p.y : (p.bbox && p.bbox.y) || null;
          const w = typeof p.width === "number" ? p.width : (p.bbox && p.bbox.width) || null;
          const h = typeof p.height === "number" ? p.height : (p.bbox && p.bbox.height) || null;

          let box = null;
          if (x != null && y != null && w != null && h != null) {
            // convert center -> top-left coordinates
            box = { x: x - (w / 2), y: y - (h / 2), w: w, h: h };
          } else if (p.bbox && typeof p.bbox.x_min === "number") {
            // alternative bbox shape
            box = { x: p.bbox.x_min, y: p.bbox.y_min, w: p.bbox.x_max - p.bbox.x_min, h: p.bbox.y_max - p.bbox.y_min };
          }

          return {
            label: p.class || p.label || p.name || (p.prediction && p.prediction.class) || "item",
            probability: (p.confidence || p.conf || p.score) ? Number(p.confidence || p.conf || p.score) : undefined,
            box,
            raw: p
          };
        });
      } else if (Array.isArray(providerData.results)) {
        // other possible shape
        items = providerData.results;
      } else if (Array.isArray(providerData.items)) {
        items = providerData.items;
      }
    } catch (e) {
      console.warn("Failed to normalize provider response:", e);
    }

    // Build segmentation array with { label, probability, box, raw }
    const segmentation = (items || []).map(item => ({
      label: item.label || (item.raw && item.raw.name) || "item",
      probability: item.probability,
      box: item.box || (item.raw && item.raw.bbox) || null,
      raw: item.raw || item
    }));

    return res.json({ success: true, segmentation, providerData });
  } catch (error) {
    console.error("detect-and-suggest error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal error" });
  }
});

// Add this route after your existing routes
router.post("/generate-cooking-instructions", verifyToken, async (req, res) => {
  try {
    const { recipeName, recipeInstructions, availableIngredients, missingIngredients } = req.body;
    
    if (!recipeName || !recipeInstructions || !availableIngredients) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required information" 
      });
    }
    
    // Check if Gemini API is available
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured. Please add GEMINI_API_KEY to your environment variables."
      });
    }
    
    // Convert recipe instructions to string if it's an array
    const instructionsText = Array.isArray(recipeInstructions) 
      ? recipeInstructions.join("\n") 
      : recipeInstructions;
    
    // Create the prompt for Gemini
    const prompt = `
    You are a helpful cooking assistant. I want to make "${recipeName}" but I'm missing some ingredients.

    The original recipe instructions are:
    ${instructionsText}
    
    Ingredients I HAVE:
    ${availableIngredients.join(", ")}
    
    Ingredients I DON'T HAVE:
    ${missingIngredients.join(", ")}
    
    Please help me adapt the recipe using only the ingredients I have. If it's not possible to make something similar, suggest alternative simple dishes I could make with my available ingredients. Make your response conversational and encouraging.
    `;
    
    try {
      // Generate content with Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ 
        success: true, 
        instructions: text 
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      
      // Provide a fallback response when the AI service fails
      const fallbackResponse = `
I see you're making ${recipeName}.

Here are some general tips for adapting recipes:

1. For missing ingredients, look for substitutes with similar properties:
   - Missing oil? Try butter or another type of oil
   - Missing an herb? Use a different herb or spice with a similar flavor profile
   - Missing a vegetable? Substitute with a similar textured vegetable

2. Focus on the cooking techniques:
   - Most recipes follow basic patterns (sauté, roast, steam, etc.)
   - You can often adapt the method to work with what you have

3. Simplify the recipe:
   - Many garnishes and secondary ingredients can be omitted
   - Focus on getting the core flavors right

4. Try a different cooking method:
   - If you can't make the exact dish, think about different ways to use your ingredients

Check the full recipe and see which steps you can still follow with your available ingredients!
      `;
      
      res.json({
        success: true,
        instructions: fallbackResponse
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

export default router;