import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import './EmailVerificationPage.scss';

const API_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api/auth" 
    : "/api/auth";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { error, isLoading, verifyEmail, user, checkAuth } = useAuthStore();
    const [userEmail, setUserEmail] = useState("");
    const [showEmailInput, setShowEmailInput] = useState(false);
    const checkedAuthRef = useRef(false);

    // Resolve the email once user is available
    useEffect(() => {
        if (user?.email) {
            setUserEmail(user.email);
        } else if (!checkedAuthRef.current) {
            // Try once to refresh auth state if user hasn't loaded yet
            checkedAuthRef.current = true;
            checkAuth();
        }
    }, [user]);

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        // Extract only numbers from pasted data
        const numbers = pastedData.replace(/\D/g, '');
        
        if (numbers.length === 6) {
            const newCode = numbers.split('').slice(0, 6);
            setCode(newCode);
            // Focus last input
            inputRefs.current[5]?.focus();
            toast.success("Code pasted successfully!");
        } else {
            toast.error("Please paste a 6-digit code");
        }
    };

    const handleChange = (index, value) => {
        // Handle single character input
        if (value.length === 1) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Move focus to next input
            if (index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace") {
            e.preventDefault();
            const newCode = [...code];
            
            if (code[index]) {
                // Clear current field
                newCode[index] = "";
                setCode(newCode);
            } else if (index > 0) {
                // Move to previous field and clear it
                newCode[index - 1] = "";
                setCode(newCode);
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            const response = await verifyEmail(verificationCode);
            
            if (response && response.user) {
                // ✅ Check if user needs onboarding
                if (!response.user.hasCompletedOnboarding && response.user.role !== 'admin') {
                    navigate("/onboarding");
                } else if (response.user.role === 'admin') {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/");
                }
                toast.success("Email verified successfully!");
            }
        } catch (error) {
            console.error("Verification failed:", error);
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        const email = userEmail || useAuthStore.getState().user?.email;
        if (!email) {
            setShowEmailInput(true);
            toast.error("We couldn't find your email. Please enter it below to resend the code.");
            return;
        }
        setResendLoading(true);
        try {
            await axios.post(`${API_URL}/resend-verification`, { email });
            toast.success(`Verification code resent to ${email}!`);
            setResendCooldown(30); // 30 seconds cooldown
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend code");
        } finally {
            setResendLoading(false);
        }
    };

    const handleManualResend = async (e) => {
        e.preventDefault();
        if (!userEmail) {
            toast.error("Please enter your email address");
            return;
        }
        setResendLoading(true);
        try {
            await axios.post(`${API_URL}/resend-verification`, { email: userEmail });
            toast.success(`Verification code sent to ${userEmail}!`);
            setShowEmailInput(false);
            setResendCooldown(30);
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

    // Auto submit when all fields are filled
    useEffect(() => {
        if (code.every((digit) => digit !== "") && !isSubmitting) {
            handleSubmit(new Event("submit"));
        }
    }, [code]);

    return (
        <div className="email-verification-container">
            <div className="email-verification-card">
                <div className="verification-header">
                    <div className="verification-icon">
                        <i className="bx bx-envelope"></i>
                    </div>
                    <h2 className="email-verification-title">Verify Your Email</h2>
                    <p className="email-verification-desc">
                        Enter the 6-digit code sent to your email address.
                        {userEmail && (
                            <span className="user-email-display"> A code was sent to <strong>{userEmail}</strong>.</span>
                        )}
                        <span className="input-hint">You can paste the code with Ctrl+V</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="code-inputs">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className={`code-input ${error ? 'error' : ''} ${digit ? 'success' : ''}`}
                                placeholder="•"
                                disabled={isLoading || isSubmitting}
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="verify-btn"
                        disabled={isLoading || isSubmitting || code.some((digit) => !digit)}
                    >
                        {isLoading || isSubmitting ? (
                            <div className="btn-content">
                                <div className="btn-spinner"></div>
                                <span>Verifying...</span>
                            </div>
                        ) : (
                            <div className="btn-content">
                                <i className="bx bx-check-circle"></i>
                                <span>Verify Email</span>
                            </div>
                        )}
                    </button>
                </form>

                <div className="resend-section">
                    <button
                        type="button"
                        className="resend-btn"
                        onClick={handleResendCode}
                        disabled={resendLoading || resendCooldown > 0}
                    >
                        {resendLoading ? (
                            <div className="btn-content">
                                <div className="btn-spinner"></div>
                                <span>Sending...</span>
                            </div>
                        ) : resendCooldown > 0 ? (
                            <div className="btn-content">
                                <i className="bx bx-time"></i>
                                <span>Resend in {resendCooldown}s</span>
                            </div>
                        ) : (
                            <div className="btn-content">
                                <i className="bx bx-refresh"></i>
                                <span>Resend Code</span>
                            </div>
                        )}
                    </button>

                    {showEmailInput && (
                        <form onSubmit={handleManualResend} className="manual-email-form">
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                required
                                className="email-input"
                            />
                            <button type="submit" className="resend-btn" disabled={resendLoading}>
                                {resendLoading ? "Sending..." : "Send Code"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            <Toaster position="top-center" />
        </div>
    );
};

export default EmailVerificationPage;
