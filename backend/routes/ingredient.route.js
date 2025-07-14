import express from "express";
import { createIngredient, getAllIngredients, searchIngredients } from "../controllers/ingredient.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { Ingredient } from "../models/ingredient.model.js";

const router = express.Router();

router.post("/", verifyToken, createIngredient);
router.get("/", getAllIngredients);
router.get("/search", searchIngredients); // Add search endpoint
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        await Ingredient.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Ingredient deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;