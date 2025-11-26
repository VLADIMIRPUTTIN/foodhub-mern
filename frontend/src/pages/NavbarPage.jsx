import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import FoodHubFull from '../../public/Img/FoodHub-Full.png';
import './NavbarPage.scss';
import ProtectedCreateButton from '../components/ProtectedCreateButton';
import { Share2 } from "lucide-react";
import SideNavbar from '../components/SideNavbar';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSideNavOpen, setIsSideNavOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    const closeProfileMenu = () => {
        setIsProfileMenuOpen(false);
    };

    const handleLogout = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        closeProfileMenu();
        e.target.disabled = true;
        e.target.innerText = "Logging out...";
        
        logout();
        navigate('/login');
    };

    const handleViewProfile = (e) => {
        e.stopPropagation();
        closeProfileMenu();
        navigate('/profile');
    };

    const handleProfileImageClick = (e) => {
        e.stopPropagation();
        navigate('/profile');
    };

    const DEFAULT_PROFILE_IMAGE = "https://i.ibb.co/WvG991xq/profile-default.png";

    const getProfileImageUrl = () => {
        const src = user?.profileImage;
        const DEFAULT = DEFAULT_PROFILE_IMAGE;
        if (!src) return DEFAULT;
        // Base64 or absolute URL (Cloudinary secure_url)
        if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
        // If Cloudinary publicId (no protocol), build URL if cloud name is provided
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (cloudName && !src.startsWith('/') && !src.startsWith('uploads')) {
            return `https://res.cloudinary.com/${cloudName}/image/upload/${src}`;
        }
        // Relative path from backend (e.g., /uploads/...)
        const path = src.startsWith('/') ? src : `/${src}`;
        const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
        return `${baseURL}${path}`;
    };

    const openSideNav = () => setIsSideNavOpen(true);
    const closeSideNav = () => setIsSideNavOpen(false);

    return (
        <>
            {/* Desktop Navbar */}
            <div className="navbar">
                <div className="nav-logo">
                    <Link to="/">
                        <img src={FoodHubFull} alt="FoodHub" className="logo-image" />
                    </Link>
                </div>
                
                <div className="nav-links">
                    <Link to="/" className="nav-link">
                        <i className="bx bx-home icon"></i>
                        <span className="text">Home</span>
                    </Link>
                    <Link to="/recipes" className="nav-link">
                        <i className="bx bx-book icon"></i>
                        <span className="text">Recipes</span>
                    </Link>
                    {/* Show Community Recipes to all users */}
                    <Link to="/shared-recipes" className="nav-link">
                        <span className="icon" style={{ display: "inline-flex", alignItems: "center" }}>
                            <Share2 size={20} style={{ verticalAlign: "middle" }} />
                        </span>
                        <span className="text">Community Recipes</span>
                    </Link>
                </div>

                <div className="profile-section">
                    {user ? (
                        <>
                            {/* Create Recipe button only visible on desktop for authenticated users */}
                            <div className="create-recipe desktop-only">
                                <Link to="/create-recipe" className="create-link">
                                    <i className="bx bx-plus icon"></i>
                                    <span className="text">Create Recipe</span>
                                </Link>
                            </div>
                            <div className="profile-container">
                                <div className="profile-image" onClick={handleProfileImageClick} style={{ cursor: 'pointer' }}>
                                    <img
                                        src={getProfileImageUrl()}
                                        alt="User Profile"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_PROFILE_IMAGE; }}
                                        loading="lazy"
                                    />
                                </div>
                                <button className="dropdown-toggle" onClick={toggleProfileMenu}>
                                    <i className={`bx bx-chevron-down chevron ${isProfileMenuOpen ? 'rotated' : ''}`}></i>
                                </button>
                                {isProfileMenuOpen && (
                                    <div className="profile-dropdown">
                                        <button 
                                            className="dropdown-item" 
                                            onClick={handleViewProfile}
                                        >
                                            <i className="bx bxs-user-circle"></i>
                                            View Profile
                                        </button>
                                        <button 
                                            className="dropdown-item" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                closeProfileMenu();
                                                console.log('Settings clicked');
                                            }}
                                        >
                                            <i className="bx bxs-cog"></i>
                                            Settings
                                        </button>
                                        <hr className="dropdown-divider" />
                                        <button 
                                            className="logout-btn dropdown-item" 
                                            onClick={handleLogout}
                                            style={{
                                                pointerEvents: 'auto',
                                                cursor: 'pointer',
                                                zIndex: 9999
                                            }}
                                        >
                                            <i className="bx bx-log-out-circle"></i>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Show login/signup buttons for non-authenticated users */}
                            <div className="auth-buttons desktop-only">
                                <Link to="/login" className="auth-btn login-btn">
                                    <i className="bx bx-log-in"></i>
                                    <span className="text">Login</span>
                                </Link>
                                <Link to="/signup" className="auth-btn signup-btn">
                                    <i className="bx bx-user-plus"></i>
                                    <span className="text">Sign Up</span>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Mobile SideNavbar Menu Button (top left) */}
            {!isSideNavOpen && (
                <button 
                    className="side-nav-toggle mobile-only"
                    onClick={openSideNav}
                    aria-label="Open menu"
                >
                    <i 
                        className="bx bx-menu icon"
                    ></i>
                </button>
            )}

            {/* Mobile Side Navbar */}
            <SideNavbar 
                open={isSideNavOpen}
                onClose={closeSideNav}
                user={user}
                getProfileImageUrl={getProfileImageUrl}
                handleProfileImageClick={handleProfileImageClick}
            />

            {/* Overlay for SideNavbar */}
            <AnimatePresence>
                {isSideNavOpen && (
                    <motion.div 
                        className="overlay-mobile" 
                        onClick={closeSideNav}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;