import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth";

axios.defaults.withCredentials = true;

export const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,
    accountStatus: null,

    // Add the isAdmin function
    isAdmin: () => {
        const { user } = get();
        return user && user.role === 'admin';
    },

    signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/signup`, {
                email,
                password,
                name,
            });
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error.response.data.message || "Error signing up", isLoading: false });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null, accountStatus: null });
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password }, { withCredentials: true });
            const user = res.data.user;
            
            set({
                user: user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                accountStatus: null,
            });
            
            // Return user data so the component can handle routing
            return user;
            
        } catch (error) {
            const errorData = error.response?.data;
            
            // Check if it's an account status error (suspended/banned)
            if (error.response?.status === 403 && errorData?.statusData) {
                set({
                    error: errorData.message,
                    isLoading: false,
                    accountStatus: errorData.statusData,
                    isAuthenticated: false,
                    user: null,
                });
            } else {
                set({
                    error: errorData?.message || "Login failed",
                    isLoading: false,
                    accountStatus: null,
                    isAuthenticated: false,
                    user: null,
                });
            }
            throw error;
        }
    },

    logout: async () => {
        try {
            await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Always clear local state regardless of server response
            set({ 
                user: null, 
                isAuthenticated: false, 
                error: null, 
                isLoading: false,
                accountStatus: null 
            });
        }
    },

    verifyEmail: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/verify-email`, { code });
            set({ user: response.data.user, isAuthenticated: true, isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: error.response.data.message || "Error verifying email", isLoading: false });
            throw error;
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/check-auth`, {
                withCredentials: true,
            });
            set({ 
                user: response.data.user, 
                isAuthenticated: true, 
                isCheckingAuth: false 
            });
            return response.data.user;
        } catch (error) {
            console.log('Auth check failed:', error);
            set({ 
                user: null, 
                isAuthenticated: false, 
                isCheckingAuth: false 
            });
            throw error;
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/forgot-password`, { email });
            set({ message: response.data.message, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message || "Error sending reset password email",
            });
            throw error;
        }
    },

    resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
            set({ message: response.data.message, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message || "Error resetting password",
            });
            throw error;
        }
    },

    setUser: (user) => {
        set({ user, isAuthenticated: !!user });
    },

    clearError: () => {
        set({ error: null });
    },

    clearAccountStatus: () => {
        set({ accountStatus: null });
    },
}));

// Add default export as well for compatibility
export default useAuthStore;
