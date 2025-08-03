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
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        if (!suspendMinutes || suspendMinutes < 1) {
            setError('Please enter a valid number of minutes');
            clearMessage('error');
            return;
        }

        setActionLoading(true);
        try {
            await axios.patch(`${baseURL}/api/users/${selectedUser._id}/suspend`, 
                { minutes: parseInt(suspendMinutes) }, 
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            await fetchUsers();
            setSuccess(`User suspended for ${suspendMinutes} minutes!`);
            setShowSuspendModal(false);
            setSelectedUser(null);
            setSuspendMinutes('');
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
    };

    return (
        <div className="manage-users-page">
            <div className="page-header">
                <h2 className="page-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="m22 21-3-3m-3 0a7 7 0 1 1 0-14 7 7 0 0 1 0 14z"></path>
                    </svg>
                    User Management
                </h2>
                <p className="page-subtitle">Manage user accounts, permissions, and status</p>
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
                        <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                        <button onClick={() => setError('')} className="alert__close">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
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
                        <svg className="alert__icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                        <button onClick={() => setSuccess('')} className="alert__close">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Users Table */}
            <div className="users-table-container">
                <div className="table-wrapper">
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
                            {users.map((user, index) => (
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
                                            <span className="user-name">{user.name}</span>
                                            <span className="user-id">ID: {user._id.slice(-6)}</span>
                                        </div>
                                    </td>
                                    <td className="user-email">{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role}`}>
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
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <polyline points="20,6 9,17 4,12"></polyline>
                                                </svg>
                                                Activate
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
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                                </svg>
                                                Suspend
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
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <path d="m4.93 4.93 14.14 14.14"></path>
                                                </svg>
                                                Ban
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
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <polyline points="3,6 5,6 21,6"></polyline>
                                                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
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
                                <h3 className="modal__title">Suspend User</h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
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
                                        "Suspend User"
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
                                <h3 className="modal__title">Ban User</h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Are you sure you want to ban <strong>{selectedUser.name}</strong>?</p>
                                <p className="warning-text">This action will permanently ban the user from accessing the platform.</p>
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
                                        "Yes, Ban User"
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
                                <h3 className="modal__title">Delete User Account</h3>
                                <button className="modal__close" onClick={closeAllModals}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="modal__body">
                                <p>Are you sure you want to delete <strong>{selectedUser.name}'s</strong> account?</p>
                                <p className="warning-text">
                                    ⚠️ This action cannot be undone. All user data, recipes, and associated content will be permanently removed.
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
                                        "Yes, Delete Account"
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