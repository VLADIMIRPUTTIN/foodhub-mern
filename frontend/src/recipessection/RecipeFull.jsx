import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { translateContainer } from "../utils/translateUtils";
import "./RecipeFull.scss";

const RecipeFull = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false); // ✅ NEW

  // API Base URL
  const API_BASE = import.meta.env.MODE === "development" 
    ? "http://localhost:5000" 
    : "";

  // Helper function to construct proper image URL
  const getImageUrl = (recipe) => {
    if (!recipe.imageUrl) {
      return 'https://via.placeholder.com/800x400?text=No+Image';
    }
    
    if (recipe.imageUrl.startsWith('http://') || recipe.imageUrl.startsWith('https://')) {
      return recipe.imageUrl;
    }
    
    const baseURL = import.meta.env.MODE === "development" 
      ? "http://localhost:5000" 
      : "";
    return `${baseURL}${recipe.imageUrl.startsWith('/') ? recipe.imageUrl : '/' + recipe.imageUrl}`;
  };

  // Function to search YouTube videos using backend API
  const searchYouTubeVideos = async (recipeName) => {
    if (!recipeName) return;
    
    setLoadingVideos(true);
    try {
      console.log("Searching for videos:", recipeName);
      
      const response = await axios.get(`${API_BASE}/api/youtube/search`, {
        params: {
          recipeName: recipeName
        },
        timeout: 15000
      });

      console.log("YouTube API response:", response.data);

      if (response.data.success && response.data.videos) {
        const videos = response.data.videos;
        setYoutubeVideos(videos);
        
        if (videos.length > 0) {
          setSelectedVideo(videos[0]);
          console.log("Selected first video:", videos[0].title);
        }
      } else {
        console.log("No videos found or API returned unsuccessful response");
        setYoutubeVideos([]);
      }
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      
      if (error.response) {
        console.error('API Error Response:', error.response.data);
      } else if (error.request) {
        console.error('Network Error - No response received');
      } else {
        console.error('Request Setup Error:', error.message);
      }
      
      setYoutubeVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/recipes/${id}`);
        const recipeData = response.data.recipe;
        setRecipe(recipeData);
        
        console.log("Recipe loaded:", recipeData.title || recipeData.name);
        
        if (recipeData && (recipeData.title || recipeData.name)) {
          await searchYouTubeVideos(recipeData.title || recipeData.name);
        }
      } catch (error) {
        setRecipe(null);
        console.error('Error fetching recipe:', error);
      }
    };
    fetchRecipe();
  }, [id]);

  const getYouTubeEmbedUrl = (videoId) => {
    const params = new URLSearchParams({
      autoplay: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3',
      cc_load_policy: '1',
      fs: '1',
      hl: 'en',
      enablejsapi: '1',
      origin: window.location.origin
    });
    
    // ✅ Use youtube-nocookie.com for privacy
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleTranslate = async () => {
    if (isTranslating || isTranslated) return;

    setIsTranslating(true);
    setTranslationProgress(0);

    try {
      console.log('🚀 Starting translation process...');
      
      const skipElements = document.querySelectorAll('i.bx, .bx, svg');
      skipElements.forEach(el => {
        el.setAttribute('translate', 'no');
        if (el.parentElement && el.parentElement.tagName === 'BUTTON') {
          const buttonText = el.parentElement.textContent.trim();
          if (buttonText === '←' || buttonText === '→' || buttonText === '') {
            el.parentElement.setAttribute('translate', 'no');
          }
        }
      });

      const recipeContainer = document.querySelector('.full-recipe-page');
      
      if (!recipeContainer) {
        console.error('❌ Recipe container not found!');
        alert('Hindi makita ang recipe content. Please refresh the page.');
        return;
      }

      console.log('📄 Found recipe container, starting translation...');
      
      await translateContainer(
        recipeContainer,
        'tl',
        (processed, total) => {
          const progress = Math.round((processed / total) * 100);
          setTranslationProgress(progress);
          console.log(`📊 Progress: ${processed}/${total} (${progress}%)`);
        }
      );

      setIsTranslated(true);
      console.log('✅ Tapos na! Lahat ng text ay Tagalog na!');
    } catch (error) {
      console.error('❌ Translation failed:', error);
      alert('Hindi nag-translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  if (!recipe) return <div className="loading-recipe">Loading...</div>;

  return (
    <div className="full-recipe-page">
      <div className="full-recipe-banner">
        <img 
          src={getImageUrl(recipe)} 
          alt={recipe.title || recipe.name} 
          className="full-recipe-img"
          onError={(e) => {
            console.error('Recipe image load error:', recipe.imageUrl);
            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Error';
          }}
        />
        <div className="full-recipe-overlay" />
        <button className="full-recipe-back" onClick={() => navigate(-1)}>← Back</button>
        
        <button 
          className="translate-btn" 
          onClick={handleTranslate}
          disabled={isTranslating || isTranslated}
          title={isTranslated ? "Already translated" : "Translate to Tagalog"}
        >
          {isTranslating ? (
            <>
              <i className="bx bx-loader-alt bx-spin"></i>
              Translating... {translationProgress}%
            </>
          ) : isTranslated ? (
            <>
              <i className="bx bx-check"></i>
              Translated
            </>
          ) : (
            <>
              <i className="bx bx-globe"></i>
              Translate to Tagalog
            </>
          )}
        </button>

        <div className="full-recipe-info">
          <h1>{recipe.title || recipe.name}</h1>
          <div className="full-recipe-tags">
            <span className="tag">{recipe.category}</span>
            <span className="tag">Added: {new Date(recipe.createdAt).toLocaleDateString()}</span>

            {Array.isArray(recipe.dietCategories) && recipe.dietCategories.length > 0
              ? recipe.dietCategories.map(dc => (
                  <span key={dc} className="tag diet-tag">{dc}</span>
                ))
              : (recipe.dietCategory && recipe.dietCategory !== 'None' && (
                  <span className="tag diet-tag">{recipe.dietCategory}</span>
                ))
            }
          </div>
          
          <p className="full-recipe-desc">{recipe.description}</p>
        </div>
        
        {/* ✅ Ingredients & Nutrition Card (COMPACT) */}
        <div className="full-recipe-ingredients-card">
          <div className="card-header">
            <h2>Ingredients & Nutrition</h2>
            <button 
              className="maximize-btn"
              onClick={() => setShowIngredientsModal(true)}
              title="View full details"
            >
              <i className="bx bx-fullscreen"></i>
            </button>
          </div>
          
          {/* Nutrition Preview (TOP 3 only) */}
          {recipe.nutritionalInfo && Object.values(recipe.nutritionalInfo).some(val => val) && (
            <div className="nutrition-info-compact">
              <div className="nutrition-header">
                <i className="bx bx-line-chart"></i>
                <span>Nutrition</span>
                {recipe.servingSize && (
                  <span className="serving-size">{recipe.servingSize}</span>
                )}
              </div>
              
              <div className="nutrition-grid-preview">
                {recipe.nutritionalInfo.calories && (
                  <div className="nutrition-item">
                    <i className="bx bx-bolt"></i>
                    <span className="value">{recipe.nutritionalInfo.calories} kcal</span>
                  </div>
                )}
                
                {recipe.nutritionalInfo.protein && (
                  <div className="nutrition-item">
                    <i className="bx bx-dumbbell"></i>
                    <span className="value">{recipe.nutritionalInfo.protein}g</span>
                  </div>
                )}
                
                {recipe.nutritionalInfo.carbs && (
                  <div className="nutrition-item">
                    <i className="bx bx-food-menu"></i>
                    <span className="value">{recipe.nutritionalInfo.carbs}g</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Ingredients List (FIRST 5 only) */}
          <div className="full-recipe-ingredients-list">
            {recipe.ingredients && recipe.ingredients.slice(0, 5).map((ing, idx) => (
              <div key={idx} className="full-recipe-ingredient-row">
                <span className="amount">
                  {ing.amount && <b>{ing.amount} </b>}
                  {ing.unit && <b>{ing.unit} </b>}
                </span>
                <span>{ing.name}</span>
              </div>
            ))}
            {recipe.ingredients && recipe.ingredients.length > 5 && (
              <div className="more-indicator">
                +{recipe.ingredients.length - 5} more ingredients
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* How to Prepare Section */}
      <div className="full-recipe-steps-section">
        <h2>How to Prepare</h2>
        {(recipe.instructions || recipe.steps) && (recipe.instructions || recipe.steps).map((step, idx) => (
          <div key={idx} className="full-recipe-step">
            <span className="step-num">{idx + 1}</span>
            <div>
              {typeof step === 'string' ? (
                <b>{step}</b>
              ) : (
                <>
                  <b>{step.instruction}</b>
                  <div>{step.details}</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* YouTube Video Section */}
      <div className="youtube-video-section">
        <h2>
          <i className="bx bxl-youtube"></i>
          Video Tutorial
        </h2>
        
        {loadingVideos ? (
          <div className="youtube-loading">
            <div className="loading-spinner"></div>
            <p>Finding cooking videos for you...</p>
          </div>
        ) : youtubeVideos.length > 0 ? (
          <>
            {selectedVideo && (
              <div className="youtube-main-player">
                <div className="video-container">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.id)}
                    title={`${selectedVideo.title} - Cooking Tutorial Video`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  ></iframe>
                </div>
                <div className="video-info">
                  <h3>{selectedVideo.title}</h3>
                  <div className="video-meta">
                    <span>
                      <i className="bx bx-user"></i>
                      {selectedVideo.channelTitle}
                    </span>
                    <span>
                      <i className="bx bx-calendar"></i>
                      {formatDate(selectedVideo.publishedAt)}
                    </span>
                  </div>
                  <p className="video-description">
                    {selectedVideo.description.length > 150 
                      ? `${selectedVideo.description.substring(0, 150)}...` 
                      : selectedVideo.description}
                  </p>
                </div>
              </div>
            )}

            {youtubeVideos.length > 1 && (
              <div className="youtube-playlist">
                <h3>More Video Tutorials</h3>
                <div className="video-grid">
                  {youtubeVideos.map((video) => (
                    <div 
                      key={video.id}
                      className={`video-card ${selectedVideo?.id === video.id ? 'active' : ''}`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="video-thumbnail">
                        <img 
                          src={video.thumbnail} 
                          alt={`Thumbnail for ${video.title}`}
                          loading="lazy"
                        />
                        <div className="play-overlay">
                          <i className="bx bx-play"></i>
                        </div>
                      </div>
                      <div className="video-card-info">
                        <h4>{video.title.length > 60 ? `${video.title.substring(0, 60)}...` : video.title}</h4>
                        <span className="video-channel">{video.channelTitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-videos-found">
            <div className="no-videos-icon">
              <i className="bx bxl-youtube"></i>
            </div>
            <h3>No Videos Found</h3>
            <p>We couldn't find cooking videos for this recipe at the moment.</p>
          </div>
        )}
      </div>

      {/* ✅ NEW: Full Ingredients & Nutrition Modal */}
      {showIngredientsModal && (
        <div className="ingredients-modal-overlay" onClick={() => setShowIngredientsModal(false)}>
          <div className="ingredients-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ingredients & Nutrition</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowIngredientsModal(false)}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* FULL Nutrition Info */}
              {recipe.nutritionalInfo && Object.values(recipe.nutritionalInfo).some(val => val) && (
                <div className="nutrition-section-full">
                  <h3>
                    <i className="bx bx-line-chart"></i>
                    Nutrition Facts
                    {recipe.servingSize && (
                      <span className="serving-badge">{recipe.servingSize}</span>
                    )}
                  </h3>
                  
                  <div className="nutrition-grid-full">
                    {recipe.nutritionalInfo.calories && (
                      <div className="nutrition-item-full">
                        <div className="icon-wrapper">
                          <i className="bx bx-bolt"></i>
                        </div>
                        <div className="nutrition-info">
                          <span className="label">Calories</span>
                          <span className="value">{recipe.nutritionalInfo.calories} kcal</span>
                        </div>
                      </div>
                    )}
                    
                    {recipe.nutritionalInfo.protein && (
                      <div className="nutrition-item-full">
                        <div className="icon-wrapper">
                          <i className="bx bx-dumbbell"></i>
                        </div>
                        <div className="nutrition-info">
                          <span className="label">Protein</span>
                          <span className="value">{recipe.nutritionalInfo.protein}g</span>
                        </div>
                      </div>
                    )}
                    
                    {recipe.nutritionalInfo.carbs && (
                      <div className="nutrition-item-full">
                        <div className="icon-wrapper">
                          <i className="bx bx-food-menu"></i>
                        </div>
                        <div className="nutrition-info">
                          <span className="label">Carbohydrates</span>
                          <span className="value">{recipe.nutritionalInfo.carbs}g</span>
                        </div>
                      </div>
                    )}
                    
                    {recipe.nutritionalInfo.fat && (
                      <div className="nutrition-item-full">
                        <div className="icon-wrapper">
                          <i className="bx bx-droplet"></i>
                        </div>
                        <div className="nutrition-info">
                          <span className="label">Fat</span>
                          <span className="value">{recipe.nutritionalInfo.fat}g</span>
                        </div>
                      </div>
                    )}
                    
                    {recipe.nutritionalInfo.fiber && (
                      <div className="nutrition-item-full">
                        <div className="icon-wrapper">
                          <i className="bx bx-leaf"></i>
                        </div>
                        <div className="nutrition-info">
                          <span className="label">Fiber</span>
                          <span className="value">{recipe.nutritionalInfo.fiber}g</span>
                        </div>
                      </div>
                    )}
                    
                    {recipe.nutritionalInfo.sugar && (
                      <div className="nutrition-item-full">
                        <div className="icon-wrapper">
                          <i className="bx bx-cookie"></i>
                        </div>
                        <div className="nutrition-info">
                          <span className="label">Sugar</span>
                          <span className="value">{recipe.nutritionalInfo.sugar}g</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FULL Ingredients List */}
              <div className="ingredients-section-full">
                <h3>
                  <i className="bx bx-list-ul"></i>
                  Ingredients ({recipe.ingredients?.length || 0})
                </h3>
                
                <div className="ingredients-list-full">
                  {recipe.ingredients && recipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="ingredient-item-full">
                      <span className="ingredient-number">{idx + 1}</span>
                      <div className="ingredient-details">
                        <span className="ingredient-amount">
                          {ing.amount && <b>{ing.amount} </b>}
                          {ing.unit && <b>{ing.unit}</b>}
                        </span>
                        <span className="ingredient-name">{ing.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeFull;