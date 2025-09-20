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
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            const response = await axios.post(`${baseURL}/api/auth/logout`, {}, {
                withCredentials: true
            });
            
            if (response.data.success) {
                // Clear all auth state
                set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isCheckingAuth: false 
                });
                
                // Clear any local storage or session storage
                localStorage.removeItem('auth-storage');
                sessionStorage.clear();
                
                // Force reload to clear any cached data
                window.location.reload();
            }
            localStorage.setItem('loggedOut', 'true');
            
            // Redirect to login page with regular navigate
            window.location.href = '/login';
        } catch (error) {
            console.error("Logout error:", error);
            
            // Still clear state even if API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('authState');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('authState');
            sessionStorage.removeItem('user');
            
            set({ 
                user: null, 
                isAuthenticated: false, 
                error: null, 
                isLoading: false,
                accountStatus: null,
                message: null,
                isCheckingAuth: false
            });
            
            window.location.href = '/login';
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
            // Check if we're in a "just logged out" state by checking localStorage
            const loggedOut = localStorage.getItem('loggedOut');
            
            if (loggedOut === 'true') {
                // If we just logged out, don't try to auto-authenticate
                localStorage.removeItem('loggedOut'); // Clear the flag
                set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isCheckingAuth: false,
                    error: null
                });
                return;
            }
            
            set({ isCheckingAuth: true });
            
            // Continue with normal auth check
            const { data } = await axios.get(`${API_URL}/check-auth`, {
                withCredentials: true
            });
            
            if (data.success) {
                set({ 
                    user: data.user, 
                    isAuthenticated: true, 
                    isCheckingAuth: false,
                    error: null
                });
            } else {
                set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isCheckingAuth: false,
                    error: null
                });
            }
        } catch (error) {
            // If auth check fails, ensure user is logged out
            set({ 
                user: null, 
                isAuthenticated: false, 
                isCheckingAuth: false,
                error: "Failed to verify authentication" 
            });
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
