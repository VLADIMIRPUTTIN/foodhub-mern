import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmDialog.scss';

const ConfirmDialog = ({
  open,
  isOpen, // Add support for both prop names
  title = "Are you sure?",
  description,
  message, // Add support for both prop names  
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  onClose, // Add support for both prop names
  loading = false,
  isLoading, // Add support for both prop names
}) => {
  // Normalize the props to handle different naming conventions
  const isDialogOpen = open || isOpen;
  const dialogMessage = description || message;
  const isProcessing = loading || isLoading;
  const handleCancel = onCancel || onClose;

  if (!isDialogOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      handleCancel?.();
    }
  };
  
  return (
    <AnimatePresence>
      {isDialogOpen && (
        <motion.div 
          className="confirm-dialog-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <motion.div 
            className="confirm-dialog-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-dialog-header">
              <div className="confirm-dialog-icon">
                <i className="bx bx-error-alt"></i>
              </div>
              <h3 className="confirm-dialog-title">{title}</h3>
            </div>
            
            {dialogMessage && (
              <p className="confirm-dialog-description">{dialogMessage}</p>
            )}
            
            <div className="confirm-dialog-actions">
              <button
                className="confirm-dialog-btn confirm-dialog-btn--cancel"
                onClick={handleCancel}
                disabled={isProcessing}
                type="button"
              >
                {cancelText}
              </button>
              <button
                className="confirm-dialog-btn confirm-dialog-btn--destructive"
                onClick={onConfirm}
                disabled={isProcessing}
                type="button"
              >
                {isProcessing ? (
                  <>
                    <span className="confirm-dialog-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="bx bx-trash"></i>
                    {confirmText}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;