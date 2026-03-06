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
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [suspendMinutes, setSuspendMinutes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRole, setFilterRole] = useState('all');

    // Enhanced Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchTerm || 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user._id?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        
        return matchesSearch && matchesStatus && matchesRole;
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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
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
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
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
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
        setShowViewModal(false);
        setSelectedUser(null);
        setSuspendMinutes('');
    };

    // Get status statistics
    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        suspended: users.filter(u => u.status === 'suspended').length,
        banned: users.filter(u => u.status === 'banned').length
    };

    return (
        <div className="manage-users-page">
            {/* Notification Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        className="notification notification--error"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <i className="bx bx-error-circle"></i>
                        <span>{error}</span>
                    </motion.div>
                )}
                {success && (
                    <motion.div 
                        className="notification notification--success"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <i className="bx bx-check-circle"></i>
                        <span>{success}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Header */}
            <motion.div 
                className="page-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="header-content">
                    <h1 className="page-title">
                        <i className="bx bx-group"></i>
                        User Management
                    </h1>
                    <p className="page-subtitle">Manage user accounts, permissions, and status</p>
                </div>

                {/* Statistics Cards */}
                <div className="stats-cards">
                    <div className="stat-card stat-card--total">
                        <i className="bx bx-user"></i>
                        <div className="stat-info">
                            <span className="stat-label">Total Users</span>
                            <span className="stat-value">{stats.total}</span>
                        </div>
                    </div>
                    <div className="stat-card stat-card--active">
                        <i className="bx bx-user-check"></i>
                        <div className="stat-info">
                            <span className="stat-label">Active</span>
                            <span className="stat-value">{stats.active}</span>
                        </div>
                    </div>
                    <div className="stat-card stat-card--suspended">
                        <i className="bx bx-user-x"></i>
                        <div className="stat-info">
                            <span className="stat-label">Suspended</span>
                            <span className="stat-value">{stats.suspended}</span>
                        </div>
                    </div>
                    <div className="stat-card stat-card--banned">
                        <i className="bx bx-block"></i>
                        <div className="stat-info">
                            <span className="stat-label">Banned</span>
                            <span className="stat-value">{stats.banned}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Filters and Search */}
            <motion.div 
                className="filters-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="search-box">
                    <i className="bx bx-search"></i>
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-btn" onClick={() => setSearchTerm('')}>
                            <i className="bx bx-x"></i>
                        </button>
                    )}
                </div>

                <div className="filter-group">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>

                    <select 
                        value={filterRole} 
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                    </select>
                </div>
            </motion.div>

            {/* Users Table */}
            <motion.div 
                className="users-table-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <i className="bx bx-user-x empty-icon"></i>
                        <h3>No users found</h3>
                        <p>
                            {searchTerm || filterStatus !== 'all' || filterRole !== 'all'
                                ? "No users match your current filters"
                                : "No users registered in the system yet"}
                        </p>
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
                                >
                                    <td data-label="User">
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt={user.name} />
                                                ) : (
                                                    <div className="avatar-placeholder">
                                                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="user-name">{user.name}</span>
                                        </div>
                                    </td>

                                    <td className="email-cell" data-label="Email">{user.email}</td>

                                    <td data-label="Role">
                                        <span className={`role-badge role-badge--${user.role}`}>
                                            <i className={`bx ${user.role === 'admin' ? 'bx-shield' : 'bx-user'}`}></i>
                                            {user.role}
                                        </span>
                                    </td>

                                    <td data-label="Status">
                                        <span className={`status-badge status-badge--${user.status}`}>
                                            {user.status}
                                        </span>
                                    </td>

                                    <td className="date-cell" data-label="Joined">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </td>

                                    <td data-label="Actions">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn action-btn--success"
                                                onClick={() => handleActivate(user._id)}
                                                disabled={user.status === "active" || actionLoading}
                                                title="Activate"
                                                aria-label="Activate user"
                                            >
                                                <i className="bx bx-check"></i>
                                            </button>

                                            <button
                                                className="action-btn action-btn--warning"
                                                onClick={() => { setSelectedUser(user); setShowSuspendModal(true); }}
                                                disabled={user.status === "suspended" || actionLoading}
                                                title="Suspend"
                                                aria-label="Suspend user"
                                            >
                                                <i className="bx bx-pause"></i>
                                            </button>

                                            <button
                                                className="action-btn action-btn--danger"
                                                onClick={() => { setSelectedUser(user); setShowBanModal(true); }}
                                                disabled={user.status === "banned" || actionLoading}
                                                title="Ban"
                                                aria-label="Ban user"
                                            >
                                                <i className="bx bx-block"></i>
                                            </button>

                                            <button
                                                className="action-btn action-btn--destructive"
                                                onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                                disabled={actionLoading}
                                                title="Delete"
                                                aria-label="Delete user"
                                            >
                                                <i className="bx bx-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>

            {/* Modals */}
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
                            className="modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>
                                    <i className="bx bx-pause-circle"></i>
                                    Suspend User
                                </h3>
                                <button className="modal-close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal-body">
                                <p>How long do you want to suspend <strong>{selectedUser.name}</strong>?</p>
                                <div className="form-group">
                                    <label>Suspension Duration (minutes)</label>
                                    <input
                                        type="number"
                                        placeholder="Enter minutes (e.g. 60)"
                                        value={suspendMinutes}
                                        onChange={(e) => setSuspendMinutes(e.target.value)}
                                        min="1"
                                        step="1"
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--warning"
                                    onClick={handleSuspend}
                                    disabled={actionLoading || !suspendMinutes}
                                >
                                    {actionLoading ? 'Suspending...' : 'Suspend User'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showBanModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>
                                    <i className="bx bx-block"></i>
                                    Ban User
                                </h3>
                                <button className="modal-close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal-body">
                                <p>Are you sure you want to ban <strong>{selectedUser.name}</strong>?</p>
                                <div className="warning-box">
                                    <i className="bx bx-error-alt"></i>
                                    <span>This action will permanently ban the user from accessing the platform.</span>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--danger"
                                    onClick={handleBan}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Banning...' : 'Yes, Ban User'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showDeleteModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>
                                    <i className="bx bx-trash"></i>
                                    Delete User Account
                                </h3>
                                <button className="modal-close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>
                            
                            <div className="modal-body">
                                <p>Are you sure you want to delete <strong>{selectedUser.name}'s</strong> account?</p>
                                <div className="warning-box">
                                    <i className="bx bx-error-alt"></i>
                                    <span>This action cannot be undone. All user data, recipes, and associated content will be permanently removed.</span>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn--destructive"
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Deleting...' : 'Yes, Delete Account'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showViewModal && selectedUser && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAllModals}
                    >
                        <motion.div
                            className="modal modal--view"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h3>
                                    <i className="bx bx-user"></i>
                                    User Details
                                </h3>
                                <button className="modal-close" onClick={closeAllModals}>
                                    <i className="bx bx-x"></i>
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="user-details">
                                    <div className="detail-row">
                                        <span className="label">Name</span>
                                        <span className="value">{selectedUser.name || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Email</span>
                                        <span className="value mono">{selectedUser.email || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Role</span>
                                        <span className="value">{selectedUser.role || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Status</span>
                                        <span className="value">{selectedUser.status || '-'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Joined</span>
                                        <span className="value">
                                            {selectedUser.createdAt
                                                ? new Date(selectedUser.createdAt).toLocaleDateString()
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">User ID</span>
                                        <span className="value mono">{selectedUser._id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn--secondary" onClick={closeAllModals}>
                                    Close
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