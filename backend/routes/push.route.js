import express from 'express';
import { PushSubscription } from '../models/pushSubscription.model.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Public: frontend fetches the VAPID public key to subscribe
router.get('/vapid-public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Authenticated: save or update a push subscription
router.post('/subscribe', verifyToken, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ success: false, message: 'Invalid subscription payload' });
        }

        await PushSubscription.findOneAndUpdate(
            { userId: req.userId, endpoint },
            { userId: req.userId, endpoint, keys },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Subscribed to push notifications' });
    } catch (error) {
        console.error('Push subscribe error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Authenticated: remove a push subscription (on logout / permission denied)
router.delete('/unsubscribe', verifyToken, async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) {
            await PushSubscription.deleteOne({ userId: req.userId, endpoint });
        } else {
            await PushSubscription.deleteMany({ userId: req.userId });
        }
        res.json({ success: true, message: 'Unsubscribed from push notifications' });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
