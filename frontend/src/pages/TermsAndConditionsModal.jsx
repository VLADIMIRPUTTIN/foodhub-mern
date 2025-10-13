import { motion } from "framer-motion";

const TermsAndConditionsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    return (
        <div className="modal-overlay">
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="terms-modal"
            >
                <button
                    className="close-modal"
                    onClick={onClose}
                >
                    &times;
                </button>
                <h3>Terms & Conditions</h3>
                <div className="terms-content">
                    <h4>1. Account Policies</h4>
                    <p>By creating an account on FoodHub, you agree to abide by these terms and conditions. Violation may result in account suspension or termination.</p>
                    
                    <h4>2. Content Guidelines</h4>
                    <p>Users are prohibited from posting:</p>
                    <ul>
                        <li>Offensive, inappropriate, or harmful recipes</li>
                        <li>Content that promotes harmful activities</li>
                        <li>Recipes with inappropriate names, descriptions, or images</li>
                        <li>Misleading or false information about food or nutrition</li>
                    </ul>
                    <p><strong>Violation of content guidelines may result in immediate account suspension or permanent banning, at the discretion of FoodHub administrators.</strong></p>
                    
                    <h4>3. Account Suspension and Banning</h4>
                    <p>FoodHub reserves the right to:</p>
                    <ul>
                        <li>Temporarily suspend accounts for minor violations (duration: 1 hour to 30 days)</li>
                        <li>Permanently ban accounts for serious or repeated violations</li>
                        <li>Remove any content that violates our guidelines without prior notice</li>
                    </ul>
                    <p>Suspended users will be notified of their suspension duration and reason.</p>
                    
                    <h4>4. User Responsibilities</h4>
                    <p>Users are responsible for:</p>
                    <ul>
                        <li>Maintaining the security of their account credentials</li>
                        <li>All content posted under their account</li>
                        <li>Reporting inappropriate content posted by others</li>
                        <li>Ensuring recipes comply with food safety guidelines</li>
                    </ul>
                    
                    <h4>5. Privacy Policy</h4>
                    <p>By using FoodHub, you consent to our collection and processing of your personal information as described in our Privacy Policy.</p>
                    
                    <h4>6. Modifications to Terms</h4>
                    <p>FoodHub reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.</p>
                </div>
                <div className="terms-footer">
                    <button onClick={onClose} className="agree-button">
                        I Understand
                    </button>
                </div>
            </motion.div>
            
            {/* Styles for the modal */}
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s;
                }
                
                .terms-modal {
                    background: linear-gradient(135deg, #cf996c 0%, #bb8860 100%);
                    border-radius: 1.5rem;
                    box-shadow: 0 8px 32px 0 rgba(219, 175, 126, 0.25);
                    padding: 2rem;
                    max-width: 700px;
                    width: 90%;
                    max-height: 80vh;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    animation: fadeIn 0.4s;
                    overflow: hidden;
                }

                .terms-modal h3 {
                    color: #f8f1e5;
                    font-size: 1.8rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                    text-align: center;
                    letter-spacing: 0.5px;
                }

                .terms-content {
                    padding: 0 1rem;
                    overflow-y: auto;
                    margin-bottom: 1.5rem;
                    max-height: calc(80vh - 150px);
                    color: #f8f1e5;
                }

                .terms-content h4 {
                    margin: 1.5rem 0 0.5rem;
                    color: #ffe7b2;
                    font-weight: 600;
                }

                .terms-content p {
                    margin-bottom: 0.8rem;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                .terms-content ul {
                    margin-bottom: 1rem;
                    margin-left: 1.5rem;
                }

                .terms-content li {
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                }

                .terms-content strong {
                    color: #ffe7b2;
                    font-weight: 600;
                }

                .terms-footer {
                    display: flex;
                    justify-content: center;
                    margin-top: 0.5rem;
                }

                .agree-button {
                    padding: 0.8rem 2rem;
                    background-color: #dbaf7e;
                    color: #f8f1e5;
                    border: none;
                    border-radius: 30px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                }

                .agree-button:hover {
                    background-color: #e0b787;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(0,0,0,0.18);
                }

                .close-modal {
                    position: absolute;
                    top: 12px;
                    right: 18px;
                    background: none;
                    border: none;
                    font-size: 2rem;
                    color: #fff;
                    cursor: pointer;
                    transition: color 0.2s;
                    z-index: 2;
                }

                .close-modal:hover {
                    color: #ffe7b2;
                }

                @media (max-width: 600px) {
                    .terms-modal {
                        padding: 1.5rem 1rem;
                        width: 95%;
                    }
                    .terms-modal h3 {
                        font-size: 1.4rem;
                    }
                    .terms-content {
                        padding: 0 0.5rem;
                        font-size: 0.9rem;
                    }
                    .terms-content h4 {
                        font-size: 1.1rem;
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default TermsAndConditionsModal;