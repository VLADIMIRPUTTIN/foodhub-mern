import  { createContext, useContext, useState, useEffect } from 'react';
import './toast.scss';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 4000);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (title, description, duration = 4000) => {
      return addToast({
        type: 'success',
        title,
        description,
        duration
      });
    },
    error: (title, description, duration = 4000) => {
      return addToast({
        type: 'error',
        title,
        description,
        duration
      });
    },
    info: (title, description, duration = 4000) => {
      return addToast({
        type: 'info',
        title,
        description,
        duration
      });
    },
    favorite: (title, description, duration = 4000) => { // Special favorite toast
      return addToast({
        type: 'favorite',
        title,
        description,
        duration,
        icon: 'heart'
      });
    }
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove();
    }, 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, toast.duration - 300);

    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <i className="bx bxs-check-circle"></i>;
      case 'error':
        return <i className="bx bxs-error-circle"></i>;
      case 'info':
        return <i className="bx bxs-info-circle"></i>;
      case 'favorite':
        return <i className="bx bxs-heart"></i>; // Heart icon for favorites
      default:
        return <i className="bx bxs-bell"></i>;
    }
  };

  return (
    <div 
      className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}
      onClick={handleRemove}
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.description && (
          <div className="toast-description">{toast.description}</div>
        )}
      </div>
      <button className="toast-close" onClick={handleRemove}>
        <i className="bx bx-x"></i>
      </button>
    </div>
  );
};