import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/auth" 
    : "/api/auth";

axios.defaults.withCredentials = true;

// Remove the problematic axios interceptor that auto-logs out
// Add axios interceptor to handle 401 responses more carefully
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only logout on 401 if it's from auth endpoints, not profile/user data endpoints
        if (error.response?.status === 401 && error.config?.url?.includes('/api/auth/')) {
            console.log("Auth endpoint returned 401, logging out");
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

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
            
            console.log("AuthStore - Login successful, returning user:", user);
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

    clearAccountStatus: () => set({ accountStatus: null }),

    logout: async () => {
        try {
            // Set logout flag BEFORE making the request
            localStorage.setItem('loggedOut', 'true');
            
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            const response = await axios.post(`${baseURL}/api/auth/logout`, {}, {
                withCredentials: true
            });
            
            // Clear all auth state
            set({ 
                user: null, 
                isAuthenticated: false, 
                isCheckingAuth: false,
                error: null,
                accountStatus: null
            });
            
            // Clear any storage
            localStorage.removeItem('auth-storage');
            sessionStorage.clear();
            
            // Don't force reload, let the app handle the state change naturally
            console.log("Logout successful");
            
        } catch (error) {
            console.error("Logout error:", error);
            // Even if logout request fails, clear local state
            localStorage.setItem('loggedOut', 'true');
            set({ 
                user: null, 
                isAuthenticated: false, 
                isCheckingAuth: false,
                error: null,
                accountStatus: null
            });
            localStorage.removeItem('auth-storage');
            sessionStorage.clear();
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
        try {
            set({ isCheckingAuth: true });
            
            // Check if user just logged out
            const loggedOut = localStorage.getItem('loggedOut');
            
            if (loggedOut === 'true') {
                // Clear the logout flag and don't authenticate
                localStorage.removeItem('loggedOut');
                set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isCheckingAuth: false,
                    error: null,
                    accountStatus: null
                });
                return;
            }
            
            // Try to authenticate with existing cookie
            const response = await axios.get(`${API_URL}/check-auth`, {
                withCredentials: true
            });
            
            if (response.data.success) {
                set({ 
                    user: response.data.user, 
                    isAuthenticated: true, 
                    isCheckingAuth: false,
                    error: null,
                    accountStatus: null
                });
            } else {
                set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isCheckingAuth: false,
                    error: null,
                    accountStatus: null
                });
            }
        } catch (error) {
            console.log("Auth check failed:", error.response?.status);
            
            // Clear everything on auth failure
            set({ 
                user: null, 
                isAuthenticated: false, 
                isCheckingAuth: false,
                error: null,
                accountStatus: null
            });
            
            // If it's a 401/403, user needs to login again
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.setItem('loggedOut', 'true');
            }
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

    setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
