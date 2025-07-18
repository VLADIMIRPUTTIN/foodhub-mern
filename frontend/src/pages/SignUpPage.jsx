import { motion } from "framer-motion";
import { Loader } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useAuthStore } from "../store/authStore";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import './SignUpPage.scss'; // Import the SCSS file for styling

const SignUpPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const { signup, isLoading, error, setUser } = useAuthStore();

    const DEFAULT_PROFILE_IMAGE = "https://i.ibb.co/WvG991xq/profile-icon.jpg";

    const handleSignUp = async (e) => {
        e.preventDefault();

        console.log("Starting signup process...");
        console.log("Form data:", { name, email, password: "***" });

        try {
            // Pass default profile image to backend on manual signup
            await signup(email, password, name, DEFAULT_PROFILE_IMAGE);
            console.log("✅ Signup successful, navigating to verification...");
            navigate("/verify-email");
        } catch (error) {
            console.error("❌ Signup failed:", error);
            console.log("Error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
    };

    const handleGoogleSignUp = async (credentialResponse) => {
        try {
            console.log("Starting Google signup process...");
            
            // Send the credential to your backend for verification
            const response = await axios.post(
                `${import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth/google-login" : "/api/auth/google-login"}`,
                { credential: credentialResponse.credential },
                { withCredentials: true }
            );

            // Set user in auth store so verification page knows the email
            if (response.data.user) {
                setUser(response.data.user);
            }

            if (response.data.user && response.data.user.isVerified) {
                navigate("/");
                window.location.reload();
            } else {
                navigate("/verify-email");
            }
        } catch (error) {
            console.error("❌ Google signup failed:", error);
            alert("Google signup failed. Please try again.");
        }
    };

    const handleGoogleError = () => {
        console.error("Google signup error");
        alert("Google signup failed. Please try again.");
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
        </div>
    );
};

export default SignUpPage;
