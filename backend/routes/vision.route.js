import express from "express";
import axios from "axios";
import FormData from "form-data";
import { Ingredient } from "../models/ingredient.model.js";
import cloudinary from "../utils/cloudinary.js";

const router = express.Router();

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

function stripDataUrl(dataUrlOrBase64) {
  if (!dataUrlOrBase64) return null;
  const comma = dataUrlOrBase64.indexOf(",");
  return comma === -1 ? dataUrlOrBase64 : dataUrlOrBase64.slice(comma + 1);
}

// Upload ingredient image and create Ingredient record
router.post("/upload-ingredient", async (req, res) => {
  try {
    const { name, imageBase64 } = req.body;
    if (!name || !imageBase64) return res.status(400).json({ success: false, message: "Name and imageBase64 required" });

    const result = await cloudinary.uploader.upload(imageBase64, { folder: "foodhub/ingredients" });
    const ingredient = new Ingredient({ name: name.trim(), imageUrl: result.secure_url });
    await ingredient.save();

    res.status(201).json({ success: true, ingredient });
  } catch (error) {
    console.error("Upload ingredient error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
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

export default router;