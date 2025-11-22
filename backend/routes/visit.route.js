import express from 'express';
import { Visit } from '../models/visit.model.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// ✅ PUBLIC: Get total site visits (accessible to everyone)
router.get('/total', async (req, res) => {
    try {
        const visits = await Visit.find();
        const totalVisits = visits.reduce((sum, visit) => sum + visit.visitCount, 0);
        res.json({ totalVisits });
    } catch (error) {
        console.error('Error fetching total visits:', error);
        res.status(500).json({ message: 'Error fetching total visits' });
    }
});

// ✅ PUBLIC: Track anonymous visit (no login required)
router.post('/track-anonymous', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID required' });
        }

        // Use a special "anonymous" user ID
        const anonymousUserId = 'anonymous';
        
        let visit = await Visit.findOne({ userId: anonymousUserId });

        if (!visit) {
            visit = await Visit.create({
                userId: anonymousUserId,
                visitCount: 1,
                sessions: [{ sessionId, timestamp: new Date() }]
            });
        } else {
            const sessionExists = visit.sessions.some(s => s.sessionId === sessionId);
            
            if (!sessionExists) {
                visit.visitCount += 1;
                visit.sessions.push({ sessionId, timestamp: new Date() });
                visit.lastVisit = new Date();
                await visit.save();
            }
        }

        // Get total visits
        const allVisits = await Visit.find();
        const totalVisits = allVisits.reduce((sum, v) => sum + v.visitCount, 0);

        res.json({ 
            totalVisits,
            anonymousVisits: visit.visitCount
        });
    } catch (error) {
        console.error('Error tracking anonymous visit:', error);
        res.status(500).json({ message: 'Error tracking visit' });
    }
});

// Get user's visit count
router.get('/user/:userId', verifyToken, async (req, res) => {
    try {
        const visit = await Visit.findOne({ userId: req.params.userId });
        res.json({ visitCount: visit ? visit.visitCount : 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user visits' });
    }
});

// ✅ Track visit with session ID (for logged-in users only)
router.post('/track', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.userId;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID required' });
        }

        let visit = await Visit.findOne({ userId });

        if (!visit) {
            visit = await Visit.create({
                userId,
                visitCount: 1,
                sessions: [{ sessionId, timestamp: new Date() }]
            });
        } else {
            const sessionExists = visit.sessions.some(s => s.sessionId === sessionId);
            
            if (!sessionExists) {
                visit.visitCount += 1;
                visit.sessions.push({ sessionId, timestamp: new Date() });
                visit.lastVisit = new Date();
                await visit.save();
            }
        }

        const allVisits = await Visit.find();
        const totalVisits = allVisits.reduce((sum, v) => sum + v.visitCount, 0);

        res.json({ 
            userVisitCount: visit.visitCount,
            totalVisits,
            isNewSession: !visit.sessions.some(s => s.sessionId === sessionId && visit.sessions.length > 1)
        });
    } catch (error) {
        console.error('Error tracking visit:', error);
        res.status(500).json({ message: 'Error tracking visit' });
    }
});

export default router;