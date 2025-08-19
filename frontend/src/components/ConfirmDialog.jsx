import './ConfirmDialog.scss';

const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;
  
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog-content">
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-icon">
            <i className="bx bx-error-alt"></i>
          </div>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>
        
        {description && (
          <p className="confirm-dialog-description">{description}</p>
        )}
        
        <div className="confirm-dialog-actions">
          <button
            className="confirm-dialog-btn confirm-dialog-btn--cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className="confirm-dialog-btn confirm-dialog-btn--destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
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
      </div>
    </div>
  );
};

export default ConfirmDialog;