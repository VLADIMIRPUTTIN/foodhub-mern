import { Navigate, Route, Routes } from "react-router-dom";
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

// redirect authenticated users to the appropriate dashboard
const RedirectAuthenticatedUser = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (isAuthenticated && user?.isVerified) {
        // Redirect admin to admin dashboard, others to regular dashboard
        if (user.role === 'admin') {
            console.log("Redirecting authenticated admin to admin dashboard");
            return <Navigate to='/admin-dashboard' replace />;
        }
        console.log("Redirecting authenticated user to home");
        return <Navigate to='/' replace />;
    }

    return children;
};

function App() {
    const { isCheckingAuth, checkAuth } = useAuthStore();
    const [globalAccountStatus, setGlobalAccountStatus] = useState(null);

    useEffect(() => {
        // Check if we just logged out
        const loggedOut = localStorage.getItem('loggedOut');
        
        if (loggedOut === 'true') {
            // If we just logged out, don't try to auto-authenticate
            localStorage.removeItem('loggedOut'); // Clear the flag
            return; // Skip the checkAuth call
        }
        
        // Normal auth check for other cases
        checkAuth().catch(err => {
            console.log('Initial auth check failed:', err);
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
                        <Route
                            path='/'
                            element={<DashboardPage />}
                        />
                        <Route
                            path='/recipes'
                            element={<RecipePage />}
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
                        <Route
                            path='/recipe/:id'
                            element={<RecipeFull />}
                        />
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
