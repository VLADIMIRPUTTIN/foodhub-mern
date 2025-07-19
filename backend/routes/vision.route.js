import express from "express";
import vision from "@google-cloud/vision";

const router = express.Router();
const client = new vision.ImageAnnotatorClient({
    keyFilename: "backend/foohub-459300-dc81b1fcaa38.json" // Use your actual key file
});

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
        // Filter only cookable food items
        const objects = result.localizedObjectAnnotations
            .filter(obj => COOKABLE_CLASSES.includes(obj.name.toLowerCase()))
            .map(obj => ({
                name: obj.name,
                score: obj.score
            }));

        res.json({ success: true, objects });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;