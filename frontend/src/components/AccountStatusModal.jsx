import { motion } from 'framer-motion';
import './AccountStatusModal.scss';

const AccountStatusModal = ({ isOpen, onClose, statusData }) => {
    if (!isOpen || !statusData) return null;

    const formatTimeRemaining = (minutes) => {
        if (minutes <= 0) return 'Expired';
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${remainingMinutes}m`;
    };

    const getStatusIcon = () => {
        switch (statusData.status) {
            case 'banned':
                return '🚫';
            case 'suspended':
                return '⏸️';
            default:
                return '⚠️';
        }
    };

    const getStatusColor = () => {
        switch (statusData.status) {
            case 'banned':
                return '#dc2626';
            case 'suspended':
                return '#d97706';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className="status-modal-overlay" onClick={onClose}>
            <motion.div
                className="status-modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                style={{ borderColor: getStatusColor() }}
            >
                <div className="status-modal-header" style={{ backgroundColor: getStatusColor() }}>
                    <div className="status-icon">{getStatusIcon()}</div>
                    <h2>Account {statusData.status === 'banned' ? 'Banned' : 'Suspended'}</h2>
                </div>

                <div className="status-modal-content">
                    <div className="status-message">
                        <p>{statusData.message}</p>
                    </div>

                    {statusData.status === 'suspended' && statusData.timeRemaining > 0 && (
                        <div className="suspension-details">
                            <div className="time-remaining">
                                <strong>Time Remaining: {formatTimeRemaining(statusData.timeRemaining)}</strong>
                            </div>
                            {statusData.suspendedUntil && (
                                <div className="suspension-until">
                                    Suspended until: {new Date(statusData.suspendedUntil).toLocaleString()}
                                </div>
                            )}
                        </div>
                    )}

                    {statusData.status === 'banned' && statusData.bannedAt && (
                        <div className="ban-details">
                            <div className="ban-date">
                                Banned on: {new Date(statusData.bannedAt).toLocaleString()}
                            </div>
                        </div>
                    )}

                    {(statusData.suspensionReason || statusData.banReason) && (
                        <div className="reason-section">
                            <strong>Reason:</strong>
                            <p>{statusData.suspensionReason || statusData.banReason}</p>
                        </div>
                    )}

                    <div className="contact-support">
                        <p>If you believe this is an error, please contact our support team.</p>
                    </div>
                </div>

                <div className="status-modal-actions">
                    <button 
                        className="close-button"
                        onClick={onClose}
                        style={{ backgroundColor: getStatusColor() }}
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountStatusModal;