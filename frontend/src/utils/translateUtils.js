/**
 * Translation utility using backend API
 * Translates ALL text to Tagalog/Filipino
 */

// Get API base URL
const API_BASE = import.meta.env.MODE === "development" 
  ? "http://localhost:5000" 
  : "";

/**
 * Translate text using backend API
 * @param {string} text - Text to translate
 * @param {string} target - Target language code (default: 'tl' for Tagalog)
 * @returns {Promise<string>} Translated text
 */
export const translateText = async (text, target = 'tl') => {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    const response = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        source: 'auto',
        target: target,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

/**
 * Batch translate multiple texts using backend API
 * @param {string[]} texts - Array of texts to translate
 * @param {string} target - Target language code
 * @returns {Promise<string[]>} Array of translated texts
 */
export const batchTranslate = async (texts, target = 'tl') => {
  try {
    const response = await fetch(`${API_BASE}/api/translate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: texts,
        source: 'auto',
        target: target,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations || texts;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
};

/**
 * Get all text nodes in an element recursively
 */
function getAllTextNodes(element, textNodes = []) {
  // Skip these elements completely
  const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'];
  if (skipTags.includes(element.tagName)) {
    return textNodes;
  }

  // Skip if marked with translate="no"
  if (element.getAttribute && element.getAttribute('translate') === 'no') {
    return textNodes;
  }

  for (let node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      // Only add if it has meaningful text (not just whitespace)
      if (text.length > 0 && text !== '←' && text !== '→') {
        textNodes.push(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      getAllTextNodes(node, textNodes);
    }
  }

  return textNodes;
}

/**
 * Translate all text content in a container - LAHAT NG TEXT!
 * @param {HTMLElement} container - Container to translate
 * @param {string} target - Target language code
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export const translateContainer = async (container, target = 'tl', onProgress = null) => {
  try {
    console.log('🌐 Starting translation to Filipino/Tagalog...');
    
    // Get ALL text nodes in the container
    const textNodes = getAllTextNodes(container);
    const total = textNodes.length;
    
    console.log(`📝 Found ${total} text nodes to translate`);
    
    if (total === 0) {
      console.log('⚠️ No text found to translate');
      if (onProgress) onProgress(0, 0);
      return;
    }

    let processed = 0;
    const batchSize = 10; // Translate 10 texts at a time

    // Process in batches
    for (let i = 0; i < textNodes.length; i += batchSize) {
      const batch = textNodes.slice(i, i + batchSize);
      const texts = batch.map(node => node.textContent.trim());
      
      console.log(`\n📦 Batch ${Math.floor(i / batchSize) + 1}:`);
      console.log('Original texts:', texts);

      // Translate the batch
      const translations = await batchTranslate(texts, target);
      
      console.log('Translated texts:', translations);

      // Apply translations to text nodes
      batch.forEach((node, index) => {
        const original = texts[index];
        const translated = translations[index];
        
        if (translated && translated !== original) {
          node.textContent = translated;
          console.log(`✅ "${original}" → "${translated}"`);
        }
        
        processed++;
        if (onProgress) {
          onProgress(processed, total);
        }
      });

      // Small delay between batches to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n✨ Translation complete! Lahat ng text ay naka-Tagalog na!');
  } catch (error) {
    console.error('❌ Translation error:', error);
    throw error;
  }
};