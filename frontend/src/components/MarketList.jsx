import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './MarketList.scss';

const MarketList = ({ recipe, isOpen, onGenerateInstructions }) => {
  const [ingredients, setIngredients] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [viewMode, setViewMode] = useState('all'); // 'all', 'shopping', 'available'
  
  useEffect(() => {
    if (recipe && recipe.ingredients) {
      // Initialize ingredients from recipe
      const recipeIngredients = recipe.ingredients.map(ing => ({
        ...ing,
        id: ing._id || Math.random().toString(36).substring(7)
      }));
      
      setIngredients(recipeIngredients);
      
      // Reset checked items when recipe changes
      const initialCheckedState = {};
      recipeIngredients.forEach(ing => {
        initialCheckedState[ing.id] = false;
      });
      setCheckedItems(initialCheckedState);
    }
  }, [recipe]);
  
  const handleCheckItem = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const getAvailableIngredients = () => {
    return ingredients.filter(ing => checkedItems[ing.id]);
  };
  
  const getMissingIngredients = () => {
    return ingredients.filter(ing => !checkedItems[ing.id]);
  };
  
  const handleGenerateInstructions = () => {
    if (onGenerateInstructions) {
      onGenerateInstructions(getAvailableIngredients(), getMissingIngredients());
    }
  };

  // New function to print or share shopping list
  const handlePrintShoppingList = () => {
    const missingItems = getMissingIngredients();
    if (missingItems.length === 0) return;
    
    // Create printable content
    let content = `Shopping List for ${recipe.name || recipe.title}\n\n`;
    missingItems.forEach(ing => {
      content += `• ${ing.amount || ''} ${ing.unit || ''} ${ing.name}\n`;
    });
    
    // Create a printable window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Shopping List - ${recipe.name || recipe.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ff6b35; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
            .footer { margin-top: 30px; font-size: 12px; color: #888; }
          </style>
        </head>
        <body>
          <h1>Shopping List</h1>
          <h2>${recipe.name || recipe.title}</h2>
          <ul>
            ${missingItems.map(ing => `
              <li>${ing.amount || ''} ${ing.unit || ''} ${ing.name}</li>
            `).join('')}
          </ul>
          <div class="footer">Generated from FoodHub</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  
  const filteredIngredients = () => {
    if (viewMode === 'shopping') return getMissingIngredients();
    if (viewMode === 'available') return getAvailableIngredients();
    return ingredients;
  };
  
  if (!isOpen || !recipe) return null;
  
  return (
    <motion.div
      className="market-list-container"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="market-list-header">
        <h3>
          <i className="bx bx-shopping-bag"></i>
          Market List
        </h3>
        <p className="market-list-subtitle">Check items you already have</p>
      </div>
      
      <div className="market-list-tabs">
        <button 
          className={`tab-button ${viewMode === 'all' ? 'active' : ''}`}
          onClick={() => setViewMode('all')}
        >
          All
        </button>
        <button 
          className={`tab-button ${viewMode === 'shopping' ? 'active' : ''}`}
          onClick={() => setViewMode('shopping')}
        >
          Need to Buy ({getMissingIngredients().length})
        </button>
        <button 
          className={`tab-button ${viewMode === 'available' ? 'active' : ''}`}
          onClick={() => setViewMode('available')}
        >
          Have ({getAvailableIngredients().length})
        </button>
      </div>
      
      <div className="market-list-items">
        {filteredIngredients().map(ing => (
          <motion.div 
            key={ing.id} 
            className={`market-list-item ${checkedItems[ing.id] ? 'checked' : ''}`}
            whileHover={{ scale: 1.02 }}
          >
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={checkedItems[ing.id] || false}
                onChange={() => handleCheckItem(ing.id)}
              />
              <span className="checkmark"></span>
            </label>
            <span className="ingredient-amount">
              {ing.amount && `${ing.amount} `}
              {ing.unit && `${ing.unit} `}
            </span>
            <span className="ingredient-name">{ing.name}</span>
          </motion.div>
        ))}
        
        {filteredIngredients().length === 0 && (
          <div className="empty-list-message">
            {viewMode === 'shopping' 
              ? "Great! You have all the ingredients you need." 
              : viewMode === 'available' 
                ? "You haven't marked any ingredients as available yet." 
                : "No ingredients found for this recipe."}
          </div>
        )}
      </div>
      
      <div className="market-list-summary">
        <div className="summary-row">
          <span>Available:</span>
          <span className="summary-count">{getAvailableIngredients().length}</span>
        </div>
        <div className="summary-row">
          <span>Need to buy:</span>
          <span className="summary-count">{getMissingIngredients().length}</span>
        </div>
      </div>
      
      <div className="market-list-actions">
        <motion.button
          className="generate-instructions-btn"
          onClick={handleGenerateInstructions}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={getAvailableIngredients().length === 0}
        >
          <i className="bx bx-bulb"></i>
          Cook With Available Ingredients
        </motion.button>
        
        <motion.button
          className="print-shopping-list-btn"
          onClick={handlePrintShoppingList}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={getMissingIngredients().length === 0}
        >
          <i className="bx bx-printer"></i>
          Print Shopping List
        </motion.button>
      </div>
    </motion.div>
  );
};

export default MarketList;