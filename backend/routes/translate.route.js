import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Lingva Translate instances (fallback if one fails)
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://translate.igna.wtf',
  'https://lingva.lunar.icu',
  'https://translate.projectsegfau.lt'
];

let currentInstanceIndex = 0;

/**
 * Get next available Lingva instance
 */
function getNextInstance() {
  const instance = LINGVA_INSTANCES[currentInstanceIndex];
  currentInstanceIndex = (currentInstanceIndex + 1) % LINGVA_INSTANCES.length;
  return instance;
}

/**
 * Helper function to delay between requests
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Translate text using Lingva Translate API
 */
async function translateWithLingva(text, target = 'tl', source = 'auto') {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Skip pure numbers
  if (/^\d+$/.test(text.trim())) {
    return text;
  }

  // Try multiple instances if one fails
  for (let attempt = 0; attempt < LINGVA_INSTANCES.length; attempt++) {
    const instance = getNextInstance();
    
    try {
      // URL encode the query
      const encodedQuery = encodeURIComponent(text);
      const url = `${instance}/api/v1/${source}/${target}/${encodedQuery}`;
      
      const response = await axios.get(url, {
        timeout: 5000, // Reduced timeout from 10s to 5s
        headers: {
          'User-Agent': 'FoodHub-MERN/1.0'
        }
      });

      if (response.data && response.data.translation) {
        const translated = response.data.translation;
        return translated;
      }
      
    } catch (error) {
      // Try next instance immediately without logging (faster)
      if (attempt < LINGVA_INSTANCES.length - 1) {
        continue;
      }
    }
  }
  
  // If all instances fail, return original text
  return text;
}

/**
 * POST /api/translate
 * Translate single text
 */
router.post('/', async (req, res) => {
  try {
    const { text, target = 'tl', source = 'auto' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const translatedText = await translateWithLingva(text, target, source);

    res.json({
      success: true,
      translatedText: translatedText,
      originalText: text
    });

  } catch (error) {
    console.error('❌ Translation error:', error.message);
    
    res.json({
      success: true,
      translatedText: req.body.text,
      originalText: req.body.text,
      note: 'Translation unavailable, showing original text'
    });
  }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts with PARALLEL processing for speed
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts, target = 'tl', source = 'auto' } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({
        success: false,
        message: 'Texts array is required'
      });
    }

    console.log(`\n📦 Fast batch translating ${texts.length} texts to ${target}`);

    // PARALLEL TRANSLATION - Translate multiple texts at once!
    const CONCURRENT_LIMIT = 5; // Translate 5 at a time
    const translations = new Array(texts.length);
    
    for (let i = 0; i < texts.length; i += CONCURRENT_LIMIT) {
      const batch = texts.slice(i, i + CONCURRENT_LIMIT);
      const batchPromises = batch.map(async (text, index) => {
        if (!text || text.trim().length === 0) {
          return text;
        }
        
        try {
          const translated = await translateWithLingva(text, target, source);
          return translated;
        } catch (error) {
          return text;
        }
      });

      // Wait for this batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Store results in correct positions
      batchResults.forEach((result, index) => {
        translations[i + index] = result;
      });

      console.log(`✅ Batch ${Math.floor(i / CONCURRENT_LIMIT) + 1}: ${i + batchResults.length}/${texts.length} completed`);
      
      // Small delay between batches only
      if (i + CONCURRENT_LIMIT < texts.length) {
        await delay(100); // Very short delay between batches
      }
    }

    const changed = translations.filter((t, i) => t !== texts[i]).length;
    console.log(`✨ Fast translation complete: ${changed}/${texts.length} texts translated\n`);

    res.json({
      success: true,
      translations: translations,
      stats: {
        total: texts.length,
        translated: changed,
        failed: texts.length - changed
      }
    });

  } catch (error) {
    console.error('❌ Batch translation error:', error.message);
    
    res.json({
      success: true,
      translations: req.body.texts
    });
  }
});

export default router;