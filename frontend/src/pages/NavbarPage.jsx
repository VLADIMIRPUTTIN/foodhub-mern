import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import FoodHubFull from '../../public/Img/FoodHub-Full.png';
import './NavbarPage.scss';
import ProtectedCreateButton from '../components/ProtectedCreateButton';
import { Share2 } from "lucide-react";

const Navbar = () => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
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

    const DEFAULT_PROFILE_IMAGE = "/Img/profile-icon.jpg";

    const getProfileImageUrl = () => {
        if (!user) return DEFAULT_PROFILE_IMAGE;
        return user.profileImage || 'https://via.placeholder.com/40x40/CF996C/ffffff?text=' + (user?.name?.charAt(0).toUpperCase() || 'U');
    };

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
                            <div className="create-recipe">
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
                            <div className="create-recipe">
                                <ProtectedCreateButton className="create-link">
                                    <i className="bx bx-plus icon"></i>
                                    <span className="text">Create Recipe</span>
                                </ProtectedCreateButton>
                            </div>
                            
                        </>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Navbar */}
            <div className="bottom-navbar">
                <Link to="/dashboard" className="nav-item">
                    <i className="bx bx-home icon"></i>
                    <span className="text">Home</span>
                </Link>
                <Link to="/recipes" className="nav-item">
                    <i className="bx bx-book icon"></i>
                    <span className="text">Recipes</span>
                </Link>
                {/* Only show Shared Recipes in mobile if user is logged in */}
                {user && (
                    <Link to="/shared-recipes" className="nav-item">
                        <span className="icon" style={{ display: "inline-flex", alignItems: "center" }}>
                            <Share2 size={20} style={{ verticalAlign: "middle" }} />
                        </span>
                        <span className="text">Shared</span>
                    </Link>
                )}
                {/* Show Create Recipe button for all users, but redirect to login if not authenticated */}
                <ProtectedCreateButton 
                    className={`create-recipe-btn${!user ? ' logged-out' : ''}`}
                >
                    <i className="bx bx-plus icon"></i>
                </ProtectedCreateButton>
                
                {user ? (
                    <div className="nav-item" onClick={handleProfileImageClick} style={{ cursor: 'pointer' }}>
                        <div className="profile-image">
                            <img src={getProfileImageUrl()} alt="Profile" />
                        </div>
                        <span className="text">Profile</span>
                    </div>
                ) : null}
            </div>

            {/* Click outside handler for mobile */}
            {isProfileMenuOpen && (
                <div 
                    className="overlay-mobile" 
                    onClick={closeProfileMenu}
                />
            )}
        </>
    );
};

export default Navbar;