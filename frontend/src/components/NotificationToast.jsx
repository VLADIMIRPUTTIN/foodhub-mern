import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import './NotificationToast.scss';

const NotificationToast = () => {
    const { notifications, removeNotification } = useSocket();

    useEffect(() => {
        // Auto remove notifications after 5 seconds
        notifications.forEach(notification => {
            const timer = setTimeout(() => {
                removeNotification(notification.id);
            }, 5000);

            return () => clearTimeout(timer);
        });
    }, [notifications, removeNotification]);

    return (
        <div className="notification-container">
            <AnimatePresence>
                {notifications.map((notification) => (
                    <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 300, scale: 0.3 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
                        className={`notification-toast ${notification.type}`}
                        layout
                    >
                        <div className="notification-icon">
                            {notification.type === 'success' ? (
                                <i className="bx bx-check-circle"></i>
                            ) : (
                                <i className="bx bx-x-circle"></i>
                            )}
                        </div>
                        <div className="notification-content">
                            <h4>
                                {notification.type === 'success' ? 'Recipe Approved!' : 'Recipe Rejected'}
                            </h4>
                            <p>{notification.message}</p>
                            {notification.reason && (
                                <small>Reason: {notification.reason}</small>
                            )}
                        </div>
                        <button
                            className="notification-close"
                            onClick={() => removeNotification(notification.id)}
                        >
                            <i className="bx bx-x"></i>
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default NotificationToast;