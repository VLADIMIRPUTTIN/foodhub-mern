import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Home, BookOpen, Plus, User, X } from "lucide-react";
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
        <>
            {/* Backdrop overlay */}
            {open && <div className="sidebar-backdrop" onClick={onClose} />}
            
            <nav className={`side-navbar${open ? ' open' : ''}`}>
                {/* Header Section */}
                <div className="sidebar-header">
                    <div className="brand-section">
                        <div className="brand-icon">
                            <i className="bx bx-restaurant"></i>
                        </div>
                        <h2 className="brand-title">FoodHub</h2>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Section */}
                <div className="nav-section">
                    <div className="nav-group">
                        <span className="nav-group-label">Navigate</span>
                        
                        <Link to="/dashboard" className="nav-item" onClick={onClose}>
                            <div className="nav-item-content">
                                <Home size={20} className="nav-icon" />
                                <span className="nav-text">Dashboard</span>
                            </div>
                        </Link>

                        <Link to="/recipes" className="nav-item" onClick={onClose}>
                            <div className="nav-item-content">
                                <BookOpen size={20} className="nav-icon" />
                                <span className="nav-text">Recipes</span>
                            </div>
                        </Link>

                        <Link to="/shared-recipes" className="nav-item" onClick={onClose}>
                            <div className="nav-item-content">
                                <Share2 size={20} className="nav-icon" />
                                <span className="nav-text">Community</span>
                            </div>
                        </Link>
                    </div>

                    {/* Create Section */}
                    <div className="nav-group">
                        <span className="nav-group-label">Create</span>
                        
                        <div className="create-recipe-wrapper">
                            {user ? (
                                <Link to="/create-recipe" className="create-recipe-btn" onClick={onClose}>
                                    <Plus size={18} className="create-icon" />
                                    <span>New Recipe</span>
                                </Link>
                            ) : (
                                <ProtectedCreateButton className="create-recipe-btn" onClick={onClose}>
                                    <Plus size={18} className="create-icon" />
                                    <span>New Recipe</span>
                                </ProtectedCreateButton>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Section - Bottom */}
                {user && (
                    <div className="profile-section">
                        <div 
                            className="profile-card" 
                            onClick={(e) => { handleProfileImageClick(e); onClose(); }}
                        >
                            <div className="profile-avatar">
                                <img src={getProfileImageUrl()} alt="Profile" />
                                <div className="profile-status"></div>
                            </div>
                            <div className="profile-info">
                                <span className="profile-name">Profile</span>
                                <span className="profile-email">View & Edit</span>
                            </div>
                            <User size={16} className="profile-arrow" />
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

export default SideNavbar;