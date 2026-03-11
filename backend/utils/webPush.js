import webPush from 'web-push';
import { PushSubscription } from '../models/pushSubscription.model.js';
import { User } from '../models/user.model.js';

webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@foodhub.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Send a push notification to a specific user (all their devices).
 * @param {string} userId
 * @param {{ title: string, body: string, icon?: string, url?: string }} payload
 */
export const sendPushToUser = async (userId, payload) => {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions.length) return;

    const notification = JSON.stringify(payload);
    await Promise.allSettled(
        subscriptions.map(sub =>
            webPush
                .sendNotification(
                    { endpoint: sub.endpoint, keys: sub.keys },
                    notification
                )
                .catch(async err => {
                    // 410 Gone = subscription expired/cancelled — remove it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await PushSubscription.deleteOne({ _id: sub._id });
                    }
                })
        )
    );
};

/**
 * Send a push notification to all admin users.
 * @param {{ title: string, body: string, icon?: string, url?: string }} payload
 */
export const sendPushToAdmins = async (payload) => {
    const admins = await User.find({ role: 'admin' }).select('_id');
    const adminIds = admins.map(a => a._id);
    if (!adminIds.length) return;

    const subscriptions = await PushSubscription.find({ userId: { $in: adminIds } });
    if (!subscriptions.length) return;

    const notification = JSON.stringify(payload);
    await Promise.allSettled(
        subscriptions.map(sub =>
            webPush
                .sendNotification(
                    { endpoint: sub.endpoint, keys: sub.keys },
                    notification
                )
                .catch(async err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await PushSubscription.deleteOne({ _id: sub._id });
                    }
                })
        )
    );
};
