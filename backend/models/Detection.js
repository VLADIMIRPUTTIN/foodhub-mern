import mongoose from "mongoose";

const detectionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String, required: true }, // base64 string or image URL
    objects: [
        {
            name: String,
            score: Number
        }
    ],
    detectedAt: { type: Date, default: Date.now }
});

const Detection = mongoose.model("Detection", detectionSchema);

export default Detection;