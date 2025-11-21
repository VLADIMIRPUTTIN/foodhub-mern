import mongoose from "mongoose";

const visitCounterSchema = new mongoose.Schema(
  {
    visitorUid: { type: String, required: true, unique: true, index: true },
    firstSeen: { type: Date, required: true, default: Date.now },
    lastSeen: { type: Date, required: true, default: Date.now },
    visits: { type: Number, required: true, default: 1 }
  },
  { timestamps: false }
);

export const VisitCounter = mongoose.model("VisitCounter", visitCounterSchema);