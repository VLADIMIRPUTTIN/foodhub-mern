import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './IngredientsModal.scss';

const IngredientsModal = ({ isOpen, onClose, onIngredientSelect, allIngredients, units }) => {
    const [step, setStep] = useState(1); // 1: ingredients, 2: units, 3: amount
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [filter, setFilter] = useState('');
    const [customAmount, setCustomAmount] = useState(''); // ✅ New state for custom input
    const [showCustomInput, setShowCustomInput] = useState(false); // ✅ Toggle custom input
    
    // Reset steps when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedIngredient(null);
            setSelectedUnit(null);
            setFilter('');
            setCustomAmount('');
            setShowCustomInput(false);
        }
    }, [isOpen]);
    
    // Filter ingredients based on search input
    const filteredIngredients = allIngredients.filter(ing => 
        ing.name.toLowerCase().includes(filter.toLowerCase())
    );
    
    // Handle ingredient selection
    const handleIngredientSelect = (ingredient) => {
        setSelectedIngredient(ingredient);
        setStep(2); // Move to units step
    };
    
    // Handle unit selection
    const handleUnitSelect = (unit) => {
        setSelectedUnit(unit);
        setStep(3); // Move to amount step
    };
    
    // Handle amount selection and finalize
    const handleAmountSelect = (amount) => {
        onIngredientSelect({
            name: selectedIngredient.name,
            unit: selectedUnit,
            amount: amount.toString()
        });
        
        // Reset for next selection
        setStep(1);
        setSelectedIngredient(null);
        setSelectedUnit(null);
        setShowCustomInput(false);
        setCustomAmount('');
    };

    // ✅ Handle custom amount submission
    const handleCustomSubmit = () => {
        const amount = parseFloat(customAmount);
        if (!isNaN(amount) && amount > 0) {
            handleAmountSelect(customAmount);
        }
    };
    
    // If modal is not open, don't render anything
    if (!isOpen) return null;
    
    return (
        <div className="ingredients-modal-overlay" onClick={onClose}>
            <div className="ingredients-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <i className="bx bx-x"></i>
                </button>
                
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="ingredients"
                            className="modal-step ingredients-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h3 className="modal-title">
                                Select Ingredient
                            </h3>
                            
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search ingredients..."
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                    className="search-input"
                                />
                                {filter && (
                                    <button 
                                        className="clear-search" 
                                        onClick={() => setFilter('')}
                                    >
                                        <i className="bx bx-x"></i>
                                    </button>
                                )}
                            </div>
                            
                            <div className="items-grid">
                                {filteredIngredients.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No ingredients found</p>
                                    </div>
                                ) : (
                                    filteredIngredients.map(ingredient => (
                                        <motion.button
                                            key={ingredient._id}
                                            className="item-button"
                                            onClick={() => handleIngredientSelect(ingredient)}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <span>{ingredient.name}</span>
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                    
                    {step === 2 && (
                        <motion.div 
                            key="units"
                            className="modal-step units-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h3 className="modal-title">
                                Select Unit for {selectedIngredient?.name}
                            </h3>
                            
                            <button 
                                className="back-button"
                                onClick={() => setStep(1)}
                            >
                                <i className="bx bx-left-arrow-alt"></i>
                                Back to Ingredients
                            </button>
                            
                            <div className="items-grid">
                                {units.map(unit => (
                                    <motion.button
                                        key={unit}
                                        className="item-button"
                                        onClick={() => handleUnitSelect(unit)}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <span>{unit}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    
                    {step === 3 && (
                        <motion.div 
                            key="amount"
                            className="modal-step amount-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <h3 className="modal-title">
                                Select Amount
                            </h3>
                            
                            <div className="selected-info">
                                {selectedIngredient?.name} ({selectedUnit})
                            </div>
                            
                            <button 
                                className="back-button"
                                onClick={() => {
                                    setStep(2);
                                    setShowCustomInput(false);
                                    setCustomAmount('');
                                }}
                            >
                                <i className="bx bx-left-arrow-alt"></i>
                                Back to Units
                            </button>
                            
                            {/* ✅ Show custom input OR amount grid */}
                            {showCustomInput ? (
                                <div className="custom-amount-input">
                                    <label>Enter custom amount:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        placeholder="e.g. 2.5"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCustomSubmit();
                                        }}
                                    />
                                    <div className="custom-actions">
                                        <button
                                            type="button"
                                            className="custom-cancel-btn"
                                            onClick={() => {
                                                setShowCustomInput(false);
                                                setCustomAmount('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="custom-submit-btn"
                                            onClick={handleCustomSubmit}
                                            disabled={!customAmount || parseFloat(customAmount) <= 0}
                                        >
                                            <i className="bx bx-check"></i>
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="amount-grid">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(amount => (
                                        <motion.button
                                            key={amount}
                                            className="amount-button"
                                            onClick={() => handleAmountSelect(amount)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {amount}
                                        </motion.button>
                                    ))}
                                    
                                    {/* ✅ Custom button now toggles input */}
                                    <motion.button
                                        className="amount-button custom"
                                        onClick={() => setShowCustomInput(true)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <i className="bx bx-edit-alt"></i>
                                        Custom
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default IngredientsModal;