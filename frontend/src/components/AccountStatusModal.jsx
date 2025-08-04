import React from 'react';
import { motion } from 'framer-motion';
import './AccountStatusModal.scss';

const AccountStatusModal = ({ isOpen, onClose, statusData }) => {
    if (!isOpen || !statusData) return null;

    const formatTimeRemaining = (minutes) => {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes > 0 ? `and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    };

    const getStatusIcon = () => {
        switch (statusData.status) {
            case 'suspended':
                return 'bx-pause-circle';
            case 'banned':
                return 'bx-block';
            default:
                return 'bx-info-circle';
        }
    };

    const getStatusColor = () => {
        switch (statusData.status) {
            case 'suspended':
                return '#f59e0b'; // amber
            case 'banned':
                return '#ef4444'; // red
            default:
                return '#6b7280'; // gray
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal modal--small"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '1rem',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '90%',
                    position: 'relative'
                }}
            >
                <div className="modal__header" style={{ marginBottom: '1.5rem' }}>
                    <h3 className="modal__title" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        color: getStatusColor(),
                        margin: 0
                    }}>
                        <i className={`bx ${getStatusIcon()}`} style={{ fontSize: '1.5rem' }}></i>
                        Account {statusData.status === 'suspended' ? 'Suspended' : 'Banned'}
                    </h3>
                    <button 
                        className="modal__close" 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        <i className="bx bx-x"></i>
                    </button>
                </div>
                
                <div className="modal__body">
                    <div style={{ 
                        background: '#f3f4f6', 
                        padding: '1rem', 
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <p style={{ margin: 0, fontWeight: '500' }}>
                            {statusData.message}
                        </p>
                    </div>

                    {statusData.status === 'suspended' && (
                        <div>
                            <p><strong>Time remaining:</strong> {formatTimeRemaining(statusData.timeRemaining)}</p>
                            <p><strong>Suspended until:</strong> {new Date(statusData.suspendedUntil).toLocaleString()}</p>
                            {statusData.suspensionReason && (
                                <p><strong>Reason:</strong> {statusData.suspensionReason}</p>
                            )}
                        </div>
                    )}

                    {statusData.status === 'banned' && (
                        <div>
                            <p><strong>Banned on:</strong> {new Date(statusData.bannedAt).toLocaleString()}</p>
                            {statusData.banReason && (
                                <p><strong>Reason:</strong> {statusData.banReason}</p>
                            )}
                            <p style={{ color: '#ef4444', fontWeight: '500' }}>
                                This ban is permanent. Please contact support if you believe this is an error.
                            </p>
                        </div>
                    )}
                </div>

                <div className="modal__actions" style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '1rem',
                    marginTop: '1.5rem'
                }}>
                    <button
                        className="btn btn--primary"
                        onClick={onClose}
                        style={{
                            background: getStatusColor(),
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        I Understand
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountStatusModal;