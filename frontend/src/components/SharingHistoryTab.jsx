import { useState, useMemo } from 'react';

const SharingHistoryTab = ({ userRecipes, onShareRecipe, onUnshareRecipe, getRecipeImageUrl, formatDate }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter recipes based on activeFilter
  const filteredRecipes = useMemo(() => {
    // Only include recipes that have been shared in some form
    const sharedRecipes = userRecipes.filter(recipe => recipe.shareStatus !== 'not_shared');
    
    if (activeFilter === 'all') {
      return sharedRecipes;
    }
    return sharedRecipes.filter(recipe => recipe.shareStatus === activeFilter);
  }, [userRecipes, activeFilter]);

  return (
    <div className="recipe-history">
      <div className="history-filters">
        <button 
          className={`filter-btn all ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >All</button>
        <button 
          className={`filter-btn pending ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >Pending</button>
        <button 
          className={`filter-btn approved ${activeFilter === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveFilter('approved')}
        >Approved</button>
        <button 
          className={`filter-btn rejected ${activeFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rejected')}
        >Declined</button>
      </div>
      
      <div className="history-list">
        {filteredRecipes.map(recipe => (
          <div key={recipe._id} className={`history-item ${recipe.shareStatus}`}>
            <div className="history-image">
              <img src={getRecipeImageUrl(recipe.imageUrl)} alt={recipe.title} />
            </div>
            <div className="history-content">
              <h3>{recipe.title}</h3>
              <div className="history-meta">
                <span className={`status-badge ${recipe.shareStatus}`}>
                  {recipe.shareStatus === 'pending' && 'Pending Review'}
                  {recipe.shareStatus === 'approved' && 'Approved'}
                  {recipe.shareStatus === 'rejected' && 'Declined'}
                </span>
                <span className="date">{formatDate(recipe.updatedAt)}</span>
              </div>
              {recipe.shareStatus === 'rejected' && (
                <div className="rejection-reason">
                  <span>Reason:</span> {recipe.rejectionReason || 'No reason provided'}
                </div>
              )}
            </div>
            <div className="history-actions">
              {recipe.shareStatus === 'rejected' && (
                <button 
                  className="reshare-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    onShareRecipe(recipe, e);
                  }}
                >
                  Try Again
                </button>
              )}
              {recipe.shareStatus === 'approved' && (
                <button 
                  className="unshare-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    onUnshareRecipe(recipe, e);
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        
        {filteredRecipes.length === 0 && (
          <div className="empty-history">
            <i className="bx bx-share"></i>
            <h3>{`No ${activeFilter !== 'all' ? activeFilter === 'rejected' ? 'declined' : activeFilter : ''} recipes found`}</h3>
            <p>
              {activeFilter === 'all' ? "You haven't shared any recipes with the community yet." : 
               activeFilter === 'pending' ? "You don't have any recipes pending review." :
               activeFilter === 'approved' ? "You don't have any approved shared recipes." :
               "You don't have any declined recipes."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharingHistoryTab;