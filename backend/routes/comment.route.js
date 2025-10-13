import express from "express";
import { 
    createComment, 
    getRecipeComments, 
    deleteComment 
} from "../controllers/comment.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Create comment route (requires authentication)
router.post("/", verifyToken, createComment);

// Get comments for a recipe
router.get("/recipe/:recipeId", getRecipeComments);

// Delete a comment (requires authentication)
router.delete("/:commentId", verifyToken, deleteComment);

export default router;