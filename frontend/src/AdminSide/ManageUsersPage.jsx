import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './ManageUsersPage.scss';

const baseURL = import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "";

const ManageUsersPage = ({ users, fetchUsers }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [suspendMinutes, setSuspendMinutes] = useState('');
    const [suspensionReason, setSuspensionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Enhanced Filter users based on search term - searches all relevant fields
    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true; // Show all users if no search term
        
        const searchLower = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            user.role?.toLowerCase().includes(searchLower) ||
            user.status?.toLowerCase().includes(searchLower) ||
            user._id?.toLowerCase().includes(searchLower) ||
            // Search by user ID (last 6 characters)
            user._id?.slice(-6).toLowerCase().includes(searchLower) ||
            // Search by creation date
            (user.createdAt && new Date(user.createdAt).toLocaleDateString().includes(searchTerm)) ||
            // Search by last login date
            (user.lastLogin && new Date(user.lastLogin).toLocaleDateString().includes(searchTerm))
        );
    });

    // Clear messages after 3 seconds
    const clearMessage = (type) => {
        setTimeout(() => {
            if (type === 'error') setError('');
            if (type === 'success') setSuccess('');
        }, 3000);
    };

    // Handle Activate User
    const handleActivate = async (userId) => {
        setActionLoading(true);
        try {
            await axios.patch(`${baseURL}/api/users/${userId}/activate`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            setSuccess('User activated successfully!');
            clearMessage('success');
        } catch (error) {
            setError('Failed to activate user. Please try again.');
            clearMessage('error');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Suspend User
    const handleSuspend = async () => {
        if (!selectedUser || !suspendMinutes) return;
        
        setActionLoading(true);
        try {
            const response = await axios.patch(
                `${baseURL}/api/users/${selectedUser._id}/suspend`,
                { 
                    minutes: parseInt(suspendMinutes),
                    reason: suspensionReason 
                },
                { withCredentials: true }
            );
            
            setSuccess(response.data.message);
            fetchUsers();
            closeAllModals();
            clearMessage('success');
        } catch (error) {
            setError('Failed to suspend user. Please try again.');
            clearMessage('error');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Ban User
    const handleBan = async () => {
        setActionLoading(true);
        try {
            await axios.patch(`${baseURL}/api/users/${selectedUser._id}/ban`, 
                { reason: "Banned by admin" }, 
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            await fetchUsers();
            setSuccess('User banned successfully!');
            setShowBanModal(false);
            setSelectedUser(null);
            clearMessage('success');
        } catch (error) {
            setError('Failed to ban user. Please try again.');
            clearMessage('error');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Delete User
    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await axios.delete(`${baseURL}/api/users/${selectedUser._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            setSuccess('User account deleted successfully!');
            setShowDeleteModal(false);
            setSelectedUser(null);
            clearMessage('success');
        } catch (error) {
            setError('Failed to delete user. Please try again.');
            clearMessage('error');
        } finally {
            setActionLoading(false);
        }
    };

    const closeAllModals = () => {
        setShowDeleteModal(false);
        setShowSuspendModal(false);
        setShowBanModal(false);
        setSelectedUser(null);
        setSuspendMinutes('');
        setSuspensionReason('');
    };

    // Clear search function
    const clearSearch = () => {
        setSearchTerm('');
    };

    return (
        <div className="manage-users-page">
            <div className="page-header">
                <div className="header-content">
                    <h2 className="page-title">
                        <i className="bx bx-group"></i>
                        User Management
                    </h2>
                    <p className="page-subtitle">Manage user accounts, permissions, and status</p>
                </div>
                
                {/* Enhanced Search Bar */}
                <div className="search-container">
                    <div className="search-wrapper">
                        <i className="bx bx-search search-icon"></i>
                        <input
                            type="text"
                            placeholder="Search by name, email, role, status, ID, or date..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button 
                                className="clear-search"
                                onClick={clearSearch}
                                title="Clear search"
                            >
                                <i className="bx bx-x"></i>
                            </button>
                        )}
                    </div>
                    
                    {/* Search Results Info */}
                    {searchTerm && (
                        <div className="search-results">
                            <i className="bx bx-filter"></i>
                            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} 
                            {searchTerm && ` matching "${searchTerm}"`}
                        </div>
                    )}
                    
                    {/* Search Tips */}
                    {searchTerm && filteredUsers.length === 0 && (
                        <div className="search-tips">
                            <p>Try searching for:</p>
                            <ul>
                                <li>User name (e.g., "John")</li>
                                <li>Email address (e.g., "john@example.com")</li>
                                <li>Role (e.g., "admin", "user")</li>
                                <li>Status (e.g., "active", "banned", "suspended")</li>
                                <li>User ID (e.g., last 6 characters)</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Alert Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="alert alert--error"
                    >
                        <i className="bx bx-error-circle alert__icon"></i>
                        {error}
                        <button onClick={() => setError('')} className="alert__close">
                            <i className="bx bx-x"></i>
                        </button>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="alert alert--success"
                    >
                        <i className="bx bx-check-circle alert__icon"></i>
                        {success}
                        <button onClick={() => setSuccess('')} className="alert__close">
                            <i className="bx bx-x"></i>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Users Table */}
            <div className="users-table-container">
                <div className="table-header">
                    <h3 className="table-title">
                        <i className="bx bx-user-detail"></i>
                        {searchTerm ? `Search Results (${filteredUsers.length})` : `All Users (${filteredUsers.length})`}
                    </h3>
                    {searchTerm && (
                        <button 
                            className="clear-all-filters"
                            onClick={clearSearch}
                            title="Clear all filters"
                        >
                            <i className="bx bx-x"></i>
                            Clear Filters
                        </button>
                    )}
                </div>
                
                <div className="table-wrapper">
                    {filteredUsers.length === 0 ? (
                        <div className="empty-state">
                            <i className="bx bx-user-x empty-icon"></i>
                            <h3>
                                {searchTerm ? 'No users found' : 'No users registered'}
                            </h3>
                            <p>
                                {searchTerm 
                                    ? `No users match your search for "${searchTerm}"`
                                    : "No users registered in the system yet"
                                }
                            </p>
                            {searchTerm && (
                                <button 
                                    className="btn btn--primary"
                                    onClick={clearSearch}
                                >
                                    <i className="bx bx-refresh"></i>
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Last Login</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, index) => (
                                    <motion.tr
                                        key={user._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="user-row"
                                    >
                                        <td className="user-info">
                                            <div className="user-avatar">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt={user.name} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">
                                                    {/* Highlight search term in name */}
                                                    {searchTerm && user.name?.toLowerCase().includes(searchTerm.toLowerCase()) 
                                                        ? user.name.replace(
                                                            new RegExp(`(${searchTerm})`, 'gi'),
                                                            '<mark>$1</mark>'
                                                        )
                                                        : user.name
                                                    }
                                                </span>
                                                <span className="user-id">ID: {user._id.slice(-6)}</span>
                                            </div>
                                        </td>
                                        <td className="user-email">
                                            {/* Highlight search term in email */}
                                            {searchTerm && user.email?.toLowerCase().includes(searchTerm.toLowerCase()) 
                                                ? <span dangerouslySetInnerHTML={{
                                                    __html: user.email.replace(
                                                        new RegExp(`(${searchTerm})`, 'gi'),
                                                        '<mark>$1</mark>'
                                                    )
                                                }} />
                                                : user.email
                                            }
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${user.role}`}>
                                                <i className={`bx ${user.role === 'admin' ? 'bx-crown' : 'bx-user'}`}></i>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${user.status}`}>
                                                <div className={`status-dot status-dot-${user.status}`}></div>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="date-cell">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="date-cell">
                                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn btn--success btn--sm"
                                                    onClick={() => handleActivate(user._id)}
                                                    disabled={user.status === 'active' || actionLoading}
                                                    title="Activate User"
                                                >
                                                    <i className="bx bx-check"></i>
                                                    <span>Activate</span>
                                                </button>
                                                
                                                <button
                                                    className="btn btn--warning btn--sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowSuspendModal(true);
                                                    }}
                                                    disabled={user.status === 'suspended' || actionLoading}
                                                    title="Suspend User"
                                                >
                                                    <i className="bx bx-pause-circle"></i>
                                                    <span>Suspend</span>
                                                </button>
                                                
                                                <button
                                                    className="btn btn--destructive btn--sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowBanModal(true);
                                                    }}
                                                    disabled={user.status === 'banned' || actionLoading}
                                                    title="Ban User"
                                                >
                                                    <i className="bx bx-block"></i>
                                                    <span>Ban</span>
                                                </button>
                                                
                                                <button
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    disabled={actionLoading}
                                                    title="Delete User"
                                                >
                                                    <i className="bx bx-trash"></i>
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Suspend Modal */}
            <AnimatePresence>
                {showSuspendModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--small"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal__header">
                                <h3 className="modal__title">
                                    <i className="bx bx-pause-circle"></i>
                                    Suspend User
                                </h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>How long do you want to suspend <strong>{selectedUser.name}</strong>?</p>
                                <div className="form-group">
                                    <label className="form-label">Suspension Duration (minutes)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Enter minutes (e.g. 60)"
                                        value={suspendMinutes}
                                        onChange={(e) => setSuspendMinutes(e.target.value)}
                                        min="1"
                                        step="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reason for Suspension</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Enter reason for suspension..."
                                        value={suspensionReason}
                                        onChange={(e) => setSuspensionReason(e.target.value)}
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="modal__actions">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--warning"
                                    onClick={handleSuspend}
                                    disabled={actionLoading || !suspendMinutes}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Suspending...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-pause-circle"></i>
                                            Suspend User
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Ban Modal */}
                {showBanModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--small"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal__header">
                                <h3 className="modal__title">
                                    <i className="bx bx-block"></i>
                                    Ban User
                                </h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Are you sure you want to ban <strong>{selectedUser.name}</strong>?</p>
                                <p className="warning-text">
                                    <i className="bx bx-error-alt"></i>
                                    This action will permanently ban the user from accessing the platform.
                                </p>
                            </div>

                            <div className="modal__actions">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--destructive"
                                    onClick={handleBan}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Banning...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-block"></i>
                                            Yes, Ban User
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--small"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal__header">
                                <h3 className="modal__title">
                                    <i className="bx bx-trash"></i>
                                    Delete User Account
                                </h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Are you sure you want to delete <strong>{selectedUser.name}'s</strong> account?</p>
                                <p className="warning-text">
                                    <i className="bx bx-error-alt"></i>
                                    This action cannot be undone. All user data, recipes, and associated content will be permanently removed.
                                </p>
                            </div>

                            <div className="modal__actions">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--destructive"
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="btn__loading">
                                            <span className="spinner"></span>
                                            Deleting...
                                        </span>
                                    ) : (
                                        <>
                                            <i className="bx bx-trash"></i>
                                            Yes, Delete Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageUsersPage;