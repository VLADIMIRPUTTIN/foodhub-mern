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

        // Check if session already exists
        const existingVisit = await Visit.findOne({ 
            userId, 
            'sessions.sessionId': sessionId 
        });

        let incremented = false;

        if (!existingVisit) {
            // Session doesn't exist, increment count
            await Visit.updateOne(
                { userId },
                {
                    $inc: { visitCount: 1 },
                    $push: { sessions: { sessionId, timestamp: now } },
                    $set: { lastVisit: now }
                },
                { upsert: true }
            );
            incremented = true;
        } else {
            // Session exists, just update lastVisit without incrementing
            await Visit.updateOne(
                { userId },
                { $set: { lastVisit: now } }
            );
        }

        // Fetch current counts
        const visitDoc = await Visit.findOne({ userId });
        const agg = await Visit.aggregate([{ $group: { _id: null, total: { $sum: "$visitCount" } } }]);
        const totalVisits = agg.length ? agg[0].total : 0;

        res.json({
            totalVisits,
            anonymousVisits: visitDoc ? visitDoc.visitCount : 0,
            incremented,
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

        // Check if session already exists
        const existingVisit = await Visit.findOne({ 
            userId, 
            'sessions.sessionId': sessionId 
        });

        let incremented = false;

        if (!existingVisit) {
            // Session doesn't exist, increment count
            await Visit.updateOne(
                { userId },
                {
                    $inc: { visitCount: 1 },
                    $push: { sessions: { sessionId, timestamp: now } },
                    $set: { lastVisit: now }
                },
                { upsert: true }
            );
            incremented = true;
        } else {
            // Session exists, just update lastVisit without incrementing
            await Visit.updateOne(
                { userId },
                { $set: { lastVisit: now } }
            );
        }

        // Fetch current counts
        const visitDoc = await Visit.findOne({ userId });
        const agg = await Visit.aggregate([{ $group: { _id: null, total: { $sum: "$visitCount" } } }]);
        const totalVisits = agg.length ? agg[0].total : 0;

        res.json({
            userVisitCount: visitDoc ? visitDoc.visitCount : 0,
            totalVisits,
            incremented,
            sessionId
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error tracking visit' });
    }
});

export default router;