import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuickActionModal.scss';

const QuickActionModal = ({ isOpen, onClose, title, children, type = 'default', isFullContent = false }) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCloseClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const getModalIcon = () => {
        switch (type) {
            case 'users':
                return <i className="fas fa-users"></i>;
            case 'recipes':
                return <i className="fas fa-utensils"></i>;
            case 'pending':
                return <i className="fas fa-clock"></i>;
            case 'stats':
                return <i className="fas fa-chart-bar"></i>;
            case 'create':
                return <i className="fas fa-plus-circle"></i>;
            default:
                return <i className="fas fa-cog"></i>;
        }
    };

    // Add keyboard event listener for ESC key
    React.useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            <motion.div
                className="quick-action-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleOverlayClick}
            >
                <motion.div
                    className={`quick-action-modal ${type} ${isFullContent ? 'modal--full' : ''}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal__header">
                        <div className="modal__title-section">
                            <div className="modal__icon">
                                {getModalIcon()}
                            </div>
                            <h3 className="modal__title">{title}</h3>
                        </div>
                        
                        {/* Enhanced Close Button */}
                        <button 
                            className="modal__close" 
                            onClick={handleCloseClick}
                            type="button"
                            aria-label="Close modal"
                            title="Close modal"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div className={`modal__body ${isFullContent ? 'modal__body--full' : ''}`}>
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuickActionModal;