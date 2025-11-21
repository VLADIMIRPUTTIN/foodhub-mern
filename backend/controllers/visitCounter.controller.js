import { VisitCounter } from "../models/visitCounter.model.js";

export const incrementVisit = async (req, res) => {
  try {
    const { visitorUid } = req.body;
    if (!visitorUid) return res.status(400).json({ message: "visitorUid required" });

    const existing = await VisitCounter.findOne({ visitorUid });
    if (!existing) {
      const created = await VisitCounter.create({ visitorUid });
      return res.json(created);
    }

    existing.visits += 1;
    existing.lastSeen = new Date();
    await existing.save();
    return res.json(existing);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyVisit = async (req, res) => {
  try {
    const { visitorUid } = req.query;
    if (!visitorUid) return res.status(400).json({ message: "visitorUid required" });
    const doc = await VisitCounter.findOne({ visitorUid });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};