import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthGuard = ({ children }) => {
    const { checkAuth, isCheckingAuth } = useAuthStore();

    useEffect(() => {
        // Only check auth on app initialization
        checkAuth();
    }, []); // Empty dependency array - only run once

    if (isCheckingAuth) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner">
                    <i className="bx bx-loader-alt bx-spin"></i>
                </div>
                <p>Loading...</p>
            </div>
        );
    }

    return children;
};

export default AuthGuard;