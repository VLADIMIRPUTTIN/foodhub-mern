import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import Input from "../components/Input";
import { ArrowLeft, Loader, Mail } from "lucide-react";
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
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="forgot-password-card"
            >
                <h2 className="forgot-password-title">Forgot Password</h2>
                {!isSubmitted ? (
                    <form onSubmit={handleSubmit}>
                        <p className="forgot-password-desc">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <Input
                            icon={Mail}
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="forgot-btn"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="size-6 animate-spin mx-auto" /> : "Send Reset Link"}
                        </motion.button>
                    </form>
                ) : (
                    <div className="forgot-success-message">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="forgot-success-icon"
                        >
                            <Mail className="h-8 w-8 text-white" />
                        </motion.div>
                        <p>
                            If an account exists for <span className="highlight">{email}</span>, you will receive a password reset link shortly.
                        </p>
                    </div>
                )}
                <div className="forgot-back-link">
                    <Link to={"/login"} className="forgot-link">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
export default ForgotPasswordPage;
