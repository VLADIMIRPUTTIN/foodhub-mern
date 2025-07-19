import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/suggest-recipes", async (req, res) => {
    const { vegetables } = req.body;
    if (!vegetables || !Array.isArray(vegetables) || vegetables.length === 0) {
        return res.status(400).json({ success: false, message: "Vegetables required" });
    }

    const prompt = `Suggest Filipino recipes using these vegetables: ${vegetables.join(", ")}. For each recipe, give only the name and the 'How to Prepare' steps.`;

    try {
        const geminiRes = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": process.env.GEMINI_API_KEY
                }
            }
        );

        // Parse Gemini response
        const text = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        res.json({ success: true, suggestions: text });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/identify-vegetables", async (req, res) => {
    const { detectedObjects } = req.body; // array of all detected object names
    if (!detectedObjects || !Array.isArray(detectedObjects) || detectedObjects.length === 0) {
        return res.status(400).json({ success: false, message: "Detected objects required" });
    }

    const prompt = `From this list: ${detectedObjects.join(", ")}, which are vegetables? Please list only the vegetable names.`;

    try {
        const geminiRes = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": process.env.GEMINI_API_KEY
                }
            }
        );

        const text = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Parse Gemini's response to get vegetable names
        const vegetables = text.split(/,|\n/).map(v => v.trim()).filter(v => v);
        res.json({ success: true, vegetables });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;