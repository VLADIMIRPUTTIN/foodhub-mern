import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RecipePage from "./recipessection/RecipePage";
import RecipeFull from "./recipessection/RecipeFull";
import AdminDashboard from "./AdminSide/AdminDashboard";
import CreateRecipePage from "./recipessection/CreateRecipePage";
import UserProfilePage from "./pages/UserProfilePage";
import SharedRecipePage from "./recipessection/SharedRecipePage";
import OnboardingPage from "./pages/OnboardingPage";

import LoadingSpinner from "./components/LoadingSpinner";
import AccountStatusModal from "./components/AccountStatusModal";
import { ToastProvider } from "./components/ui/toast";
import { SocketProvider } from './context/SocketContext';
import NotificationToast from './components/NotificationToast';

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";

// Global axios interceptor for handling account status errors
const setupAxiosInterceptors = (setGlobalAccountStatus) => {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 403 && error.response?.data?.statusData) {
                setGlobalAccountStatus(error.response.data.statusData);
                // Clear user authentication
                useAuthStore.getState().logout();
            }
            return Promise.reject(error);
        }
    );
};

// protect routes that require authentication
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    if (!user.isVerified) {
        return <Navigate to='/verify-email' replace />;
    }

    // IMPORTANT: Check onboarding before allowing access
    if (!user.hasCompletedOnboarding && user.role !== 'admin') {
        return <Navigate to='/onboarding' replace />;
    }

    return children;
};

// Admin route protection
const AdminRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    if (!user.isVerified) {
        return <Navigate to='/verify-email' replace />;
    }

    if (user.role !== 'admin') {
        return <Navigate to='/' replace />;
    }

    return children;
};

// redirect authenticated users to the appropriate dashboard ONLY from login/signup pages
const RedirectAuthenticatedUser = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (isAuthenticated && user?.isVerified) {
        // Check if user needs onboarding first (except admin)
        if (!user.hasCompletedOnboarding && user.role !== 'admin') {
            return <Navigate to='/onboarding' replace />;
        }
        
        // Redirect admin to admin dashboard, others to regular dashboard
        if (user.role === 'admin') {
            console.log("Redirecting authenticated admin to admin dashboard");
            return <Navigate to='/admin-dashboard' replace />;
        }
        console.log("Redirecting authenticated user to dashboard");
        return <Navigate to='/' replace />;
    }

    return children;
};

// Add OnboardingRoute component
const OnboardingRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to='/login' replace />;
    }

    if (!user.isVerified) {
        return <Navigate to='/verify-email' replace />;
    }

    // If user already completed onboarding, redirect to home
    if (user.hasCompletedOnboarding || user.role === 'admin') {
        return <Navigate to='/' replace />;
    }

    return children;
};

// ✅ NEW: Component that checks onboarding for authenticated users
const DashboardWithOnboardingCheck = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        // If user is authenticated and verified but hasn't completed onboarding
        if (isAuthenticated && user?.isVerified && !user?.hasCompletedOnboarding && user?.role !== 'admin') {
            console.log("User needs onboarding, redirecting from dashboard...");
            navigate('/onboarding', { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    return children;
};

function App() {
    const { isCheckingAuth, checkAuth } = useAuthStore();
    const [globalAccountStatus, setGlobalAccountStatus] = useState(null);

    useEffect(() => {
        console.log("App initializing auth check...");
        
        // Check if user just logged out
        const loggedOut = localStorage.getItem('loggedOut');
        console.log("Logout flag:", loggedOut);
        
        if (loggedOut === 'true') {
            console.log("User previously logged out, skipping auth check");
            // Clear the flag but don't authenticate
            localStorage.removeItem('loggedOut');
            return;
        }
        
        console.log("Proceeding with auth check");
        checkAuth().catch(err => {
            console.log('Auth check failed:', err);
        });
        
        setupAxiosInterceptors(setGlobalAccountStatus);
    }, [checkAuth]);

    const handleCloseGlobalStatusModal = () => {
        setGlobalAccountStatus(null);
    };

    if (isCheckingAuth) return <LoadingSpinner />;

    return (
        <ToastProvider>
            <SocketProvider>
                <div>
                    <Routes>
                        {/* ✅ Dashboard now checks for onboarding */}
                        <Route
                            path='/'
                            element={
                                <DashboardWithOnboardingCheck>
                                    <DashboardPage />
                                </DashboardWithOnboardingCheck>
                            }
                        />
                        {/* ✅ Recipes page also checks for onboarding if user is logged in */}
                        <Route
                            path='/recipes'
                            element={
                                <DashboardWithOnboardingCheck>
                                    <RecipePage />
                                </DashboardWithOnboardingCheck>
                            }
                        />
                        <Route
                            path='/onboarding'
                            element={
                                <OnboardingRoute>
                                    <OnboardingPage />
                                </OnboardingRoute>
                            }
                        />
                        <Route
                            path='/admin-dashboard'
                            element={
                                <AdminRoute>
                                    <AdminDashboard />
                                </AdminRoute>
                            }
                        />
                        <Route
                            path='/signup'
                            element={
                                <RedirectAuthenticatedUser>
                                    <SignUpPage />
                                </RedirectAuthenticatedUser>
                            }
                        />
                        <Route
                            path='/login'
                            element={
                                <RedirectAuthenticatedUser>
                                    <LoginPage />
                                </RedirectAuthenticatedUser>
                            }
                        />
                        <Route path='/verify-email' element={<EmailVerificationPage />} />
                        <Route
                            path='/forgot-password'
                            element={
                                <RedirectAuthenticatedUser>
                                    <ForgotPasswordPage />
                                </RedirectAuthenticatedUser>
                            }
                        />
                        <Route
                            path='/reset-password/:token'
                            element={
                                <RedirectAuthenticatedUser>
                                    <ResetPasswordPage />
                                </RedirectAuthenticatedUser>
                            }
                        />
                        {/* These routes still need authentication */}
                        <Route
                            path='/create-recipe'
                            element={
                                <ProtectedRoute>
                                    <CreateRecipePage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path='/profile'
                            element={
                                <ProtectedRoute>
                                    <UserProfilePage />
                                </ProtectedRoute>
                            }
                        />
                        {/* Recipe details is public */}
                        <Route
                            path='/recipe/:id'
                            element={<RecipeFull />}
                        />
                        {/* Shared recipes is public */}
                        <Route
                            path='/shared-recipes'
                            element={<SharedRecipePage />}
                        />
                        <Route path='*' element={<Navigate to='/' replace />} />
                    </Routes>
                    <Toaster />
                    <NotificationToast />
                    
                    {/* Global Account Status Modal */}
                    <AccountStatusModal
                        isOpen={!!globalAccountStatus}
                        onClose={handleCloseGlobalStatusModal}
                        statusData={globalAccountStatus}
                    />
                </div>
            </SocketProvider>
        </ToastProvider>
    );
}

export default App;
