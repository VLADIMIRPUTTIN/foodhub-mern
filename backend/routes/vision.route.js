import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";

dotenv.config();

const router = express.Router();

// Setup Google Gemini API with better error handling
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini API initialized successfully");
  } else {
    console.warn("GEMINI_API_KEY not found in environment variables");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
}

// Helper function to strip data URL prefix
function stripDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
}

// Enhanced Roboflow detection with multiple methods
router.post("/detect-and-suggest", async (req, res) => {
  try {
    let { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ 
        success: false, 
        message: "imageBase64 required" 
      });
    }

    // Extract base64 data
    const rawBase64 = stripDataUrl(imageBase64);
    if (!rawBase64) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid imageBase64 format" 
      });
    }

    // Check if Roboflow is configured
    if (!process.env.ROBOFLOW_API_KEY) {
      console.warn("Roboflow not configured - using Gemini fallback");
      return await handleGeminiFallback(rawBase64, res);
    }

    const rfKey = process.env.ROBOFLOW_API_KEY;
    const rfProject = process.env.ROBOFLOW_PROJECT;
    const rfVersion = process.env.ROBOFLOW_MODEL_VERSION || "1";

    console.log("Starting enhanced Roboflow detection...");

    // Method 1: Try the standard detect.roboflow.com API
    const detectResults = await tryRoboflowDetect(rawBase64, rfProject, rfVersion, rfKey);
    
    if (detectResults.success) {
      console.log("Roboflow detect successful");
      return res.json(detectResults);
    }

    // Method 2: Try the infer.roboflow.com API (alternative endpoint)
    const inferResults = await tryRoboflowInfer(rawBase64, rfProject, rfVersion, rfKey);
    
    if (inferResults.success) {
      console.log("Roboflow infer successful");
      return res.json(inferResults);
    }

    // Method 3: Try upload with hosted model URL
    const hostedResults = await tryRoboflowHosted(rawBase64, rfProject, rfVersion, rfKey);
    
    if (hostedResults.success) {
      console.log("Roboflow hosted successful");
      return res.json(hostedResults);
    }

    // Fallback to Gemini if all Roboflow methods fail
    console.warn("All Roboflow methods failed, falling back to Gemini");
    return await handleGeminiFallback(rawBase64, res);

  } catch (error) {
    console.error("detect-and-suggest error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
});

// Method 1: Standard Roboflow Detect API
async function tryRoboflowDetect(base64Image, project, version, apiKey) {
  try {
    const detectUrl = `https://detect.roboflow.com/${project}/${version}?api_key=${apiKey}&format=json`;
    
    console.log("Trying Roboflow detect URL:", detectUrl);

    const response = await axios({
      method: 'POST',
      url: detectUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: base64Image,
      timeout: 30000,
      validateStatus: () => true
    });

    console.log("Roboflow detect response status:", response.status);
    console.log("Roboflow detect response:", JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300 && response.data) {
      return processRoboflowResponse(response.data, 'detect');
    }

    return { success: false, error: `Status ${response.status}` };
  } catch (error) {
    console.error("Roboflow detect error:", error.message);
    return { success: false, error: error.message };
  }
}

// Method 2: Roboflow Infer API
async function tryRoboflowInfer(base64Image, project, version, apiKey) {
  try {
    const inferUrl = `https://infer.roboflow.com/${project}/${version}?api_key=${apiKey}`;
    
    console.log("Trying Roboflow infer URL:", inferUrl);

    const imageBuffer = Buffer.from(base64Image, "base64");
    const form = new FormData();
    form.append("file", imageBuffer, { 
      filename: "image.jpg", 
      contentType: "image/jpeg" 
    });

    const response = await axios.post(inferUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000,
      validateStatus: () => true
    });

    console.log("Roboflow infer response status:", response.status);
    console.log("Roboflow infer response:", JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300 && response.data) {
      return processRoboflowResponse(response.data, 'infer');
    }

    return { success: false, error: `Status ${response.status}` };
  } catch (error) {
    console.error("Roboflow infer error:", error.message);
    return { success: false, error: error.message };
  }
}

// Method 3: Roboflow Hosted Model
async function tryRoboflowHosted(base64Image, project, version, apiKey) {
  try {
    const hostedUrl = `https://api.roboflow.com/v1/detect/${project}/${version}?api_key=${apiKey}`;
    
    console.log("Trying Roboflow hosted URL:", hostedUrl);

    const response = await axios({
      method: 'POST',
      url: hostedUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        image: `data:image/jpeg;base64,${base64Image}`
      },
      timeout: 30000,
      validateStatus: () => true
    });

    console.log("Roboflow hosted response status:", response.status);
    console.log("Roboflow hosted response:", JSON.stringify(response.data, null, 2));

    if (response.status >= 200 && response.status < 300 && response.data) {
      return processRoboflowResponse(response.data, 'hosted');
    }

    return { success: false, error: `Status ${response.status}` };
  } catch (error) {
    console.error("Roboflow hosted error:", error.message);
    return { success: false, error: error.message };
  }
}

// Process Roboflow response into consistent format
function processRoboflowResponse(data, method) {
  try {
    let items = [];
    
    // Handle different response formats
    if (Array.isArray(data.predictions)) {
      items = data.predictions.map(p => ({
        label: p.class || p.label || p.name || "ingredient",
        probability: p.confidence || p.conf || p.score || 0.5,
        box: p.x && p.y && p.width && p.height ? {
          x: (p.x - (p.width / 2)) / (data.image?.width || 640),
          y: (p.y - (p.height / 2)) / (data.image?.height || 640),
          w: p.width / (data.image?.width || 640),
          h: p.height / (data.image?.height || 640)
        } : null,
        raw: p
      }));
    } else if (Array.isArray(data.detections)) {
      items = data.detections.map(d => ({
        label: d.class || d.label || d.name || "ingredient",
        probability: d.confidence || d.conf || d.score || 0.5,
        box: d.bbox ? {
          x: d.bbox[0] / (data.image_width || 640),
          y: d.bbox[1] / (data.image_height || 640),
          w: d.bbox[2] / (data.image_width || 640),
          h: d.bbox[3] / (data.image_height || 640)
        } : null,
        raw: d
      }));
    } else if (data.predicted_classes) {
      // Classification format
      items = data.predicted_classes.map(cls => ({
        label: cls.class || cls.name || "ingredient",
        probability: cls.confidence || 0.5,
        box: null,
        raw: cls
      }));
    }

    // Filter out low confidence detections
    items = items.filter(item => item.probability > 0.3);

    const segmentation = items.map(item => ({
      label: item.label,
      probability: item.probability,
      box: item.box,
      raw: item.raw
    }));

    console.log(`Processed ${items.length} ingredients from ${method} method`);

    return { 
      success: true, 
      segmentation, 
      providerData: data,
      provider: `roboflow-${method}`,
      count: items.length
    };
  } catch (error) {
    console.error("Error processing Roboflow response:", error);
    return { success: false, error: error.message };
  }
}

// Enhanced Gemini Vision fallback with better ingredient detection
async function handleGeminiFallback(base64Image, res) {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "Both Roboflow and Gemini are not configured"
      });
    }

    console.log("Using enhanced Gemini Vision API for ingredient detection");

    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const prompt = `
    You are an expert food ingredient detector. Analyze this image very carefully and identify ALL visible food ingredients, cooking items, spices, vegetables, fruits, proteins, grains, and any edible items.

    Look for:
    - Fresh vegetables and fruits
    - Meat, fish, and proteins
    - Grains, rice, pasta, bread
    - Spices and seasonings
    - Dairy products
    - Canned or packaged foods
    - Cooking oils and sauces
    - Herbs and aromatics

    Return ONLY a JSON array in this exact format:
    [
      {"name": "tomato", "confidence": 0.95},
      {"name": "onion", "confidence": 0.90},
      {"name": "garlic", "confidence": 0.85}
    ]

    Be very specific with ingredient names. If you see multiple items, list them all. Only return the JSON array, nothing else.
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini raw response:", text);

    // Enhanced JSON parsing
    let ingredients = [];
    try {
      // Try to extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        ingredients = parsed.filter(item => 
          item.name && 
          item.name.trim().length > 0 &&
          typeof item.confidence === 'number'
        );
      }
    } catch (parseError) {
      console.warn("Failed to parse Gemini JSON, using text extraction");
      
      // Enhanced text extraction
      const lines = text.split('\n');
      const ingredientWords = [];
      
      for (const line of lines) {
        // Look for ingredient names in quotes or after common patterns
        const matches = line.match(/["']([a-zA-Z\s]+)["']|(\b[a-zA-Z]{3,}\b)/g);
        if (matches) {
          matches.forEach(match => {
            const clean = match.replace(/['"]/g, '').trim().toLowerCase();
            if (clean.length > 2 && !clean.includes('name') && !clean.includes('confidence')) {
              ingredientWords.push(clean);
            }
          });
        }
      }
      
      // Convert to ingredient objects
      ingredients = [...new Set(ingredientWords)].slice(0, 15).map(name => ({
        name: name,
        confidence: 0.7
      }));
    }

    // If still no ingredients, try one more extraction method
    if (ingredients.length === 0) {
      const commonIngredients = [
        'tomato', 'onion', 'garlic', 'rice', 'chicken', 'beef', 'pork', 
        'potato', 'carrot', 'bell pepper', 'ginger', 'soy sauce', 'oil',
        'salt', 'pepper', 'egg', 'flour', 'sugar', 'lettuce', 'cabbage'
      ];
      
      const textLower = text.toLowerCase();
      ingredients = commonIngredients
        .filter(ing => textLower.includes(ing))
        .slice(0, 8)
        .map(name => ({ name, confidence: 0.6 }));
    }

    const segmentation = ingredients.map(ing => ({
      label: ing.name,
      probability: ing.confidence,
      box: null,
      raw: ing
    }));

    console.log(`Gemini detected ${ingredients.length} ingredients:`, ingredients.map(i => i.name));

    return res.json({
      success: true,
      segmentation,
      provider: 'gemini-enhanced',
      note: "Detected using enhanced Gemini Vision API",
      count: ingredients.length
    });

  } catch (geminiError) {
    console.error("Enhanced Gemini fallback error:", geminiError);
    
    // Last resort: return empty results but with success=true
    return res.json({
      success: true,
      segmentation: [],
      provider: 'fallback',
      note: "Could not detect ingredients. Please add them manually.",
      count: 0
    });
  }
}

// Generate recipe suggestions based on ingredients
router.post("/generate-recipe-suggestion", async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Ingredients array is required" 
      });
    }
    
    // Check if Gemini API is available
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured. Please add GEMINI_API_KEY to your environment variables."
      });
    }
    
    // Create the prompt for recipe generation
    const prompt = `
    You are a professional chef and recipe creator. Based on the following ingredients, create a delicious and practical recipe:

    Available Ingredients: ${ingredients.join(", ")}

    Please provide:
    1. A creative recipe name
    2. A complete ingredients list (including quantities and any additional ingredients needed)
    3. Step-by-step cooking instructions

    Format your response exactly like this:
    RECIPE NAME: [Name of the recipe]

    INGREDIENTS:
    - [ingredient 1 with quantity]
    - [ingredient 2 with quantity]
    - [etc...]

    INSTRUCTIONS:
    1. [First step]
    2. [Second step]
    3. [etc...]

    Make sure the recipe is practical and uses most of the detected ingredients. If some ingredients don't work well together, suggest the best combination and mention alternatives.
    `;
    
    try {
      // Generate content with Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the response
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      let title = "AI Generated Recipe";
      let ingredients_list = [];
      let steps = [];
      
      let currentSection = 'none';
      
      for (const line of lines) {
        if (line.startsWith('RECIPE NAME:')) {
          title = line.replace('RECIPE NAME:', '').trim();
        } else if (line.toUpperCase().includes('INGREDIENTS:')) {
          currentSection = 'ingredients';
        } else if (line.toUpperCase().includes('INSTRUCTIONS:')) {
          currentSection = 'instructions';
        } else if (currentSection === 'ingredients' && (line.startsWith('-') || line.startsWith('•'))) {
          ingredients_list.push(line.replace(/^[-•]\s*/, '').trim());
        } else if (currentSection === 'instructions' && /^\d+\./.test(line)) {
          steps.push(line.replace(/^\d+\.\s*/, '').trim());
        }
      }
      
      // Fallback parsing if structured format fails
      if (ingredients_list.length === 0 || steps.length === 0) {
        const titleMatch = text.match(/(?:recipe name|title):\s*(.+)/i);
        if (titleMatch) title = titleMatch[1].trim();
        
        const ingredientSection = text.match(/ingredients?:?\s*([\s\S]*?)(?:instructions?|steps?|method)/i);
        if (ingredientSection) {
          ingredients_list = ingredientSection[1]
            .split('\n')
            .map(line => line.replace(/^[-•*]\s*/, '').trim())
            .filter(line => line.length > 0);
        }
        
        const instructionSection = text.match(/(?:instructions?|steps?|method):?\s*([\s\S]*)/i);
        if (instructionSection) {
          steps = instructionSection[1]
            .split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .filter(line => line.length > 0);
        }
      }
      
      res.json({ 
        success: true, 
        recipe: {
          title,
          ingredients: ingredients_list,
          steps
        },
        rawResponse: text
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      
      // Provide a fallback response
      const fallbackRecipe = {
        title: `Simple Recipe with ${ingredients.slice(0, 3).join(", ")}`,
        ingredients: ingredients.map(ing => `1 portion ${ing}`),
        steps: [
          "Prepare all ingredients by washing and cutting as needed.",
          "Heat a pan or pot over medium heat.",
          "Add the main ingredients and cook according to their requirements.",
          "Season with salt, pepper, and any available spices.",
          "Cook until tender and flavors are well combined.",
          "Serve hot and enjoy your meal!"
        ]
      };
      
      res.json({
        success: true,
        recipe: fallbackRecipe,
        note: "Generated using fallback method due to AI service limitations."
      });
    }
  } catch (error) {
    console.error("Error generating recipe suggestion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate recipe suggestion",
      error: error.message 
    });
  }
});

// Generate cooking instructions route
router.post("/generate-cooking-instructions", verifyToken, async (req, res) => {
  try {
    const { recipeName, recipeInstructions, availableIngredients, missingIngredients } = req.body;
    
    if (!recipeName || !recipeInstructions || !availableIngredients) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required information" 
      });
    }
    
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured. Please add GEMINI_API_KEY to your environment variables."
      });
    }
    
    const instructionsText = Array.isArray(recipeInstructions) 
      ? recipeInstructions.join("\n") 
      : recipeInstructions;
    
    const prompt = `
    You are a helpful cooking assistant. I want to make "${recipeName}" but I'm missing some ingredients.

    The original recipe instructions are:
    ${instructionsText}
    
    Ingredients I HAVE:
    ${availableIngredients.join(", ")}
    
    Ingredients I DON'T HAVE:
    ${missingIngredients.join(", ")}
    
    Please help me adapt the recipe using only the ingredients I have. If it's not possible to make something similar, suggest alternative simple dishes I could make with my available ingredients. Make your response conversational and encouraging.
    `;
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      res.json({ 
        success: true, 
        instructions: text 
      });
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      
      const fallbackResponse = `
I see you're making ${recipeName}.

Here are some general tips for adapting recipes:

1. For missing ingredients, look for substitutes with similar properties
2. Focus on the cooking techniques from the original recipe
3. Simplify the recipe by omitting non-essential ingredients
4. Try a different cooking method if needed

Check the full recipe and see which steps you can still follow with your available ingredients!
      `;
      
      res.json({
        success: true,
        instructions: fallbackResponse
      });
    }
  } catch (error) {
    console.error("Error generating cooking instructions:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate cooking instructions",
      error: error.message 
    });
  }
});

// Update the suggest-ingredients route to use async
router.post("/suggest-ingredients", async (req, res) => {
  try {
    console.log("Ingredient suggestion request received for:", req.body.recipeName);
    const { recipeName } = req.body;
    
    if (!recipeName) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name is required" 
      });
    }
    
    // Use the async handleFallbackIngredients function
    return await handleFallbackIngredients(recipeName, res);
    
  } catch (error) {
    console.error("Error in suggest-ingredients:", error);
    // Don't crash the server, return a basic response
    return res.status(500).json({
      success: false,
      message: "Error generating ingredients",
      error: error.message
    });
  }
});

// Replace the hardcoded getDefaultIngredients function with this dynamic version
async function getDefaultIngredients(recipeName) {
  try {
    // First try to get ingredients from database
    const { Ingredient } = await import('../models/ingredient.model.js');
    
    // Get all ingredients from the database
    const allIngredients = await Ingredient.find({}).lean();
    console.log(`Found ${allIngredients.length} ingredients in database`);
    
    if (allIngredients.length > 0) {
      // If we have ingredients in the database, use them
      // Select 8-12 random ingredients
      const ingredientCount = Math.min(allIngredients.length, Math.floor(Math.random() * 5) + 8);
      
      // Shuffle and slice
      const selectedIngredients = [...allIngredients]
        .sort(() => 0.5 - Math.random())
        .slice(0, ingredientCount);
      
      // Common units to assign randomly
      const units = ['cups', 'tbsp', 'tsp', 'g', 'kg', 'ml', 'l', 'pieces'];
      
      // Map to proper format with amounts and units
      return selectedIngredients.map(ing => ({
        name: ing.name,
        amount: Math.ceil(Math.random() * 3).toString(),
        unit: units[Math.floor(Math.random() * units.length)]
      }));
    }
    
    // If no ingredients in database, return just a few basic ones
    return [
      { name: "Salt", amount: "1", unit: "tsp" },
      { name: "Pepper", amount: "1/2", unit: "tsp" },
      { name: "Garlic", amount: "3", unit: "pieces" },
      { name: "Onion", amount: "1", unit: "piece" },
      { name: "Vegetable oil", amount: "2", unit: "tbsp" }
    ];
  } catch (error) {
    console.error("Error getting ingredients from database:", error);
    // Fallback to minimal list if database error
    return [
      { name: "Salt", amount: "1", unit: "tsp" },
      { name: "Pepper", amount: "1/2", unit: "tsp" },
      { name: "Garlic", amount: "3", unit: "pieces" },
      { name: "Onion", amount: "1", unit: "piece" }
    ];
  }
}

// Update the handleFallbackIngredients function to support async
async function handleFallbackIngredients(recipeName, res) {
  try {
    const ingredients = await getDefaultIngredients(recipeName);
    
    console.log(`Using dynamic ingredients from system: ${ingredients.length} items`);
    
    return res.json({
      success: true,
      ingredients: ingredients,
      source: "system-database"
    });
  } catch (error) {
    console.error("Error in fallback ingredients:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating ingredients",
      error: error.message
    });
  }
}

// Add this route to generate preparation steps
router.post("/suggest-steps", async (req, res) => {
  try {
    console.log("Step suggestion request received for:", req.body.recipeName);
    const { recipeName, ingredients, category } = req.body;
    
    if (!recipeName || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name and ingredients are required" 
      });
    }
    
    // Use handleFallbackSteps to generate steps
    return await handleFallbackSteps(recipeName, ingredients, category, res);
    
  } catch (error) {
    console.error("Error in suggest-steps:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating preparation steps",
      error: error.message
    });
  }
});

// Add this function to generate steps based on recipe and ingredients
async function handleFallbackSteps(recipeName, ingredients, category, res) {
  try {
    // Generate steps based on recipe name and ingredients
    const steps = generateGenericSteps(recipeName, ingredients, category);
    
    console.log(`Generated ${steps.length} steps for "${recipeName}"`);
    
    return res.json({
      success: true,
      steps: steps,
      source: "system-generated"
    });
  } catch (error) {
    console.error("Error generating steps:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating steps",
      error: error.message
    });
  }
}

// Function to generate generic but customized steps
function generateGenericSteps(recipeName, ingredients, category) {
  const mainIngredients = ingredients.slice(0, 3).join(", ");
  const isProtein = ingredients.some(ing => 
    ing.toLowerCase().includes('chicken') || 
    ing.toLowerCase().includes('beef') || 
    ing.toLowerCase().includes('pork') || 
    ing.toLowerCase().includes('fish') ||
    ing.toLowerCase().includes('meat')
  );
  
  const isRice = ingredients.some(ing => ing.toLowerCase().includes('rice'));
  const isPasta = ingredients.some(ing => 
    ing.toLowerCase().includes('pasta') || 
    ing.toLowerCase().includes('noodle')
  );
  
  let cookingMethod = "cook";
  let cookingTime = "20-30 minutes";
  
  if (category === 'Soup') {
    cookingMethod = "simmer";
    cookingTime = "30-40 minutes";
  } else if (isProtein) {
    cookingMethod = "sauté";
    cookingTime = "15-20 minutes";
  } else if (isRice) {
    cookingMethod = "boil";
    cookingTime = "20 minutes";
  } else if (isPasta) {
    cookingMethod = "boil";
    cookingTime = "10-12 minutes";
  }
  
  return [
    {
      instruction: "Prepare ingredients",
      details: `Gather all ingredients for ${recipeName}. Wash, peel, and chop vegetables as needed. Measure out all ingredients before beginning.`
    },
    {
      instruction: "Prepare cooking equipment",
      details: `Heat a pot or pan over medium heat. Add oil or butter if the recipe requires it.`
    },
    {
      instruction: `${cookingMethod.charAt(0).toUpperCase() + cookingMethod.slice(1)} main ingredients`,
      details: `Add ${mainIngredients} to the pot/pan and ${cookingMethod} for approximately ${cookingTime}, stirring occasionally.`
    },
    {
      instruction: "Add seasonings",
      details: `Season with salt, pepper, and other spices to taste. Stir well to combine all flavors.`
    },
    {
      instruction: "Complete the cooking process",
      details: `Cover and reduce heat if needed. Continue cooking until all ingredients are tender and flavors are well combined.`
    },
    {
      instruction: "Serve and enjoy",
      details: `Remove ${recipeName} from heat and transfer to serving dishes. Garnish if desired and serve immediately.`
    }
  ];
}

export default router;