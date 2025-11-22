import express from 'express';
import { Visit } from '../models/visit.model.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// GET total visits
router.get('/total', async (req, res) => {
    try {
        const agg = await Visit.aggregate([{ $group: { _id: null, total: { $sum: '$visitCount' } } }]);
        res.json({ totalVisits: agg.length ? agg[0].total : 0 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching total visits' });
    }
});

// Internal helper
const trackGeneric = async ({ userId, sessionId }) => {
    const now = new Date();

    // Correct atomic condition: only update if NO element with this sessionId
    const updateResult = await Visit.updateOne(
        {
            userId,
            sessions: { $not: { $elemMatch: { sessionId } } } // ← FIXED
        },
        {
            $inc: { visitCount: 1 },
            $push: { sessions: { sessionId, timestamp: now } },
            $set: { lastVisit: now }
        },
        { upsert: true }
    );

    let incremented = false;
    if (updateResult.modifiedCount === 1 || updateResult.upsertedCount === 1) {
        incremented = true;
    } else {
        // Session already recorded: just touch lastVisit
        await Visit.updateOne({ userId }, { $set: { lastVisit: now } });
    }

    const doc = await Visit.findOne({ userId }).lean();
    const agg = await Visit.aggregate([{ $group: { _id: null, total: { $sum: '$visitCount' } } }]);
    return {
        incremented,
        totalVisits: agg.length ? agg[0].total : 0,
        userVisitCount: doc ? doc.visitCount : 0
    };
};

// Track anonymous
router.post('/track-anonymous', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

        const result = await trackGeneric({ userId: 'anonymous', sessionId });
        res.json({
            totalVisits: result.totalVisits,
            anonymousVisitCount: result.userVisitCount,
            incremented: result.incremented,
            sessionId
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error tracking anonymous visit' });
    }
});

// Track authenticated user
router.post('/track', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

        const userId = req.userId;
        const result = await trackGeneric({ userId, sessionId });

        res.json({
            userVisitCount: result.userVisitCount,
            totalVisits: result.totalVisits,
            incremented: result.incremented,
            sessionId
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error tracking user visit' });
    }
});

// Get visit count for a specific userId
router.get('/user/:userId', async (req, res) => {
    try {
        const visit = await Visit.findOne({ userId: req.params.userId });
        res.json({ visitCount: visit ? visit.visitCount : 0 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching user visits' });
    }
});

export default router;