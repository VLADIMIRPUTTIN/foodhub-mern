import { Navigate, Route, Routes } from "react-router-dom";

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
import { ToastProvider } from "./components/ui/toast"; // Add this import

import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

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

    if (isAuthenticated && user.isVerified) {
        // Redirect admin to admin dashboard, others to regular dashboard
        if (user.role === 'admin') {
            return <Navigate to='/admin-dashboard' replace />;
        }
        return <Navigate to='/' replace />;
    }

    return children;
};

function App() {
    const { isCheckingAuth, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isCheckingAuth) return <LoadingSpinner />;

    return (
        <ToastProvider> {/* Wrap everything with ToastProvider */}
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
                    {/* catch all routes */}
                    <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
                <Toaster />
            </div>
        </ToastProvider>
    );
}

export default App;
