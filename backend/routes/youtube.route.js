import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Search YouTube videos for recipe tutorials
router.get("/search", async (req, res) => {
  try {
    const { recipeName } = req.query;
    
    if (!recipeName) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name is required" 
      });
    }

    // Check if YouTube API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "YouTube API is not configured"
      });
    }

    // Create search query with recipe name and cooking keywords
    const searchQuery = `${recipeName} recipe cooking tutorial how to cook`;
    
    console.log("Searching YouTube for:", searchQuery);

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: 6,
        order: 'relevance',
        videoDuration: 'medium', // 4-20 minutes
        videoDefinition: 'high',
        safeSearch: 'strict',
        regionCode: 'US', // Optional: specify region
        relevanceLanguage: 'en' // Optional: specify language
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.items) {
      const videos = response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId
      }));
      
      console.log(`Found ${videos.length} videos for recipe: ${recipeName}`);
      
      res.json({
        success: true,
        videos,
        count: videos.length,
        query: searchQuery
      });
    } else {
      res.json({
        success: true,
        videos: [],
        count: 0,
        message: "No videos found"
      });
    }
  } catch (error) {
    console.error("YouTube API error:", error.response?.data || error.message);
    
    // Return specific error messages based on the error type
    if (error.response?.status === 403) {
      return res.status(403).json({
        success: false,
        message: "YouTube API quota exceeded or API key is invalid"
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube API request parameters"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to fetch YouTube videos",
      error: error.message
    });
  }
});

// Get video details (optional - for future use)
router.get("/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "YouTube API is not configured"
      });
    }

    const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        part: 'snippet,statistics,contentDetails',
        id: videoId
      }
    });

    if (response.data && response.data.items.length > 0) {
      const video = response.data.items[0];
      res.json({
        success: true,
        video: {
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount,
          likeCount: video.statistics.likeCount
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }
  } catch (error) {
    console.error("YouTube video details error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch video details",
      error: error.message
    });
  }
});

export default router;