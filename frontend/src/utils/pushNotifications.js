import api from './apiClient';

const SW_PATH = '/service-worker.js';

/**
 * Convert a URL-safe base64 VAPID public key to a Uint8Array
 * required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/**
 * Register the service worker, subscribe to push, and save
 * the subscription on the backend. Safe to call multiple times.
 */
export async function subscribeUserToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported in this browser.');
        return;
    }

    try {
        // Fetch VAPID public key from backend
        const { data } = await api.get('/api/push/vapid-public-key');
        const vapidPublicKey = data.publicKey;
        if (!vapidPublicKey) return;

        // Register (or get existing) service worker
        const registration = await navigator.serviceWorker.register(SW_PATH);
        await navigator.serviceWorker.ready;

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Push notification permission denied.');
            return;
        }

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
        }

        // Save subscription on backend
        await api.post('/api/push/subscribe', subscription.toJSON());
        console.log('Push notification subscription saved.');
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
    }
}

/**
 * Unsubscribe from push notifications (call on logout).
 */
export async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.getRegistration(SW_PATH);
        if (!registration) return;

        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await api.delete('/api/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
            await subscription.unsubscribe();
        }
    } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
    }
}
