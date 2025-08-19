import express from "express";
import { 
    createIngredient, 
    getAllIngredients, 
    searchIngredients, 
    updateIngredient,
    deleteIngredient // Add this import
} from "../controllers/ingredient.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, createIngredient);
router.get("/", getAllIngredients);
router.get("/search", searchIngredients);
router.put("/:id", verifyToken, updateIngredient);
router.delete("/:id", verifyToken, deleteIngredient); // Use the controller function

export default router;