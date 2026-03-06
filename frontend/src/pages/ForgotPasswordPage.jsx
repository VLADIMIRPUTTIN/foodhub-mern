import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import Input from "../components/Input";
import { ArrowLeft, Loader, Mail, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import "./ForgotPasswordPage.scss";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await forgotPassword(email);
        setIsSubmitted(true);
    };

    return (
        <div className="forgot-password-container">
            {/* Decorative blobs */}
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="forgot-password-card"
            >
                {/* Icon Badge */}
                <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                    className="forgot-icon-badge"
                >
                    <KeyRound size={26} strokeWidth={2} />
                </motion.div>

                <h2 className="forgot-password-title">Forgot Password?</h2>
                <p className="forgot-password-subtitle">No worries, we've got you covered</p>

                {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="forgot-form">
                        <p className="forgot-password-desc">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <div className="forgot-input-wrapper">
                            <Input
                                icon={Mail}
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className="forgot-btn"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader className="size-6 animate-spin mx-auto" />
                            ) : (
                                <>
                                    <span>Send Reset Link</span>
                                    <span className="btn-arrow">→</span>
                                </>
                            )}
                        </motion.button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="forgot-success-message"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 28, delay: 0.1 }}
                            className="forgot-success-icon"
                        >
                            <Mail size={28} strokeWidth={2} />
                        </motion.div>
                        <h3 className="forgot-success-title">Check your inbox!</h3>
                        <p className="forgot-success-text">
                            If an account exists for{" "}
                            <span className="highlight">{email}</span>
                            , you will receive a password reset link shortly.
                        </p>
                        <div className="forgot-success-note">
                            <span>📌</span>
                            <span>Don't forget to check your spam folder.</span>
                        </div>
                    </motion.div>
                )}

                {/* Divider */}
                <div className="forgot-divider">
                    <span />
                    <small>or</small>
                    <span />
                </div>

                <div className="forgot-back-link">
                    <Link to="/login" className="forgot-link">
                        <ArrowLeft size={15} className="mr-2" />
                        Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
