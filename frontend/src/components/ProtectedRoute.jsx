import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user, isCheckingAuth } = useAuthStore();

    if (isCheckingAuth) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <i className="bx bx-loader-alt bx-spin"></i>
                </div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;