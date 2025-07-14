

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
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        <div className="confirm-dialog-actions">
          <button
            className="confirm-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmText}
          </button>
          <button className="cancel-btn" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;