import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import './SignUpPage.scss'; // Import the SCSS file for styling

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showTerms, setShowTerms] = useState(false);
    const navigate = useNavigate();

    const { signup, isLoading, error, setUser } = useAuthStore();

    const handleSignUp = async (e) => {
        e.preventDefault();
        console.log("Starting signup process...");
        
        try {
            await signup(email, password, name);
            console.log("✅ Signup successful, redirecting to verification...");
            navigate("/verify-email");
        } catch (error) {
            console.error("❌ Signup failed:", error);
        }
    };

    const handleGoogleSignUp = async (credentialResponse) => {
        try {
            console.log("Starting Google signup process...");
            
            const baseURL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || "http://localhost:5000")
  : ""; // relative
                
            const response = await axios.post(
                `${baseURL}/api/auth/google-login`,
                { credential: credentialResponse.credential },
                { withCredentials: true }
            );

            if (response.data.user) {
                setUser(response.data.user);
                const user = response.data.user;
                
                console.log("✅ Google signup successful, user data:", user);
                
                // Check if verified
                if (!user.isVerified) {
                    console.log("❌ User not verified, redirecting to verification");
                    navigate("/verify-email");
                    return;
                }

                // ✅ NEW USERS ALWAYS NEED ONBOARDING (unless admin)
                if (!user.hasCompletedOnboarding && user.role !== 'admin') {
                    console.log("⚠️ New user needs onboarding, redirecting...");
                    navigate("/onboarding");
                    return;
                }

                // Existing users who already completed onboarding
                if (user.role === 'admin') {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/");
                }
            }
        } catch (error) {
            console.error("❌ Google signup failed:", error);
            toast.error(error.response?.data?.message || "Google signup failed. Please try again.");
        }
    };

    const handleGoogleError = () => {
        console.error("Google signup error");
        alert("Google signup failed. Please try again.");
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const baseURL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || "http://localhost:5000")
  : ""; // relative
                
            const response = await axios.post(
                `${baseURL}/api/auth/google-login`,
                { credential: credentialResponse.credential },
                { withCredentials: true }
            );
            
            if (response.data.user) {
                setUser(response.data.user);
                const user = response.data.user;
                
                // Check verification first
                if (!user.isVerified) {
                    navigate('/verify-email');
                    return;
                }
                
                // Check onboarding
                if (!user.hasCompletedOnboarding && user.role !== 'admin') {
                    navigate('/onboarding');
                    return;
                }
                
                // Check role
                if (user.role === 'admin') {
                    navigate('/admin-dashboard');
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error("Google login failed:", error);
            if (error.response?.status === 403 && error.response?.data?.statusData) {
                setShowStatusModal(true);
            }
        }
    };

    return (
        <div className="signup-container">
            {/* Left Side - Image */}
            <div className="signup-left">
                <div className="image-container">
                    <div className="dark-overlay"></div>
                    <img 
                        className="signup-image" 
                        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                        alt="Food"
                    />
                </div>
                <div className="logo-top-right">
                    🍳 FoodHub
                </div>
            </div>

            {/* Right Side - SignUp Form */}
            <div className="signup-right">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="signup-form-container"
                >
                    <h2 className="signup-title">Create Account</h2>

                    <form onSubmit={handleSignUp}>
                        <div className="form-group">
                            <div className="input-container">
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="form-control"
                                    placeholder=" "
                                />
                                <label htmlFor="name" className="input-label">Full Name</label>
                            </div>
                        </div>

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
                                <label htmlFor="email" className="input-label">Email Address</label>
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
                        
                        <div className="password-strength-container">
                            <PasswordStrengthMeter password={password} />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="submit-button"
                        >
                            {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : "Sign Up"}
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
                    <div className="social-signup">
                        <p className="or-divider">OR</p>
                        <div className="google-button-wrapper">
                            <GoogleLogin
                                onSuccess={handleGoogleSignUp}
                                onError={handleGoogleError}
                                text="signup_with"
                                theme="outline"
                                size="large"
                                width="240"
                            />
                        </div>
                    </div>

                    <div className="login-link">
                        <p>Already have an account? <Link to="/login">Login</Link></p>
                    </div>
                </motion.div>
            </div>

            {/* Terms and Conditions Modal */}
            <TermsAndConditionsModal 
                isOpen={showTerms} 
                onClose={() => setShowTerms(false)} 
            />
        </div>
    );
};

export default SignUpPage;
