import { create } from "zustand";
import api from '../utils/apiClient';
import { unsubscribeFromPush } from '../utils/pushNotifications';

const API_URL = "/api/auth";

export const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,
    accountStatus: null,

    signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/signup`, { email, password, name });
            set({ 
                user: response.data.user, 
                isAuthenticated: true, 
                isLoading: false 
            });
            return response.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || "Error signing up", 
                isLoading: false 
            });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null, accountStatus: null });
        try {
            const response = await api.post(`${API_URL}/login`, { email, password });
            
            if (response.data.statusData) {
                set({ 
                    accountStatus: response.data.statusData,
                    isLoading: false,
                    error: null,
                    isAuthenticated: false
                });
                return null;
            }

            set({ 
                isAuthenticated: true, 
                user: response.data.user, 
                error: null,
                isLoading: false,
                accountStatus: null
            });

            // Subscribe to push notifications after successful login
            subscribeUserToPush().catch(err => console.error('Push subscribe error:', err));
            
            return response.data.user;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error logging in";
            set({ 
                error: errorMessage, 
                isLoading: false,
                isAuthenticated: false,
                user: null
            });
            throw error;
        }
    },

    logout: async () => {
        const { isAuthenticated } = get();
        try {
            await unsubscribeFromPush();
            if (isAuthenticated) {
                await api.post(`${API_URL}/logout`);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            set({
                user: null,
                isAuthenticated: false,
                isCheckingAuth: false,
                error: null,
                accountStatus: null
            });
            localStorage.setItem('loggedOut', 'true');
            sessionStorage.clear();
            localStorage.removeItem('auth-storage');
        }
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/verify-email`, { code });
            set({ 
                user: response.data.user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
            });
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error verifying email";
            set({ 
                error: errorMessage, 
                isLoading: false 
            });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const response = await api.get(`${API_URL}/check-auth`);
            set({ 
                user: response.data.user, 
                isAuthenticated: true, 
                isCheckingAuth: false 
            });
        } catch (error) {
            set({ 
                error: null, 
                isCheckingAuth: false, 
                isAuthenticated: false,
                user: null 
            });
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/forgot-password`, { email });
            set({ message: response.data.message, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || "Error sending reset email",
            });
            throw error;
        }
    },

    resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`${API_URL}/reset-password/${token}`, { password });
            set({ message: response.data.message, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response?.data?.message || "Error resetting password",
            });
            throw error;
        }
    },

    clearAccountStatus: () => set({ accountStatus: null }),
    
    clearAuthStateSilently: () => {
        set({
            user: null,
            isAuthenticated: false,
            error: null,
            accountStatus: null
        });
    },

    isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
    },

    setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
