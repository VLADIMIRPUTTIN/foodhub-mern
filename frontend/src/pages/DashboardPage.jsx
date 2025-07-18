import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import Navbar from "./NavbarPage";
import './DashboardPage.scss';

const DashboardPage = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    // PWA install prompt state
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        });

        window.addEventListener('appinstalled', () => {
            setShowInstallBtn(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', () => {});
            window.removeEventListener('appinstalled', () => {});
        };
    }, []);

    const handleInstallApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowInstallBtn(false);
            }
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleGetStarted = () => {
        if (user) {
            navigate('/recipes');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="dashboard-page">
            <Navbar />
            
            {/* Hero Section */}
            <section className="hero-section">
                <div className="overlay"></div>
                <div className="hero-content">
                    <div className="hero-text">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            {user ? `Welcome Back, ${user.name}!` : 'Welcome to FoodHub!'}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            Discover delicious recipes based on what's already in your kitchen. Save time, reduce waste, and cook with confidence.
                        </motion.p>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: "1.2rem" }}>
                            <motion.button
                                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    duration: 0.8,
                                    delay: 0.4,
                                    type: "spring",
                                    stiffness: 200
                                }}
                                whileHover={{
                                    scale: 1.05,
                                    y: -3,
                                    boxShadow: "0 15px 30px rgba(207, 153, 108, 0.4)"
                                }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGetStarted}
                                className="get-started-btn"
                            >
                                <i className="bx bx-rocket"></i>
                                {user ? 'Get Started' : 'Join Now'}
                            </motion.button>
                            {showInstallBtn && (
                                <motion.button
                                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 0.5,
                                        type: "spring",
                                        stiffness: 200
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        y: -3,
                                        boxShadow: "0 15px 30px rgba(207, 153, 108, 0.4)"
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleInstallApp}
                                    className="install-app-btn"
                                    style={{
                                        background: "#10b981",
                                        color: "#fff",
                                        borderRadius: "30px",
                                        padding: "0.7rem 1.2rem",
                                        fontWeight: 700,
                                        fontSize: "1rem",
                                        border: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <i className="bx bx-download"></i>
                                    Install App
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Actions Section */}
            <section className="actions-section">
                <div className="container">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="section-title"
                    >
                        How FoodHub Works
                    </motion.h2>
                    <div className="actions-grid">
                        {/* Card 1 - Enter Ingredients */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, rotateX: -15 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{ 
                                delay: 0.4, 
                                duration: 0.6,
                                type: "spring",
                                stiffness: 120 
                            }}
                            whileHover={{ 
                                scale: 1.08,
                                y: -15,
                                rotateY: 5,
                                boxShadow: "0 25px 50px rgba(207, 153, 108, 0.25)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="action-card"
                        >
                            <motion.div 
                                className="action-number"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                    delay: 0.6, 
                                    type: "spring", 
                                    stiffness: 200,
                                    damping: 10
                                }}
                                whileHover={{
                                    scale: 1.2,
                                    rotate: 360,
                                    transition: { duration: 0.6 }
                                }}
                            >
                                1
                            </motion.div>
                            <motion.div 
                                className="action-icon"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                    delay: 0.7, 
                                    duration: 0.8,
                                    type: "spring",
                                    bounce: 0.4
                                }}
                                whileHover={{ 
                                    scale: 1.4,
                                    rotate: [0, -15, 15, 0],
                                    y: [-3, 0],
                                    transition: { duration: 0.6 }
                                }}
                            >
                                <i className="bx bx-leaf"></i>
                            </motion.div>
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                whileHover={{ 
                                    color: "#BB8860",
                                    scale: 1.05
                                }}
                            >
                                Enter Ingredients
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9, duration: 0.5 }}
                            >
                                List what you have in your kitchen
                            </motion.p>
                        </motion.div>

                        {/* Card 2 - Discover Recipes */}
                        <motion.div
                            initial={{ opacity: 0, x: -50, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ 
                                delay: 0.5, 
                                duration: 0.7,
                                type: "spring",
                                stiffness: 100
                            }}
                            whileHover={{ 
                                scale: 1.08,
                                y: -15,
                                rotateZ: 2,
                                boxShadow: "0 25px 50px rgba(207, 153, 108, 0.25)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="action-card"
                        >
                            <motion.div 
                                className="action-number"
                                initial={{ scale: 0, y: -30 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ 
                                    delay: 0.7, 
                                    type: "spring", 
                                    stiffness: 200,
                                    bounce: 0.6
                                }}
                                whileHover={{
                                    scale: 1.2,
                                    y: [-5, 0],
                                    transition: { duration: 0.4, yoyo: Infinity }
                                }}
                            >
                                2
                            </motion.div>
                            <motion.div 
                                className="action-icon"
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                    delay: 0.8, 
                                    duration: 0.6,
                                    type: "spring"
                                }}
                                whileHover={{ 
                                    scale: 1.4,
                                    rotate: 360,
                                    transition: { duration: 0.8, ease: "easeInOut" }
                                }}
                            >
                                <i className="bx bx-search"></i>
                            </motion.div>
                            <motion.h3
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9, duration: 0.5 }}
                                whileHover={{ 
                                    color: "#BB8860",
                                    x: 5
                                }}
                            >
                                Discover Recipes
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.0, duration: 0.5 }}
                            >
                                Browse matching recipes instantly
                            </motion.p>
                        </motion.div>

                        {/* Card 3 - Choose & Cook */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                                delay: 0.6, 
                                duration: 0.8,
                                type: "spring",
                                stiffness: 80
                            }}
                            whileHover={{ 
                                scale: 1.08,
                                y: -15,
                                rotateX: 5,
                                boxShadow: "0 25px 50px rgba(207, 153, 108, 0.25)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="action-card"
                        >
                            <motion.div 
                                className="action-number"
                                initial={{ scale: 0, x: -50 }}
                                animate={{ scale: 1, x: 0 }}
                                transition={{ 
                                    delay: 0.8, 
                                    type: "spring", 
                                    stiffness: 150,
                                    damping: 8
                                }}
                                whileHover={{
                                    scale: 1.2,
                                    rotate: [0, 10, -10, 0],
                                    transition: { duration: 0.5 }
                                }}
                            >
                                3
                            </motion.div>
                            <motion.div 
                                className="action-icon"
                                initial={{ scale: 0, y: -30 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{ 
                                    delay: 0.9, 
                                    type: "spring", 
                                    bounce: 0.6,
                                    stiffness: 200
                                }}
                                whileHover={{ 
                                    scale: 1.4,
                                    y: [-8, 0, -8, 0],
                                    rotate: [0, 5, -5, 0],
                                    transition: { duration: 0.8, repeat: 1 }
                                }}
                            >
                                <i className="bx bx-restaurant"></i>
                            </motion.div>
                            <motion.h3
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.0, duration: 0.5 }}
                                whileHover={{ 
                                    color: "#BB8860",
                                    y: -2
                                }}
                            >
                                Choose & Cook
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.1, duration: 0.5 }}
                            >
                                Select and follow easy instructions
                            </motion.p>
                        </motion.div>

                        {/* Card 4 - Share & Save */}
                        <motion.div
                            initial={{ opacity: 0, x: 50, rotateY: 15 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{ 
                                delay: 0.7, 
                                duration: 0.8,
                                type: "spring",
                                stiffness: 90
                            }}
                            whileHover={{ 
                                scale: 1.08,
                                y: -15,
                                rotateY: -3,
                                boxShadow: "0 25px 50px rgba(207, 153, 108, 0.25)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            className="action-card"
                        >
                            <motion.div 
                                className="action-number"
                                initial={{ scale: 0, rotate: 360 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                    delay: 0.9, 
                                    type: "spring", 
                                    stiffness: 180,
                                    damping: 12
                                }}
                                whileHover={{
                                    scale: 1.2,
                                    rotate: [-10, 10, -10, 0],
                                    transition: { duration: 0.6 }
                                }}
                            >
                                4
                            </motion.div>
                            <motion.div 
                                className="action-icon"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ 
                                    delay: 1.0, 
                                    type: "spring", 
                                    stiffness: 300,
                                    duration: 0.6
                                }}
                                whileHover={{ 
                                    scale: [1.4, 1.2, 1.4],
                                    rotate: [0, 10, -10, 0],
                                    transition: { 
                                        duration: 0.8, 
                                        repeat: Infinity, 
                                        repeatType: "reverse" 
                                    }
                                }}
                            >
                                <i className="bx bx-heart"></i>
                            </motion.div>
                            <motion.h3
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.1, duration: 0.5 }}
                                whileHover={{ 
                                    color: "#BB8860",
                                    scale: 1.05
                                }}
                            >
                                Share & Save
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2, duration: 0.5 }}
                            >
                                Keep your favorites for later
                            </motion.p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Logout Section - Only show if user is logged in */}
            {user && (
                <section className="logout-section">
                    <div className="container">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.3, duration: 0.6 }}
                        >
                            Ready to Sign Out?
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                        >
                            Thank you for using FoodHub. We hope to see you again soon!
                        </motion.p>
                        <motion.button
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 1.5, duration: 0.6, type: "spring" }}
                            whileHover={{ 
                                scale: 1.05,
                                y: -3,
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
                            }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleLogout}
                            className="logout-btn"
                        >
                            <i className="bx bx-log-out"></i>
                            Logout
                        </motion.button>
                    </div>
                </section>
            )}
        </div>
    );
};

export default DashboardPage;
