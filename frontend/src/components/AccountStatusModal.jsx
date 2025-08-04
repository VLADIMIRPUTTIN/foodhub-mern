import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import './AccountStatusModal.scss';

const AccountStatusModal = ({ isOpen, onClose, statusData }) => {
    const [timeRemaining, setTimeRemaining] = useState(0);

    useEffect(() => {
        if (!statusData || statusData.status !== 'suspended') return;

        const updateTimeRemaining = () => {
            if (statusData.suspendedUntil) {
                const remaining = Math.max(0, Math.ceil((new Date(statusData.suspendedUntil) - new Date()) / 60000));
                setTimeRemaining(remaining);
                
                if (remaining <= 0) {
                    setTimeout(() => {
                        onClose();
                        window.location.reload();
                    }, 2000);
                }
            } else {
                setTimeRemaining(statusData.timeRemaining || 0);
            }
        };

        updateTimeRemaining();
        const interval = setInterval(updateTimeRemaining, 60000);
        return () => clearInterval(interval);
    }, [statusData, onClose]);

    if (!isOpen || !statusData) return null;

    const formatTimeRemaining = (minutes) => {
        if (minutes <= 0) return 'Suspension Expired!';
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        
        if (days > 0) return `${days}d ${remainingHours}h ${remainingMinutes}m`;
        if (hours > 0) return `${hours}h ${remainingMinutes}m`;
        return `${remainingMinutes}m`;
    };

    const getStatusIcon = () => {
        switch (statusData.status) {
            case 'banned': return '🚫';
            case 'suspended': return timeRemaining <= 0 ? '✅' : '⏸️';
            default: return '⚠️';
        }
    };

    const getModalTitle = () => {
        switch (statusData.status) {
            case 'banned': return 'Account Banned';
            case 'suspended': return timeRemaining <= 0 ? 'Access Restored!' : 'Account Suspended';
            default: return 'Account Restricted';
        }
    };

    const getModalMessage = () => {
        if (statusData.status === 'suspended' && timeRemaining <= 0) {
            return 'Welcome back! Your suspension has ended.';
        }
        
        if (statusData.status === 'suspended') {
            return 'Your account is temporarily suspended. Please wait for the suspension to end.';
        }
        
        if (statusData.status === 'banned') {
            return 'Your account has been permanently banned due to policy violations.';
        }
        
        return statusData.message;
    };

    const getButtonText = () => {
        if (timeRemaining <= 0 && statusData.status === 'suspended') return 'Continue';
        return statusData.status === 'banned' ? 'Contact Support' : 'OK';
    };

    const handleButtonClick = () => {
        if (timeRemaining <= 0 && statusData.status === 'suspended') {
            onClose();
            window.location.href = '/login';
            return;
        }
        
        if (statusData.status === 'banned') {
            window.open('mailto:foodhubrecipes12@gmail.com?subject=Account Ban Appeal', '_blank');
        }
        
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="status-modal-overlay" onClick={onClose}>
                <motion.div
                    className="status-modal"
                    data-status={statusData.status}
                    initial={{ opacity: 0, scale: 0.9, y: -30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400, duration: 0.4 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="status-modal-header">
                        <motion.div 
                            className={`status-icon ${statusData.status}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 600 }}
                        >
                            {getStatusIcon()}
                        </motion.div>
                        <h2>{getModalTitle()}</h2>
                    </div>

                    <div className="status-modal-content">
                        <div className="status-message">
                            <p>{getModalMessage()}</p>
                        </div>

                        {statusData.status === 'suspended' && timeRemaining > 0 && (
                            <div className="time-info">
                                <div className="time-remaining">{formatTimeRemaining(timeRemaining)}</div>
                                {statusData.suspendedUntil && (
                                    <div className="ends-at">
                                        Ends: {new Date(statusData.suspendedUntil).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {statusData.status === 'banned' && statusData.bannedAt && (
                            <div className="ban-info">
                                <div className="ban-date">
                                    Banned: {new Date(statusData.bannedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </div>
                            </div>
                        )}

                        {(statusData.suspensionReason || statusData.banReason) && (
                            <div className="reason-info">
                                <strong>Reason:</strong>
                                <p>{statusData.suspensionReason || statusData.banReason}</p>
                            </div>
                        )}
                    </div>

                    <div className="status-modal-actions">
                        <button 
                            className="action-button"
                            onClick={handleButtonClick}
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AccountStatusModal;