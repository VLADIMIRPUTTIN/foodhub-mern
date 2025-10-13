import { useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import AccountStatusModal from "../components/AccountStatusModal";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import './LoginPage.scss';

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSubmitted, setForgotSubmitted] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const { login, isLoading, error, setUser, forgotPassword, accountStatus, clearAccountStatus } = useAuthStore();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Call login and get the returned user data
            const userdata = await login(email, password);
            
            // Check if there's account status data and show modal
            if (accountStatus) {
                setShowStatusModal(true);
                return;
            }

            // Check if login was successful and user data is available
            if (userdata) {
                console.log("Login successful, user data:", userdata);
                
                // Check if user needs email verification
                if (!userdata.isVerified) {
                    console.log("User not verified, redirecting to verification");
                    navigate('/verify-email');
                    return;
                }
                
                // Check user role and redirect accordingly
                if (userdata.role === 'admin') {
                    console.log("Admin user detected, redirecting to admin dashboard");
                    navigate('/admin-dashboard');
                } else {
                    console.log("Regular user detected, redirecting to home");
                    navigate('/');
                }
            }
            
        } catch (error) {
            console.error("Login failed:", error);
            // Error is already handled by the auth store
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            console.log("Starting Google login process...");
            
            const baseURL = import.meta.env.MODE === "development" 
                ? "http://localhost:5000" 
                : "";
                
            const response = await axios.post(
                `${baseURL}/api/auth/google-login`,
                { credential: credentialResponse.credential },
                { withCredentials: true }
            );
            
            console.log("Google login response received:", response.status);
            console.log("Response data:", response.data);
            
            if (response.data.user) {
                // Set user in auth store
                setUser(response.data.user);
                
                // Check user role and verification status
                const user = response.data.user;
                console.log("Google login - User role:", user.role, "Verified:", user.isVerified);
                
                // Check if user needs email verification first
                if (!user.isVerified) {
                    console.log("User needs verification, redirecting to verify-email");
                    navigate('/verify-email');
                    return;
                }
                
                // User is verified, check role for redirect
                if (user.role === 'admin') {
                    console.log("Admin user logged in with Google, redirecting to admin dashboard");
                    navigate('/admin-dashboard');
                } else {
                    console.log("Regular verified user, redirecting to home");
                    navigate('/');
                }
            } else {
                throw new Error("No user data received from server");
            }
            
        } catch (error) {
            console.error("Google login failed:", error);
            if (error.response?.status === 403 && error.response?.data?.statusData) {
                // Handle account status issues (banned/suspended)
                setShowStatusModal(true);
            } else if (error.response) {
                console.error("Server response:", error.response.data);
                console.error(error.response.data.message || "Google login failed");
            } else {
                console.error("Google login failed. Please try again.");
            }
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        await forgotPassword(forgotEmail);
        setForgotSubmitted(true);
    };

    const handleCloseStatusModal = () => {
        setShowStatusModal(false);
        clearAccountStatus();
    };

    return (
        <div className="login-container">
            {/* Left Side - Image */}
            <div className="login-left">
                <div className="image-container">
                    <div className="dark-overlay"></div>
                    <img 
                        className="login-image" 
                        src="https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                        alt="Pizza"
                    />
                </div>
                <div className="logo-top-right">
                    🍳 FoodHub
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-right">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="login-form-container"
                >
                    <h2 className="login-title">Sign in to FoodHub</h2>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <div className="input-container">
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="form-control"
                                    placeholder=" "
                                />
                                <label htmlFor="email" className="input-label">Email</label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-container">
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="form-control"
                                    placeholder=" "
                                />
                                <label htmlFor="password" className="input-label">Password</label>
                            </div>
                        </div>

                        {error && !accountStatus && <p className="error-message">{error}</p>}

                        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
                            <button
                                type="button"
                                className="forgot-link"
                                style={{ 
                                    background: "none", 
                                    border: "none", 
                                    color: "#fff",
                                    cursor: "pointer", 
                                    fontSize: "0.95em" 
                                }}
                                onClick={() => setShowForgot(true)}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="submit-button"
                        >
                            {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Login"}
                        </motion.button>
                    </form>

                    {/* Terms and Conditions Button */}
                    <button
                        type="button"
                        className="terms-link"
                        style={{ 
                            background: "none", 
                            border: "none", 
                            color: "#F8F1E5",
                            cursor: "pointer", 
                            fontSize: "0.9em",
                            marginTop: "1rem",
                            textDecoration: "underline",
                            opacity: "0.9"
                        }}
                        onClick={() => setShowTerms(true)}
                    >
                        Terms & Conditions
                    </button>

                    {/* Social Login Section */}
                    <div className="social-login">
                        <p className="or-divider">OR</p>
                        <div className="google-button-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleLogin}
                                onError={() => alert("Google login failed")}
                            />
                        </div>
                    </div>

                    <div className="register-link">
                        <p>Don't have an account? <Link to="/signup">Register</Link></p>
                    </div>
                </motion.div>
            </div>

            {/* Account Status Modal */}
            <AccountStatusModal
                isOpen={showStatusModal}
                onClose={handleCloseStatusModal}
                statusData={accountStatus}
            />

            {/* Forgot Password Modal */}
            {showForgot && (
                <div className="modal-overlay">
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="forgot-modal"
                    >
                        <button
                            className="close-modal"
                            onClick={() => {
                                setShowForgot(false);
                                setForgotSubmitted(false);
                                setForgotEmail("");
                            }}
                        >
                            &times;
                        </button>
                        <h3>Forgot Password</h3>
                        {!forgotSubmitted ? (
                            <form onSubmit={handleForgotSubmit}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required
                                    className="form-control"
                                />
                                <button
                                    type="submit"
                                    className="submit-button"
                                    style={{ marginTop: "1rem" }}
                                >
                                    Send Reset Link
                                </button>
                            </form>
                        ) : (
                            <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
                                <p>
                                    If an account exists for <b>{forgotEmail}</b>, you will receive a password reset link shortly.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Import Terms and Conditions Modal Component */}
            <TermsAndConditionsModal 
                isOpen={showTerms} 
                onClose={() => setShowTerms(false)} 
            />
        </div>
    );
};

export default LoginPage;
