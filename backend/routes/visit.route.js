import express from 'express';
import { Visit } from '../models/visit.model.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Get total site visits (all users)
router.get('/total', async (req, res) => {
    try {
        const visits = await Visit.find();
        const totalVisits = visits.reduce((sum, visit) => sum + visit.visitCount, 0);
        res.json({ totalVisits });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching total visits' });
    }
});

// Get user's visit count
router.get('/user/:userId', async (req, res) => {
    try {
        const visit = await Visit.findOne({ userId: req.params.userId });
        res.json({ visitCount: visit ? visit.visitCount : 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user visits' });
    }
});

// Track visit with session ID
router.post('/track', verifyToken, async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.userId;

        if (!sessionId) {
            return res.status(400).json({ message: 'Session ID required' });
        }

        let visit = await Visit.findOne({ userId });

        if (!visit) {
            // First time visitor
            visit = await Visit.create({
                userId,
                visitCount: 1,
                sessions: [{ sessionId, timestamp: new Date() }]
            });
        } else {
            // Check if this session already exists
            const sessionExists = visit.sessions.some(s => s.sessionId === sessionId);
            
            if (!sessionExists) {
                // New session - increment count
                visit.visitCount += 1;
                visit.sessions.push({ sessionId, timestamp: new Date() });
                visit.lastVisit = new Date();
                await visit.save();
            }
        }

        // Get total visits across all users
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