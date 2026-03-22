import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Share2, Camera } from 'lucide-react';
import CameraModal from './CameraModal';

const BottomNavbar = ({ user, getProfileImageUrl, onProfileClick }) => {
    const location = useLocation();
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="bottom-navbar">
                <Link
                    to="/dashboard"
                    className={`nav-item${isActive('/dashboard') ? ' active' : ''}`}
                    aria-label="Home"
                >
                    <i className="bx bx-home icon"></i>
                    <span className="text">Home</span>
                </Link>

                <Link
                    to="/recipes"
                    className={`nav-item${isActive('/recipes') ? ' active' : ''}`}
                    aria-label="Recipes"
                >
                    <i className="bx bx-book icon"></i>
                    <span className="text">Recipes</span>
                </Link>

                <button
                    className="create-recipe-btn"
                    aria-label="Open Camera"
                    onClick={() => setIsCameraOpen(true)}
                >
                    <Camera className="icon" size={24} />
                </button>

                {user ? (
                    <Link
                        to="/shared-recipes"
                        className={`nav-item${isActive('/shared-recipes') ? ' active' : ''}`}
                        aria-label="Shared Recipes"
                    >
                        <span className="icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <Share2 size={17} />
                        </span>
                        <span className="text">Shared</span>
                    </Link>
                ) : (
                    <Link
                        to="/login"
                        className="nav-item"
                        aria-label="Shared Recipes (login required)"
                    >
                        <span className="icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            <Share2 size={17} />
                        </span>
                        <span className="text">Shared</span>
                    </Link>
                )}

                {user ? (
                    <div
                        className="nav-item"
                        onClick={onProfileClick}
                        style={{ cursor: 'pointer' }}
                        aria-label="Profile"
                    >
                        <div className="profile-image">
                        <img src={getProfileImageUrl?.() || ''} alt="Profile" />
                        </div>
                        <span className="text">Profile</span>
                    </div>
                ) : (
                    <Link to="/login" className="nav-item" aria-label="Login">
                        <i className="bx bx-user icon"></i>
                        <span className="text">Login</span>
                    </Link>
                )}
            </nav>

            <CameraModal
                open={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
            />
        </>
    );
};

export default BottomNavbar;