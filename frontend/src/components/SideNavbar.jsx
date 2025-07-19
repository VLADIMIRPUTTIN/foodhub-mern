import React from 'react';
import { Link } from 'react-router-dom';
import { Share2 } from "lucide-react";
import ProtectedCreateButton from './ProtectedCreateButton';
import './SideNavbar.scss';

const SideNavbar = ({
    open,
    onClose,
    user,
    getProfileImageUrl,
    handleProfileImageClick
}) => {
    return (
        <nav className={`side-navbar${open ? ' open' : ''}`}>
            <button className="close-btn" onClick={onClose} aria-label="Close menu">
                <i className="bx bx-x"></i>
            </button>
            <Link to="/dashboard" className="side-nav-item" onClick={onClose}>
                <i className="bx bx-home icon"></i>
                <span className="text">Home</span>
            </Link>
            <Link to="/recipes" className="side-nav-item" onClick={onClose}>
                <i className="bx bx-book icon"></i>
                <span className="text">Recipes</span>
            </Link>
            {user && (
                <Link to="/shared-recipes" className="side-nav-item" onClick={onClose}>
                    <span className="icon" style={{ display: "inline-flex", alignItems: "center" }}>
                        <Share2 size={20} style={{ verticalAlign: "middle" }} />
                    </span>
                    <span className="text">Shared</span>
                </Link>
            )}
            {/* Create Recipe Button */}
            <div className="side-nav-item">
                {user ? (
                    <Link to="/create-recipe" className="create-link" onClick={onClose}>
                        <i className="bx bx-plus icon"></i>
                        <span className="text">Create Recipe</span>
                    </Link>
                ) : (
                    <ProtectedCreateButton className="create-link" onClick={onClose}>
                        <i className="bx bx-plus icon"></i>
                        <span className="text">Create Recipe</span>
                    </ProtectedCreateButton>
                )}
            </div>
            {user && (
                <div 
                    className="side-nav-item profile-link" 
                    onClick={(e) => { handleProfileImageClick(e); onClose(); }}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="profile-image">
                        <img src={getProfileImageUrl()} alt="Profile" />
                    </div>
                    <span className="text">Profile</span>
                </div>
            )}
        </nav>
    );
};

export default SideNavbar;