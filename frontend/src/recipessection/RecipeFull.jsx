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

  // API Base URL
  const API_BASE = import.meta.env.MODE === "development" 
    ? "http://localhost:5000" 
    : "";

  // Helper function to construct proper image URL
  const getImageUrl = (recipe) => {
    if (!recipe.imageUrl) {
      return 'https://via.placeholder.com/800x400?text=No+Image';
    }
    
    // ✅ If it's already a full URL (Cloudinary), use it directly
    if (recipe.imageUrl.startsWith('http://') || recipe.imageUrl.startsWith('https://')) {
      return recipe.imageUrl;
    }
    
    // ✅ Legacy support for old relative paths
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
        timeout: 15000 // 15 second timeout
      });

      console.log("YouTube API response:", response.data);

      if (response.data.success && response.data.videos) {
        const videos = response.data.videos;
        setYoutubeVideos(videos);
        
        // Automatically select the first video
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
        
        // Search for YouTube videos after recipe is loaded
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

  // Function to get YouTube embed URL with accessibility parameters
  const getYouTubeEmbedUrl = (videoId) => {
    const params = new URLSearchParams({
      autoplay: '0',
      rel: '0',
      modestbranding: '1',
      iv_load_policy: '3', // Hide video annotations
      cc_load_policy: '1', // Show captions by default
      fs: '1', // Allow fullscreen
      hl: 'en', // Interface language
      enablejsapi: '1', // Enable JavaScript API
      origin: window.location.origin
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Function to format video duration or date
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
      
      // Mark only icons and buttons we don't want to translate
      const skipElements = document.querySelectorAll('i.bx, .bx, svg');
      skipElements.forEach(el => {
        el.setAttribute('translate', 'no');
        // Also mark parent button if it only contains icon
        if (el.parentElement && el.parentElement.tagName === 'BUTTON') {
          const buttonText = el.parentElement.textContent.trim();
          if (buttonText === '←' || buttonText === '→' || buttonText === '') {
            el.parentElement.setAttribute('translate', 'no');
          }
        }
      });

      // Get the main recipe container
      const recipeContainer = document.querySelector('.full-recipe-page');
      
      if (!recipeContainer) {
        console.error('❌ Recipe container not found!');
        alert('Hindi makita ang recipe content. Please refresh the page.');
        return;
      }

      console.log('📄 Found recipe container, starting translation...');
      
      // Translate EVERYTHING in the container
      await translateContainer(
        recipeContainer,
        'tl', // Tagalog/Filipino
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
        
        {/* Translate Button */}
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
          </div>
          <p className="full-recipe-desc">{recipe.description}</p>
        </div>
        <div className="full-recipe-ingredients-card">
          <h2>Ingredients</h2>
          <div className="full-recipe-ingredients-list">
            {recipe.ingredients && recipe.ingredients.map((ing, idx) => (
              <div key={idx} className="full-recipe-ingredient-row">
                <span className="amount">
                  {ing.amount && <b>{ing.amount} </b>}
                  {ing.unit && <b>{ing.unit} </b>}
                </span>
                <span>{ing.name}</span>
              </div>
            ))}
            {recipe.ingredients && recipe.ingredients.length > 5 && (
              <div className="scroll-indicator" aria-hidden="true">
                <i className="bx bx-chevron-down"></i>
              </div>
            )}
          </div>
        </div>
      </div>
      
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
            {/* Main Video Player */}
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
                    aria-label={`Video tutorial for ${selectedVideo.title}`}
                    tabIndex="0"
                  ></iframe>
                </div>
                <div className="video-info">
                  <h3>{selectedVideo.title}</h3>
                  <div className="video-meta">
                    <span className="channel-name">
                      <i className="bx bx-user" aria-hidden="true"></i>
                      <span className="sr-only">Channel: </span>
                      {selectedVideo.channelTitle}
                    </span>
                    <span className="video-date">
                      <i className="bx bx-calendar" aria-hidden="true"></i>
                      <span className="sr-only">Published: </span>
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

            {/* Video Playlist */}
            {youtubeVideos.length > 1 && (
              <div className="youtube-playlist">
                <h3>More Video Tutorials</h3>
                <div className="video-grid" role="list">
                  {youtubeVideos.map((video, index) => (
                    <div 
                      key={video.id}
                      className={`video-card ${selectedVideo?.id === video.id ? 'active' : ''}`}
                      onClick={() => setSelectedVideo(video)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedVideo(video);
                        }
                      }}
                      role="listitem"
                      tabIndex="0"
                      aria-label={`Play video: ${video.title} by ${video.channelTitle}`}
                    >
                      <div className="video-thumbnail">
                        <img 
                          src={video.thumbnail} 
                          alt={`Thumbnail for ${video.title}`}
                          loading="lazy"
                        />
                        <div className="play-overlay" aria-hidden="true">
                          <i className="bx bx-play"></i>
                        </div>
                        {selectedVideo?.id === video.id && (
                          <div className="currently-playing" aria-label="Currently playing">
                            <i className="bx bx-play-circle"></i>
                          </div>
                        )}
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

            {/* Alternative link to YouTube */}
            {selectedVideo && (
              <div className="youtube-external-link">
                <a 
                  href={`https://www.youtube.com/watch?v=${selectedVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-youtube-btn"
                  aria-label={`Watch ${selectedVideo.title} on YouTube (opens in new tab)`}
                >
                  <i className="bx bxl-youtube"></i>
                  Watch on YouTube
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="no-videos-found">
            <div className="no-videos-icon">
              <i className="bx bxl-youtube" aria-hidden="true"></i>
            </div>
            <h3>No Videos Found</h3>
            <p>We couldn't find cooking videos for this recipe at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeFull;