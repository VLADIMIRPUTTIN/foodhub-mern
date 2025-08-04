import { useState } from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import './LoginPage.scss';

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSubmitted, setForgotSubmitted] = useState(false);

    const { login, isLoading, error, setUser, forgotPassword } = useAuthStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        await login(email, password);
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const response = await axios.post(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth/google-login" : "/api/auth/google-login"}`,
                { credential: credentialResponse.credential },
                { withCredentials: true }
            );
            if (response.data.user) {
                setUser(response.data.user);
                // Save Google profile image to database/cloudinary if available
                if (response.data.user.profileImage) {
                    // Already set by backend, nothing to do
                } else if (response.data.user.googleImage) {
                    // If backend sends googleImage, update profileImage
                    setUser(prev => ({
                        ...prev,
                        profileImage: response.data.user.googleImage
                    }));
                }
            }
            if (response.data.user && response.data.user.isVerified) {
                window.location.reload();
            } else {
                window.location.href = "/verify-email";
            }
        } catch (error) {
            alert("Google login failed");
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        await forgotPassword(forgotEmail);
        setForgotSubmitted(true);
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

                        {error && <p className="error-message">{error}</p>}

                        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
                            <button
                                type="button"
                                className="forgot-link"
                                style={{ 
                                    background: "none", 
                                    border: "none", 
                                    color: "#fff", // changed from green to white
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
                    <style>{`
                        .modal-overlay {
                            position: fixed;
                            top: 0; left: 0; right: 0; bottom: 0;
                            background: rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                        }
                        .forgot-modal {
                            background: #fff;
                            border-radius: 1rem;
                            padding: 2rem 2.5rem;
                            box-shadow: 0 8px 32px 0 rgba(0,0,0,0.18);
                            min-width: 320px;
                            position: relative;
                        }
                        .close-modal {
                            position: absolute;
                            top: 12px;
                            right: 18px;
                            background: none;
                            border: none;
                            font-size: 2rem;
                            color: #888;
                            cursor: pointer;
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
