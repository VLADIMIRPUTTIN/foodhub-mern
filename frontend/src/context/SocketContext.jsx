import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
            const newSocket = io(baseURL);
            
            newSocket.on('connect', () => {
                console.log('Connected to server');
                // Join the user to their room
                newSocket.emit('join', user._id);
            });

            // Listen for recipe approval notifications
            newSocket.on('recipeApproved', (data) => {
                setNotifications(prev => [...prev, {
                    id: Date.now(),
                    type: 'success',
                    ...data
                }]);
            });

            // Listen for recipe rejection notifications
            newSocket.on('recipeRejected', (data) => {
                setNotifications(prev => [...prev, {
                    id: Date.now(),
                    type: 'error',
                    ...data
                }]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    return (
        <SocketContext.Provider value={{
            socket,
            notifications,
            removeNotification,
            clearAllNotifications
        }}>
            {children}
        </SocketContext.Provider>
    );
};