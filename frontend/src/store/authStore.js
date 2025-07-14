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

    signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/signup`, { email, password, name });
            set({ 
                user: response.data.user, 
                isAuthenticated: true, 
                isLoading: false,
                message: response.data.message 
            });
        } catch (error) {
            set({ error: error.response.data.message || "Error signing up", isLoading: false });
            throw error;
        }
    },
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password }, { withCredentials: true });
            set({
                user: res.data.user, // <-- This should be the latest user from DB
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Login failed",
                isLoading: false,
            });
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_URL}/logout`);
            set({ user: null, isAuthenticated: false, error: null, isLoading: false });
        } catch (error) {
            set({ error: "Error logging out", isLoading: false });
            throw error;
        }
    },
    verifyEmail: async (code) => {
        console.log("🔍 VERIFY EMAIL - Frontend:");
        console.log(`📋 Code being sent: ${code}`);
        console.log(`📋 Code length: ${code?.length}`);
        
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/verify-email`, { code });
            console.log("✅ Verification response:", response.data);
            
            set({ 
                user: response.data.user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
            });
            return response.data;
        } catch (error) {
            console.error("❌ Verification error:", error);
            console.error("❌ Error response:", error.response?.data);
            console.error("❌ Error status:", error.response?.status);
            
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
            const response = await axios.get(`${API_URL}/check-auth`);
            set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
        } catch (error) {
            set({ error: null, isCheckingAuth: false, isAuthenticated: false });
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

    // Admin functions
    isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
    },

    createAdmin: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/create-admin`);
            set({ message: response.data.message, isLoading: false });
            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: error.response.data.message || "Error creating admin",
            });
            throw error;
        }
    },
    setUser: (user) => set({ user }),
}));
