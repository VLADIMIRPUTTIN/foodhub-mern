import express from 'express';
import { Visit } from '../models/visit.model.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get total visits
router.get('/total', async (req, res) => {
    try {
        const agg = await Visit.aggregate([
            { $group: { _id: null, total: { $sum: "$visitCount" } } }
        ]);
        res.json({ totalVisits: agg.length ? agg[0].total : 0 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching total visits' });
    }
});

// Track anonymous (idempotent)
router.post('/track-anonymous', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

        const userId = 'anonymous';
        const now = new Date();

        // Atomic upsert & conditional increment
        const result = await Visit.updateOne(
            { userId, 'sessions.sessionId': { $ne: sessionId } },
            {
                $inc: { visitCount: 1 },
                $push: { sessions: { sessionId, timestamp: now } },
                $set: { lastVisit: now }
            },
            { upsert: true }
        );

        // Fetch current doc
        const visitDoc = await Visit.findOne({ userId });
        const agg = await Visit.aggregate([{ $group: { _id: null, total: { $sum: "$visitCount" } } }]);
        const totalVisits = agg.length ? agg[0].total : 0;

        res.json({
            totalVisits,
            anonymousVisits: visitDoc.visitCount,
            incremented: (result.modifiedCount > 0 || result.upsertedCount) ? true : false,
            sessionId
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error tracking anonymous visit' });
    }
});

// Get user visit count
router.get('/user/:userId', async (req, res) => {
    try {
        const visit = await Visit.findOne({ userId: req.params.userId });
        res.json({ visitCount: visit ? visit.visitCount : 0 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching user visits' });
    }
});

// Track logged-in user (idempotent)
router.post('/track', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

        const userId = req.userId;
        const now = new Date();

        const result = await Visit.updateOne(
            { userId, 'sessions.sessionId': { $ne: sessionId } },
            {
                $inc: { visitCount: 1 },
                $push: { sessions: { sessionId, timestamp: now } },
                $set: { lastVisit: now }
            },
            { upsert: true }
        );

        const visitDoc = await Visit.findOne({ userId });
        const agg = await Visit.aggregate([{ $group: { _id: null, total: { $sum: "$visitCount" } } }]);
        const totalVisits = agg.length ? agg[0].total : 0;

        res.json({
            userVisitCount: visitDoc.visitCount,
            totalVisits,
            incremented: (result.modifiedCount > 0 || result.upsertedCount) ? true : false,
            sessionId
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error tracking visit' });
    }
});

export default router;