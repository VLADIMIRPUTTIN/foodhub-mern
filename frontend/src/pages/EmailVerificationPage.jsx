import { useRef, useState, useEffect } from "react";
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
        // Only allow numbers (0-9) - filter out any non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');
        
        const newCode = [...code];

        // Handle pasted content
        if (numericValue.length > 1) {
            const pastedCode = numericValue.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedCode[i] || "";
            }
            setCode(newCode);

            // Focus on the last non-empty input or the first empty one
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
            inputRefs.current[focusIndex].focus();
        } else {
            // Only set the value if it's a single digit number
            if (numericValue.length <= 1) {
                newCode[index] = numericValue;
                setCode(newCode);

                // Move focus to the next input field if value is entered
                if (numericValue && index < 5) {
                    inputRefs.current[index + 1].focus();
                }
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Allow backspace to move to previous input
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
        
        // Prevent non-numeric keys (except navigation and control keys)
        const allowedKeys = [
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Home', 'End'
        ];
        
        const isNumber = /^[0-9]$/.test(e.key);
        const isAllowedKey = allowedKeys.includes(e.key);
        const isCtrlV = e.ctrlKey && e.key === 'v'; // Allow Ctrl+V for paste
        const isCmdV = e.metaKey && e.key === 'v'; // Allow Cmd+V for paste (Mac)
        
        if (!isNumber && !isAllowedKey && !isCtrlV && !isCmdV) {
            e.preventDefault();
            
            // Show toast message for invalid input
            if (e.key.match(/[a-zA-Z]/)) {
                toast.error("Only numbers are allowed");
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        
        // Only allow numeric characters from paste
        const numericPaste = pasteData.replace(/[^0-9]/g, '');
        
        if (numericPaste.length === 0) {
            toast.error("Only numbers are allowed");
            return;
        }
        
        if (numericPaste.length > 6) {
            toast.error("Please paste only 6 digits");
            return;
        }
        
        // Fill the inputs with pasted numbers
        const newCode = [...code];
        const pastedCode = numericPaste.slice(0, 6).split("");
        
        for (let i = 0; i < 6; i++) {
            newCode[i] = pastedCode[i] || "";
        }
        
        setCode(newCode);
        
        // Focus on the last filled input or the first empty one
        const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
        const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
        inputRefs.current[focusIndex].focus();
        
        toast.success(`${numericPaste.length} digits pasted successfully`);
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
        
        // Validate that all characters are numbers
        if (!/^\d{6}$/.test(verificationCode)) {
            toast.error("Code must contain only numbers");
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
        if (resendLoading || resendCooldown > 0) return;
        
        setResendLoading(true);
        try {
            // Use the email from the user object in authStore
            const { user } = useAuthStore.getState();
            const email = user?.email;
            
            if (!email) {
                toast.error("No email found. Please log in again.");
                setResendLoading(false);
                return;
            }

            console.log("🔄 Resending verification code to:", email);
            
            const response = await axios.post(`${API_URL}/resend-verification`, { email }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("✅ Resend response:", response.data);
            
            toast.success("Verification code resent! Please check your email.");
            setResendCooldown(60); // 60 seconds cooldown
            
            // Clear the current code input
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
            
        } catch (error) {
            console.error("❌ Resend failed:", error);
            console.error("Error response:", error.response?.data);
            
            const errorMessage = error.response?.data?.message || "Failed to resend verification code";
            toast.error(errorMessage);
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
                <div className="verification-header">
                    <div className="verification-icon">
                        <i className="bx bx-envelope"></i>
                    </div>
                    <h2 className="email-verification-title">Verify Your Email</h2>
                    <p className="email-verification-desc">
                        Enter the 6-digit verification code sent to your email address.
                        <br />
                        <span className="input-hint">Numbers only (0-9)</span>
                    </p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="code-inputs">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric" // Shows numeric keyboard on mobile
                                pattern="[0-9]*" // Additional hint for numeric input
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="code-input"
                                disabled={isSubmitting}
                                placeholder="0"
                                autoComplete="one-time-code"
                            />
                        ))}
                    </div>
                    
                    {error && <p className="error-message">{error}</p>}
                    
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading || isSubmitting || code.some((digit) => !digit)}
                        className="verify-btn"
                    >
                        <span className="btn-content">
                            {isLoading || isSubmitting ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-check-circle"></i>
                                    Verify Email
                                </>
                            )}
                        </span>
                    </motion.button>
                    
                    <div className="resend-section">
                        <motion.button
                            type="button"
                            className="resend-btn"
                            onClick={handleResendCode}
                            disabled={resendLoading || resendCooldown > 0}
                            whileHover={{ scale: resendLoading || resendCooldown > 0 ? 1 : 1.02 }}
                            whileTap={{ scale: resendLoading || resendCooldown > 0 ? 1 : 0.98 }}
                        >
                            <span className="btn-content">
                                {resendLoading ? (
                                    <>
                                        <div className="btn-spinner"></div>
                                        Resending...
                                    </>
                                ) : resendCooldown > 0 ? (
                                    <>
                                        <i className="bx bx-time-five"></i>
                                        Resend Code ({resendCooldown}s)
                                    </>
                                ) : (
                                    <>
                                        <i className="bx bx-refresh"></i>
                                        Resend Code
                                    </>
                                )}
                            </span>
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EmailVerificationPage;
