import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuickActionModal.scss';

const QuickActionModal = ({ isOpen, onClose, title, children, type = 'default', isFullContent = false }) => {
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
                return <i className="bx bx-group"></i>;
            case 'recipes':
                return <i className="bx bx-restaurant"></i>;
            case 'ingredients':
                return <i className="bx bx-leaf"></i>;
            case 'pending':
                return <i className="bx bx-time-five"></i>;
            case 'stats':
                return <i className="bx bx-bar-chart-alt-2"></i>;
            case 'create':
                return <i className="bx bx-plus-circle"></i>;
            case 'edit':
                return <i className="bx bx-edit-alt"></i>;
            case 'settings':
                return <i className="bx bx-cog"></i>;
            case 'delete':
                return <i className="bx bx-trash"></i>;
            case 'success':
                return <i className="bx bx-check-circle"></i>;
            case 'warning':
                return <i className="bx bx-error-circle"></i>;
            case 'info':
                return <i className="bx bx-info-circle"></i>;
            default:
                return <i className="bx bx-grid-alt"></i>;
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
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="quick-action-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        className={`quick-action-modal ${type} ${isFullContent ? 'modal--full' : ''}`}
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ 
                            duration: 0.4, 
                            ease: [0.4, 0, 0.2, 1],
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal__header">
                            <div className="modal__title-section">
                                <div className="modal__icon">
                                    {getModalIcon()}
                                </div>
                                <div className="modal__title-content">
                                    <h3 className="modal__title">{title}</h3>
                                    <div className="modal__subtitle">Quick Actions & Management</div>
                                </div>
                            </div>
                            
                            {/* Enhanced Close Button */}
                            <motion.button 
                                className="modal__close" 
                                onClick={handleCloseClick}
                                type="button"
                                aria-label="Close modal"
                                title="Close modal"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <i className="bx bx-x"></i>
                            </motion.button>
                        </div>

                        <div className={`modal__body ${isFullContent ? 'modal__body--full' : ''}`}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickActionModal;