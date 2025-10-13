import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const { user, isAuthenticated, isAdmin } = useAuthStore();
    const notificationSound = useRef(new Audio('/notification.mp3'));

    // Add notification to the array
    const addNotification = (notification) => {
        const id = uuidv4();
        setNotifications(prev => [
            ...prev,
            { ...notification, id }
        ]);
        return id;
    };

    // Remove notification by ID
    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // Play notification sound
    const playNotificationSound = () => {
        // Reset the audio to beginning and play
        notificationSound.current.pause();
        notificationSound.current.currentTime = 0;
        
        // Create a user interaction promise to handle autoplay restrictions
        const playPromise = notificationSound.current.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Audio playback error:', error);
            });
        }
    };

    useEffect(() => {
        let socketInstance = null;

        if (isAuthenticated && user) {
            const baseURL = import.meta.env.MODE === "development"
                ? "http://localhost:5000"
                : "";
                
            socketInstance = io(baseURL, {
                withCredentials: true
            });

            socketInstance.on('connect', () => {
                console.log('Socket connected!');
                socketInstance.emit('join', user._id);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            // ADMIN: Listen for new pending recipes (only play sound for admins)
            socketInstance.on('recipePending', (data) => {
                const isUserAdmin = isAdmin ? isAdmin() : user?.role === 'admin';
                
                // Only show notification and play sound for admins
                if (isUserAdmin) {
                    addNotification({
                        type: 'info',
                        message: `New recipe "${data.title}" pending approval`,
                    });
                    // Play sound for admins when new recipe is pending
                    playNotificationSound();
                }
            });

            // USER: Listen for recipe approval (play sound for recipe owner)
            socketInstance.on('recipeApproved', (data) => {
                // Check if this notification is for the current user's recipe
                const isForCurrentUser = data.userId?.toString() === user._id;
                
                addNotification({
                    type: 'success',
                    message: `Your recipe "${data.title}" has been approved!`,
                });
                
                // Play sound if it's the user's recipe
                if (isForCurrentUser) {
                    playNotificationSound();
                }
            });

            // USER: Listen for recipe rejection (play sound for recipe owner)
            socketInstance.on('recipeRejected', (data) => {
                // Check if this notification is for the current user's recipe
                const isForCurrentUser = data.userId?.toString() === user._id;
                
                addNotification({
                    type: 'error',
                    message: `Your recipe "${data.title}" has been declined.`,
                    reason: data.reason || 'No reason provided'
                });
                
                // Play sound if it's the user's recipe
                if (isForCurrentUser) {
                    playNotificationSound();
                }
            });

            setSocket(socketInstance);
        }

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, [isAuthenticated, user, isAdmin]);

    return (
        <SocketContext.Provider value={{ 
            socket, 
            notifications, 
            addNotification, 
            removeNotification,
            playNotificationSound
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);