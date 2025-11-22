import { create } from "zustand";
import axios from "axios";

// ✅ Fix API URL - use relative path in production
const API_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/auth" 
    : "/api/auth"; // Changed to relative path

axios.defaults.withCredentials = true;

// Remove the problematic axios interceptor that auto-logs out
// Add axios interceptor to handle 401 responses more carefully
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        // Only act on explicit auth mutations, not passive check-auth
        if (status === 401 && /\/api\/auth\/(login|signup|reset-password|forgot-password)/.test(url)) {
            // Clear state without server logout spam
            const { clearAuthStateSilently } = useAuthStore.getState();
            clearAuthStateSilently();
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

    clearAuthStateSilently: () => {
        set({
            user: null,
            isAuthenticated: false,
            error: null,
            accountStatus: null
        });
        // No console spam
    },

    logout: async () => {
        // Only perform server logout if currently authenticated
        const { isAuthenticated } = get();
        try {
            if (isAuthenticated) {
                const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
                await axios.post(`${baseURL}/api/auth/logout`, {}, { withCredentials: true });
            }
        } catch (error) {
            // Suppress noisy errors
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
            const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
            const response = await axios.get(`${baseURL}/api/auth/check-auth`, { withCredentials: true });
            if (response.data.success) {
                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isCheckingAuth: false
                });
            } else {
                set({ user: null, isAuthenticated: false, isCheckingAuth: false });
            }
        } catch {
            // Passive failure: just clear auth, do NOT logout server
            set({ user: null, isAuthenticated: false, isCheckingAuth: false });
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
