
import { Link } from 'react-router-dom';
import './login-prompt-modal.scss';

const LoginPromptModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt-modal" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="login-prompt-close" onClick={onClose}>
          <i className="bx bx-x"></i>
        </button>
        
        {/* Heart icon */}
        <div className="login-prompt-icon">
          <div className="heart-container">
            <i className="bx bxs-heart"></i>
            <div className="heart-pulse"></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="login-prompt-content">
          <h3 className="login-prompt-title">
            Save Your Favorite Recipes
          </h3>
          <p className="login-prompt-description">
            Create an account or sign in to save recipes you love and access them anytime!
          </p>
          
          {/* Action buttons */}
          <div className="login-prompt-actions">
            <Link 
              to="/login" 
              className="login-prompt-btn primary"
              onClick={onClose}
            >
              <i className="bx bx-log-in"></i>
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="login-prompt-btn secondary"
              onClick={onClose}
            >
              <i className="bx bx-user-plus"></i>
              Create Account
            </Link>
          </div>
          
          {/* Benefits list */}
          <div className="login-prompt-benefits">
            <div className="benefit-item">
              <i className="bx bxs-heart"></i>
              <span>Save unlimited recipes</span>
            </div>
            <div className="benefit-item">
              <i className="bx bxs-cookbook"></i>
              <span>Create your own recipes</span>
            </div>
            <div className="benefit-item">
              <i className="bx bxs-devices"></i>
              <span>Access from any device</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;