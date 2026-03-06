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
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [copySuccess, setCopySuccess] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const API_BASE = import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "";

  const getImageUrl = (recipe) => {
    if (!recipe.imageUrl) return 'https://via.placeholder.com/800x400?text=No+Image';
    if (recipe.imageUrl.startsWith('http://') || recipe.imageUrl.startsWith('https://')) return recipe.imageUrl;
    const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "";
    return `${baseURL}${recipe.imageUrl.startsWith('/') ? recipe.imageUrl : '/' + recipe.imageUrl}`;
  };

  const searchYouTubeVideos = async (recipeName) => {
    if (!recipeName) return;
    setLoadingVideos(true);
    try {
      const response = await axios.get(`${API_BASE}/api/youtube/search`, {
        params: { recipeName },
        timeout: 15000
      });
      if (response.data.success && response.data.videos) {
        const videos = response.data.videos;
        setYoutubeVideos(videos);
        if (videos.length > 0) setSelectedVideo(videos[0]);
      } else {
        setYoutubeVideos([]);
      }
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
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
      autoplay: '0', rel: '0', modestbranding: '1',
      iv_load_policy: '3', cc_load_policy: '1', fs: '1',
      hl: 'en', enablejsapi: '1', origin: window.location.origin
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleTranslate = async () => {
    if (isTranslating || isTranslated) return;
    setIsTranslating(true);
    setTranslationProgress(0);
    try {
      const skipElements = document.querySelectorAll('i.bx, .bx, svg');
      skipElements.forEach(el => el.setAttribute('translate', 'no'));
      const recipeContainer = document.querySelector('.full-recipe-page');
      if (!recipeContainer) {
        alert('Hindi makita ang recipe content. Please refresh the page.');
        return;
      }
      await translateContainer(recipeContainer, 'tl', (processed, total) => {
        setTranslationProgress(Math.round((processed / total) * 100));
      });
      setIsTranslated(true);
    } catch (error) {
      console.error('Translation failed:', error);
      alert('Hindi nag-translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleStep = (idx) => {
    setActiveStep(activeStep === idx ? null : idx);
  };

  const toggleStepComplete = (e, idx) => {
    e.stopPropagation();
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = recipe?.title || recipe?.name || 'Recipe';
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch {}
    } else {
      setShowShareMenu(prev => !prev);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => { setCopySuccess(false); setShowShareMenu(false); }, 2000);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => { window.print(); setIsPrinting(false); }, 300);
  };

  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return '#6b7280';
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const totalSteps = recipe ? (recipe.instructions || recipe.steps || []).length : 0;
  const progressPercent = totalSteps ? Math.round((completedSteps.size / totalSteps) * 100) : 0;

  if (!recipe) return (
    <div className="loading-recipe">
      <div className="loading-spinner-container">
        <div className="loading-circle"></div>
        <p>Loading recipe...</p>
      </div>
    </div>
  );

  return (
    <div className="full-recipe-page">
      
      {/* ===== HERO BANNER ===== */}
      <div className="full-recipe-banner">
        <img
          src={getImageUrl(recipe)}
          alt={recipe.title || recipe.name}
          className={`full-recipe-img ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400?text=Image+Error'; }}
        />
        <div className="full-recipe-overlay" />

        {/* Top Controls */}
        <div className="banner-top-controls">
          <button className="full-recipe-back" onClick={() => navigate(-1)}>
            <i className="bx bx-arrow-back"></i>
            <span>Back</span>
          </button>

          <div className="banner-actions">
            {/* Translate Button */}
            <button
              className={`action-btn translate-btn ${isTranslated ? 'translated' : ''}`}
              onClick={handleTranslate}
              disabled={isTranslating || isTranslated}
              title={isTranslated ? "Already translated" : "Translate to Tagalog"}
            >
              {isTranslating ? (
                <><i className="bx bx-loader-alt bx-spin"></i><span>{translationProgress}%</span></>
              ) : isTranslated ? (
                <><i className="bx bx-check"></i><span>Translated</span></>
              ) : (
                <><i className="bx bx-globe"></i><span>Tagalog</span></>
              )}
            </button>

            {/* Share Button */}
            <div className="share-wrapper">
              <button className="action-btn share-btn" onClick={handleShare} title="Share Recipe">
                <i className="bx bx-share-alt"></i>
                <span>Share</span>
              </button>
              {showShareMenu && (
                <div className="share-dropdown">
                  <button onClick={handleCopyLink}>
                    <i className={`bx ${copySuccess ? 'bx-check' : 'bx-link'}`}></i>
                    {copySuccess ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}>
                    <i className="bx bxl-facebook-circle"></i>
                    Facebook
                  </button>
                  <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${recipe.title || recipe.name}`, '_blank')}>
                    <i className="bx bxl-twitter"></i>
                    Twitter
                  </button>
                </div>
              )}
            </div>

            {/* Print Button */}
            <button className="action-btn print-btn" onClick={handlePrint} title="Print Recipe" disabled={isPrinting}>
              <i className={`bx ${isPrinting ? 'bx-loader-alt bx-spin' : 'bx-printer'}`}></i>
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Recipe Info Overlay */}
        <div className="full-recipe-info">
          {/* Breadcrumb */}
          <div className="recipe-breadcrumb">
            <span onClick={() => navigate('/recipes')} className="breadcrumb-link">Recipes</span>
            <i className="bx bx-chevron-right"></i>
            <span>{recipe.category || 'Uncategorized'}</span>
          </div>

          <h1>{recipe.title || recipe.name}</h1>

          {/* Tags */}
          <div className="full-recipe-tags">
            {recipe.category && <span className="tag category-tag"><i className="bx bx-category"></i>{recipe.category}</span>}
            {recipe.difficulty && (
              <span className="tag difficulty-tag" style={{ '--diff-color': getDifficultyColor(recipe.difficulty) }}>
                <i className="bx bx-signal-5"></i>{recipe.difficulty}
              </span>
            )}
            {Array.isArray(recipe.dietCategories) && recipe.dietCategories.length > 0
              ? recipe.dietCategories.map(dc => (
                  <span key={dc} className="tag diet-tag"><i className="bx bx-leaf"></i>{dc}</span>
                ))
              : (recipe.dietCategory && recipe.dietCategory !== 'None' && (
                  <span className="tag diet-tag"><i className="bx bx-leaf"></i>{recipe.dietCategory}</span>
                ))
            }
            <span className="tag date-tag">
              <i className="bx bx-calendar"></i>Added {formatDate(recipe.createdAt)}
            </span>
          </div>

          {/* Meta Stats */}
          <div className="recipe-meta-stats">
            {recipe.cookingTime && (
              <div className="meta-stat">
                <i className="bx bx-time-five"></i>
                <div>
                  <span className="stat-label">Cook Time</span>
                  <span className="stat-value">{recipe.cookingTime} min</span>
                </div>
              </div>
            )}
            {recipe.servings && (
              <div className="meta-stat">
                <i className="bx bx-group"></i>
                <div>
                  <span className="stat-label">Servings</span>
                  <span className="stat-value">{recipe.servings} {recipe.servings === 1 ? 'person' : 'people'}</span>
                </div>
              </div>
            )}
            {recipe.ingredients && (
              <div className="meta-stat">
                <i className="bx bx-list-ul"></i>
                <div>
                  <span className="stat-label">Ingredients</span>
                  <span className="stat-value">{recipe.ingredients.length} items</span>
                </div>
              </div>
            )}
            {recipe.createdBy && (
              <div className="meta-stat">
                <i className="bx bx-user-circle"></i>
                <div>
                  <span className="stat-label">By</span>
                  <span className="stat-value">{recipe.createdBy.name || 'FoodHub'}</span>
                </div>
              </div>
            )}
          </div>

          <p className="full-recipe-desc">{recipe.description}</p>
        </div>

        {/* Ingredients & Nutrition Card */}
        <div className="full-recipe-ingredients-card">
          <div className="card-header">
            <h2><i className="bx bx-bowl-hot"></i> Ingredients & Nutrition</h2>
            <button
              className="maximize-btn"
              onClick={() => setShowIngredientsModal(true)}
              title="View full details"
            >
              <i className="bx bx-expand-alt"></i>
              <span>Full View</span>
            </button>
          </div>

          {/* Nutrition Preview */}
          {recipe.nutritionalInfo && Object.values(recipe.nutritionalInfo).some(val => val) && (
            <div className="nutrition-info-compact">
              <div className="nutrition-header">
                <i className="bx bx-line-chart"></i>
                <span>Nutrition Per Serving</span>
                {recipe.servingSize && <span className="serving-size">{recipe.servingSize}</span>}
              </div>
              <div className="nutrition-grid-preview">
                {recipe.nutritionalInfo.calories && (
                  <div className="nutrition-item">
                    <div className="nut-icon calories"><i className="bx bx-bolt"></i></div>
                    <div><span className="nut-val">{recipe.nutritionalInfo.calories}</span><span className="nut-label">kcal</span></div>
                  </div>
                )}
                {recipe.nutritionalInfo.protein && (
                  <div className="nutrition-item">
                    <div className="nut-icon protein"><i className="bx bx-dumbbell"></i></div>
                    <div><span className="nut-val">{recipe.nutritionalInfo.protein}g</span><span className="nut-label">protein</span></div>
                  </div>
                )}
                {recipe.nutritionalInfo.carbs && (
                  <div className="nutrition-item">
                    <div className="nut-icon carbs"><i className="bx bx-cookie"></i></div>
                    <div><span className="nut-val">{recipe.nutritionalInfo.carbs}g</span><span className="nut-label">carbs</span></div>
                  </div>
                )}
                {recipe.nutritionalInfo.fat && (
                  <div className="nutrition-item">
                    <div className="nut-icon fat"><i className="bx bx-water"></i></div>
                    <div><span className="nut-val">{recipe.nutritionalInfo.fat}g</span><span className="nut-label">fat</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ingredients List */}
          <div className="full-recipe-ingredients-list">
            {recipe.ingredients && recipe.ingredients.slice(0, 6).map((ing, idx) => (
              <div key={idx} className="full-recipe-ingredient-row">
                <span className="ing-dot"></span>
                <span className="amount">
                  {ing.amount && <b>{ing.amount} </b>}
                  {ing.unit && <b>{ing.unit} </b>}
                </span>
                <span className="ing-name">{ing.name}</span>
              </div>
            ))}
            {recipe.ingredients && recipe.ingredients.length > 6 && (
              <button className="more-indicator" onClick={() => setShowIngredientsModal(true)}>
                <i className="bx bx-plus-circle"></i>
                {recipe.ingredients.length - 6} more ingredients — tap to view all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== HOW TO PREPARE SECTION ===== */}
      <div className="full-recipe-steps-section">
        <div className="steps-header">
          <h2><i className="bx bx-book-open"></i> How to Prepare</h2>
          {totalSteps > 0 && (
            <div className="steps-progress-bar-wrapper">
              <div className="steps-progress-info">
                <span>{completedSteps.size} of {totalSteps} steps done</span>
                <span className="progress-pct">{progressPercent}%</span>
              </div>
              <div className="steps-progress-bar">
                <div className="steps-progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              {completedSteps.size === totalSteps && totalSteps > 0 && (
                <div className="cooking-done-badge">
                  <i className="bx bxs-star"></i> Recipe Complete! Enjoy your meal!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="steps-list">
          {(recipe.instructions || recipe.steps || []).map((step, idx) => (
            <div
              key={idx}
              className={`full-recipe-step ${activeStep === idx ? 'expanded' : ''} ${completedSteps.has(idx) ? 'completed' : ''}`}
              onClick={() => toggleStep(idx)}
            >
              <div className="step-left">
                <button
                  className={`step-check-btn ${completedSteps.has(idx) ? 'checked' : ''}`}
                  onClick={(e) => toggleStepComplete(e, idx)}
                  title={completedSteps.has(idx) ? 'Mark as not done' : 'Mark as done'}
                >
                  {completedSteps.has(idx) ? <i className="bx bx-check"></i> : <span className="step-num">{idx + 1}</span>}
                </button>
              </div>
              <div className="step-content">
                {typeof step === 'string' ? (
                  <p className="step-text">{step}</p>
                ) : (
                  <>
                    <p className="step-text">{step.instruction}</p>
                    {step.details && activeStep === idx && (
                      <p className="step-details">{step.details}</p>
                    )}
                  </>
                )}
              </div>
              <div className="step-expand-icon">
                <i className={`bx ${activeStep === idx ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== YOUTUBE SECTION ===== */}
      <div className="youtube-video-section">
        <div className="youtube-section-header">
          <h2>
            <span className="yt-icon-wrap"><i className="bx bxl-youtube"></i></span>
            Video Tutorials
          </h2>
          <p>Watch how to make <strong>{recipe.title || recipe.name}</strong></p>
        </div>

        {loadingVideos ? (
          <div className="youtube-loading">
            <div className="loading-spinner"></div>
            <p>Finding cooking videos for you...</p>
          </div>
        ) : youtubeVideos.length > 0 ? (
          <div className="youtube-layout">
            {selectedVideo && (
              <div className="youtube-main-player">
                <div className="video-container">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedVideo.id)}
                    title={`${selectedVideo.title} - Cooking Tutorial Video`}
                    width="100%" height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  ></iframe>
                </div>
                <div className="video-info">
                  <h3>{selectedVideo.title}</h3>
                  <div className="video-meta">
                    <span><i className="bx bx-user"></i>{selectedVideo.channelTitle}</span>
                    <span><i className="bx bx-calendar"></i>{formatDate(selectedVideo.publishedAt)}</span>
                  </div>
                  {selectedVideo.description && (
                    <p className="video-description">
                      {selectedVideo.description.length > 200
                        ? `${selectedVideo.description.substring(0, 200)}...`
                        : selectedVideo.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {youtubeVideos.length > 1 && (
              <div className="youtube-playlist">
                <h3><i className="bx bx-list-ul"></i> More Tutorials</h3>
                <div className="video-grid">
                  {youtubeVideos.map((video) => (
                    <div
                      key={video.id}
                      className={`video-card ${selectedVideo?.id === video.id ? 'active' : ''}`}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="video-thumbnail">
                        <img src={video.thumbnail} alt={`Thumbnail for ${video.title}`} loading="lazy" />
                        <div className="play-overlay">
                          <div className="play-btn-circle">
                            <i className="bx bx-play"></i>
                          </div>
                        </div>
                        {selectedVideo?.id === video.id && (
                          <div className="now-playing-badge">
                            <i className="bx bx-volume-full"></i> Now Playing
                          </div>
                        )}
                      </div>
                      <div className="video-card-info">
                        <h4>{video.title.length > 55 ? `${video.title.substring(0, 55)}...` : video.title}</h4>
                        <span className="video-channel"><i className="bx bx-user"></i>{video.channelTitle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-videos-found">
            <div className="no-videos-icon"><i className="bx bxl-youtube"></i></div>
            <h3>No Videos Found</h3>
            <p>We couldn't find cooking videos for this recipe at the moment.</p>
            <button onClick={() => searchYouTubeVideos(recipe.title || recipe.name)} className="retry-btn">
              <i className="bx bx-refresh"></i> Try Again
            </button>
          </div>
        )}
      </div>

      {/* ===== FULL INGREDIENTS & NUTRITION MODAL ===== */}
      {showIngredientsModal && (
        <div className="ingredients-modal-overlay" onClick={() => setShowIngredientsModal(false)}>
          <div className="ingredients-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <h2><i className="bx bx-bowl-hot"></i> Ingredients & Nutrition</h2>
                <p className="modal-subtitle">{recipe.title || recipe.name}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowIngredientsModal(false)}>
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
                    {recipe.servingSize && <span className="serving-badge">Per {recipe.servingSize}</span>}
                  </h3>
                  <div className="nutrition-grid-full">
                    {[
                      { key: 'calories', label: 'Calories', unit: 'kcal', icon: 'bx-bolt', color: '#f59e0b' },
                      { key: 'protein', label: 'Protein', unit: 'g', icon: 'bx-dumbbell', color: '#3b82f6' },
                      { key: 'carbs', label: 'Carbohydrates', unit: 'g', icon: 'bx-cookie', color: '#8b5cf6' },
                      { key: 'fat', label: 'Fat', unit: 'g', icon: 'bx-water', color: '#ef4444' },
                      { key: 'fiber', label: 'Fiber', unit: 'g', icon: 'bx-leaf', color: '#22c55e' },
                      { key: 'sugar', label: 'Sugar', unit: 'g', icon: 'bx-lemon', color: '#ec4899' },
                    ].map(({ key, label, unit, icon, color }) =>
                      recipe.nutritionalInfo[key] ? (
                        <div className="nutrition-item-full" key={key} style={{ '--nut-color': color }}>
                          <div className="icon-wrapper">
                            <i className={`bx ${icon}`}></i>
                          </div>
                          <div className="nutrition-info">
                            <span className="label">{label}</span>
                            <span className="value">{recipe.nutritionalInfo[key]} {unit}</span>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {/* FULL Ingredients List */}
              <div className="ingredients-section-full">
                <h3>
                  <i className="bx bx-list-check"></i>
                  All Ingredients
                  <span className="count-chip">{recipe.ingredients?.length || 0}</span>
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