import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

export const Ingredient = mongoose.model("Ingredient", ingredientSchema);