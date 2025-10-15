import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Share2 } from "lucide-react";
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import './SideNavbar.scss';
import FoodHubLogo from '../../public/Img/FoodHub-Full.png';

const SideNavbar = ({
    open,
    onClose,
    user,
    getProfileImageUrl,
    handleProfileImageClick
}) => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        onClose();
        logout();
        navigate('/');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    // Animation variants
    const sidebarVariants = {
        closed: { x: "-100%", boxShadow: "0px 0px 0px rgba(0,0,0,0)" },
        open: { x: 0, boxShadow: "10px 0px 50px rgba(0,0,0,0.15)" }
    };

    const listItemVariants = {
        closed: { x: -20, opacity: 0 },
        open: i => ({
            x: 0,
            opacity: 1,
            transition: {
                delay: i * 0.05,
            }
        })
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.nav 
                    className="side-navbar" 
                    initial="closed"
                    animate="open"
                    exit="closed"
                    variants={sidebarVariants}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="side-navbar-header">
                        <div className="side-navbar-logo">
                            <img src={FoodHubLogo} alt="FoodHub" />
                        </div>
                        <motion.button 
                            className="close-btn" 
                            onClick={onClose} 
                            aria-label="Close menu"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <i className="bx bx-x"></i>
                        </motion.button>
                    </div>

                    <div className="side-navbar-content">
                        <motion.div className="side-navbar-section" custom={0} variants={listItemVariants}>
                            <div className="section-title">Navigation</div>
                        </motion.div>
                        
                        <motion.div custom={1} variants={listItemVariants}>
                            <Link 
                                to="/" 
                                className={`side-nav-item ${isActive('/') ? 'active' : ''}`} 
                                onClick={onClose}
                            >
                                <div className="icon-container">
                                    <i className="bx bx-home icon"></i>
                                </div>
                                <span className="text">Home</span>
                                {isActive('/') && <div className="active-indicator" />}
                            </Link>
                        </motion.div>
                        
                        <motion.div custom={2} variants={listItemVariants}>
                            <Link 
                                to="/recipes" 
                                className={`side-nav-item ${isActive('/recipes') ? 'active' : ''}`} 
                                onClick={onClose}
                            >
                                <div className="icon-container">
                                    <i className="bx bx-book icon"></i>
                                </div>
                                <span className="text">Recipes</span>
                                {isActive('/recipes') && <div className="active-indicator" />}
                            </Link>
                        </motion.div>
                        
                        <motion.div custom={3} variants={listItemVariants}>
                            <Link 
                                to="/shared-recipes" 
                                className={`side-nav-item ${isActive('/shared-recipes') ? 'active' : ''}`} 
                                onClick={onClose}
                            >
                                <div className="icon-container">
                                    <Share2 size={20} className="icon" />
                                </div>
                                <span className="text">Community</span>
                                {isActive('/shared-recipes') && <div className="active-indicator" />}
                            </Link>
                        </motion.div>
                        
                        {user ? (
                            <>
                                <motion.div className="side-navbar-section" custom={4} variants={listItemVariants}>
                                    <div className="section-title">Create</div>
                                </motion.div>
                                
                                {/* Create Recipe Button for authenticated users */}
                                <motion.div custom={5} variants={listItemVariants}>
                                    <Link 
                                        to="/create-recipe" 
                                        className={`side-nav-item create-recipe-item ${isActive('/create-recipe') ? 'active' : ''}`} 
                                        onClick={onClose}
                                    >
                                        <div className="icon-container">
                                            <i className="bx bx-plus icon"></i>
                                        </div>
                                        <span className="text">New Recipe</span>
                                    </Link>
                                </motion.div>
                                
                                <motion.div className="side-navbar-section" custom={6} variants={listItemVariants}>
                                    <div className="section-title">Account</div>
                                </motion.div>
                                
                                {/* Profile section for authenticated users */}
                                <motion.div custom={7} variants={listItemVariants}>
                                    <div 
                                        className={`side-nav-item profile-item ${isActive('/profile') ? 'active' : ''}`}
                                        onClick={(e) => { handleProfileImageClick(e); onClose(); }}
                                    >
                                        <div className="profile-image-container">
                                            <img src={getProfileImageUrl()} alt="Profile" />
                                        </div>
                                        <div className="profile-info">
                                            <span className="profile-name">{user?.name || 'User'}</span>
                                            <span className="profile-text">View Profile</span>
                                        </div>
                                        {isActive('/profile') && <div className="active-indicator" />}
                                    </div>
                                </motion.div>

                                {/* Logout button */}
                                <motion.div custom={8} variants={listItemVariants}>
                                    <button className="side-nav-item logout-item" onClick={handleLogout}>
                                        <div className="icon-container">
                                            <i className="bx bx-log-out icon"></i>
                                        </div>
                                        <span className="text">Logout</span>
                                    </button>
                                </motion.div>
                            </>
                        ) : (
                            <>
                                {/* Auth buttons for non-authenticated users */}
                                <motion.div className="side-navbar-section" custom={4} variants={listItemVariants}>
                                    <div className="section-title">Account</div>
                                </motion.div>
                                
                                <motion.div custom={5} variants={listItemVariants}>
                                    <Link 
                                        to="/login" 
                                        className={`side-nav-item auth-item ${isActive('/login') ? 'active' : ''}`} 
                                        onClick={onClose}
                                    >
                                        <div className="icon-container">
                                            <i className="bx bx-log-in icon"></i>
                                        </div>
                                        <span className="text">Login</span>
                                        {isActive('/login') && <div className="active-indicator" />}
                                    </Link>
                                </motion.div>
                                
                                <motion.div custom={6} variants={listItemVariants}>
                                    <Link 
                                        to="/signup" 
                                        className={`side-nav-item auth-item signup ${isActive('/signup') ? 'active' : ''}`} 
                                        onClick={onClose}
                                    >
                                        <div className="icon-container">
                                            <i className="bx bx-user-plus icon"></i>
                                        </div>
                                        <span className="text">Sign Up</span>
                                        {isActive('/signup') && <div className="active-indicator" />}
                                    </Link>
                                </motion.div>
                            </>
                        )}
                    </div>
                    
                    <motion.div 
                        className="footer-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ delay: 0.8 }}
                    >
                        FoodHub &copy; {new Date().getFullYear()}
                    </motion.div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
};

export default SideNavbar;