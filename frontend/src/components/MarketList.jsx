import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './MarketList.scss';

const MarketList = ({ recipe, isOpen, onGenerateInstructions }) => {
  const [ingredients, setIngredients] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [viewMode, setViewMode] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cookingInstructions, setCookingInstructions] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  useEffect(() => {
    if (recipe && recipe.ingredients) {
      const recipeIngredients = recipe.ingredients.map(ing => ({
        ...ing,
        id: ing._id || Math.random().toString(36).substring(7)
      }));
      
      setIngredients(recipeIngredients);
      
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
  
  const handleGenerateInstructions = async () => {
    const available = getAvailableIngredients();
    const missing = getMissingIngredients();
    
    if (available.length === 0) {
      alert("Please check at least one ingredient you have available.");
      return;
    }
    
    setIsGenerating(true);
    setCookingInstructions(null);
    
    try {
      const baseURL = import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : "";
      
      const response = await axios.post(
        `${baseURL}/api/vision/generate-cooking-instructions`,
        {
          recipeName: recipe.name || recipe.title,
          recipeInstructions: recipe.steps || recipe.instructions,
          availableIngredients: available,
          missingIngredients: missing
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setCookingInstructions(response.data.instructions);
        setShowInstructions(true);
      } else {
        alert("Failed to generate cooking instructions. Please try again.");
      }
    } catch (error) {
      console.error("Error generating instructions:", error);
      alert(error.response?.data?.message || "Failed to generate cooking instructions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintShoppingList = () => {
    const missingItems = getMissingIngredients();
    if (missingItems.length === 0) return;
    
    let content = `Shopping List for ${recipe.name || recipe.title}\n\n`;
    missingItems.forEach(ing => {
      content += `• ${ing.amount || ''} ${ing.unit || ''} ${ing.name}\n`;
    });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Shopping List - ${recipe.name || recipe.title}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              color: #e26a00; 
              border-bottom: 3px solid #CF996C;
              padding-bottom: 10px;
            }
            h2 { color: #7a5a36; margin-top: 30px; }
            ul { 
              padding-left: 20px; 
              line-height: 2;
            }
            li { 
              margin-bottom: 12px; 
              font-size: 16px;
            }
            .footer { 
              margin-top: 50px; 
              padding-top: 20px;
              border-top: 2px solid #eee;
              font-size: 14px; 
              color: #888; 
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>🛒 Shopping List</h1>
          <h2>${recipe.name || recipe.title}</h2>
          <ul>
            ${missingItems.map(ing => `
              <li>☐ ${ing.amount || ''} ${ing.unit || ''} ${ing.name}</li>
            `).join('')}
          </ul>
          <div class="footer">
            Generated from FoodHub Recipe App<br>
            ${new Date().toLocaleDateString()}
          </div>
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
    <>
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
            Need ({getMissingIngredients().length})
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
            disabled={getAvailableIngredients().length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <i className="bx bx-loader-alt bx-spin"></i>
                Generating AI Suggestions...
              </>
            ) : (
              <>
                <i className="bx bx-bulb"></i>
                Cook With Available Ingredients
              </>
            )}
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

      {/* AI Cooking Instructions Modal */}
      <AnimatePresence>
        {showInstructions && cookingInstructions && (
          <motion.div 
            className="cooking-instructions-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInstructions(false)}
          >
            <motion.div 
              className="cooking-instructions-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="instructions-header">
                <h2>
                  <i className="bx bx-bulb"></i>
                  AI Cooking Suggestions
                </h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowInstructions(false)}
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
              
              <div className="instructions-body">
                <div 
                  className="instructions-text"
                  dangerouslySetInnerHTML={{ 
                    __html: cookingInstructions
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br>')
                      .replace(/^(🎯|📋|🥘|📝|👨‍🍳|💡|⚠️)/gm, '<br><span class="emoji-marker">$1</span>')
                  }}
                />
              </div>
              
              <div className="instructions-footer">
                <button 
                  className="btn-close"
                  onClick={() => setShowInstructions(false)}
                >
                  <i className="bx bx-check"></i>
                  Got It!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MarketList;