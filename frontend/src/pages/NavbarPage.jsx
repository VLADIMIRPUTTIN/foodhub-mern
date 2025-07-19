import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import FoodHubFull from '../../public/Img/FoodHub-Full.png';
import './NavbarPage.scss';
import ProtectedCreateButton from '../components/ProtectedCreateButton';
import { Share2 } from "lucide-react";
import SideNavbar from '../components/SideNavbar';

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
        console.log('Logout button clicked!');
        closeProfileMenu();
        logout();
    };

    const handleViewProfile = (e) => {
        e.stopPropagation();
        closeProfileMenu();
        navigate('/profile');
    };

    // Handle profile image click
    const handleProfileImageClick = (e) => {
        e.stopPropagation();
        navigate('/profile');
    };

    const DEFAULT_PROFILE_IMAGE = "https://i.ibb.co/WvG991xq/profile-default.png";

    const getProfileImageUrl = () => {
        if (!user) return DEFAULT_PROFILE_IMAGE;
        return user.profileImage || DEFAULT_PROFILE_IMAGE;
    };

    const openSideNav = () => setIsSideNavOpen(true);
    const closeSideNav = () => setIsSideNavOpen(false);

    return (
        <>
            {/* Desktop Navbar */}
            <div className="navbar">
                <div className="nav-logo">
                    <Link to="/dashboard">
                        <img src={FoodHubFull} alt="FoodHub" className="logo-image" />
                    </Link>
                </div>
                
                <div className="nav-links">
                    <Link to="/dashboard" className="nav-link">
                        <i className="bx bx-home icon"></i>
                        <span className="text">Home</span>
                    </Link>
                    <Link to="/recipes" className="nav-link">
                        <i className="bx bx-book icon"></i>
                        <span className="text">Recipes</span>
                    </Link>
                    {/* Only show Shared Recipes if user is logged in */}
                    {user && (
                        <Link to="/shared-recipes" className="nav-link">
                            <span className="icon" style={{ display: "inline-flex", alignItems: "center" }}>
                                <Share2 size={20} style={{ verticalAlign: "middle" }} />
                            </span>
                            <span className="text">Shared Recipes</span>
                        </Link>
                    )}
                </div>

                <div className="profile-section">
                    {user ? (
                        <>
                            {/* Create Recipe button only visible on desktop */}
                            <div className="create-recipe desktop-only">
                                <Link to="/create-recipe" className="create-link">
                                    <i className="bx bx-plus icon"></i>
                                    <span className="text">Create Recipe</span>
                                </Link>
                            </div>
                            <div className="profile-container">
                                <div className="profile-image" onClick={handleProfileImageClick} style={{ cursor: 'pointer' }}>
                                    <img src={getProfileImageUrl()} alt="User Profile" />
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
                            <div className="create-recipe desktop-only">
                                <ProtectedCreateButton className="create-link">
                                    <i className="bx bx-plus icon"></i>
                                    <span className="text">Create Recipe</span>
                                </ProtectedCreateButton>
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
            {isSideNavOpen && (
                <div 
                    className="overlay-mobile" 
                    onClick={closeSideNav}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.2)",
                        zIndex: 1999
                    }}
                />
            )}
        </>
    );
};

export default Navbar;