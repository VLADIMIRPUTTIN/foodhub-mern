import {  useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";
import axios from "axios";
import './EmailVerificationPage.scss';

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/auth" : "/api/auth";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { error, isLoading, verifyEmail } = useAuthStore();

    const handleChange = (index, value) => {
        const newCode = [...code];

        // Handle pasted content
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedCode[i] || "";
            }
            setCode(newCode);

            // Focus on the last non-empty input or the first empty one
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
            inputRefs.current[focusIndex].focus();
        } else {
            newCode[index] = value;
            setCode(newCode);

            // Move focus to the next input field if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; // Prevent multiple submissions
        
        const verificationCode = code.join("");
        console.log("🔍 Submitting verification code:", verificationCode);
        
        if (verificationCode.length !== 6) {
            toast.error("Please enter a 6-digit code");
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await verifyEmail(verificationCode);
            toast.success("Email verified successfully");
            navigate("/");
        } catch (error) {
            console.error("Verification failed:", error);
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        try {
            // Use the email from the user object in authStore
            const email = useAuthStore.getState().user?.email;
            if (!email) {
                toast.error("No email found for resend.");
                setResendLoading(false);
                return;
            }
            await axios.post(`${API_URL}/resend-verification`, { email });
            toast.success("Verification code resent!");
            setResendCooldown(30); // 30 seconds cooldown
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend code");
        } finally {
            setResendLoading(false);
        }
    };

    // Cooldown timer effect
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    return (
        <div className="email-verification-container">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="email-verification-card"
            >
                <h2 className="email-verification-title">Verify Your Email</h2>
                <p className="email-verification-desc">Enter the 6-digit code sent to your email address.</p>
                <form onSubmit={handleSubmit}>
                    <div className="code-inputs">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="code-input"
                                disabled={isSubmitting}
                            />
                        ))}
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={isLoading || isSubmitting || code.some((digit) => !digit)}
                        className="verify-btn"
                    >
                        {isLoading || isSubmitting ? "Verifying..." : "Verify Email"}
                    </motion.button>
                    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                        <button
                            type="button"
                            className="verify-btn"
                            style={{
                                background: "#fff",
                                color: "#bb8860",
                                marginTop: "10px",
                                fontWeight: 500,
                                border: "1px solid #dbaf7e",
                                boxShadow: "none",
                                padding: "10px 18px",
                                width: "auto"
                            }}
                            onClick={handleResendCode}
                            disabled={resendLoading || resendCooldown > 0}
                        >
                            {resendLoading
                                ? "Resending..."
                                : resendCooldown > 0
                                    ? `Resend Code (${resendCooldown}s)`
                                    : "Resend Code"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
export default EmailVerificationPage;
