import express from "express";
import vision from "@google-cloud/vision";
import fs from "fs";
import Detection from '../models/Detection.js'; // create this model

const router = express.Router();

let client;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    // Load credentials from env variable
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    client = new vision.ImageAnnotatorClient({ credentials });
} else {
    // Fallback to file
    client = new vision.ImageAnnotatorClient({
        keyFilename: "backend/foohub-459300-dc81b1fcaa38.json" // Use your actual key file
    });
}

// List of food/cookable items to filter
const COOKABLE_CLASSES = [
    "broccoli", "carrot", "cucumber", "eggplant", "lettuce", "onion", "pepper", "potato", "tomato", "zucchini", "cabbage", "cauliflower", "garlic", "pumpkin", "radish", "spinach", "sweet potato",
    "chicken", "egg", "meat", "fish", "pork", "beef", "shrimp", "crab", "duck"
];

// POST /api/vision/detect
router.post("/detect", async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: "Image required" });

    try {
        const [result] = await client.objectLocalization({
            image: { content: imageBase64 }
        });
        // Log the full Vision API response for debugging
        console.log("Vision API result:", JSON.stringify(result, null, 2));
        // Filter only cookable food items
        const objects = result.localizedObjectAnnotations
            .filter(obj => COOKABLE_CLASSES.includes(obj.name.toLowerCase()))
            .map(obj => ({
                name: obj.name,
                score: obj.score
            }));

        res.json({ success: true, objects });
    } catch (error) {
        // Log the full error object, not just error.message
        console.error("Vision API error:", error);
        if (error.response) {
            console.error("Vision API error response:", error.response.data);
        }
        res.status(500).json({ success: false, message: error.message, error });
    }
});

router.post("/save-detection", async (req, res) => {
    const { imageBase64, objects, userId } = req.body;
    try {
        const detection = new Detection({
            user: userId,
            image: imageBase64,
            objects,
            detectedAt: new Date()
        });
        await detection.save();
        res.json({ success: true, detection });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;