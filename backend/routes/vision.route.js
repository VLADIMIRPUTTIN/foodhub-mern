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

// New AI-powered function to replace getKnownRecipes and other hardcoded functions
async function generateIngredientsWithAI(recipeName, description, res) {
  try {
    console.log(`Generating AI ingredients for recipe: ${recipeName}`);
    
    // Check if Gemini AI is available
    if (!genAI) {
      console.log("Gemini AI not available, using minimal ingredients");
      return res.json({
        success: true,
        ingredients: getBasicCookingIngredients(),
        source: "system-minimal"
      });
    }
    
    // Create a much more specific prompt for the AI with stronger instructions
    const prompt = `
    You are a professional chef specializing specifically in the recipe "${recipeName}".
    ${description ? `The recipe description is: "${description}"` : ""}

    IMPORTANT INSTRUCTION: Provide ONLY the authentic, traditional ingredients for ${recipeName}.
    DO NOT include any random or unrelated ingredients that don't belong in this dish.
    
    For example, if this is "Chicken Adobo", ONLY include ingredients like chicken, soy sauce, vinegar, 
    garlic, bay leaves, and peppercorns - NOT unrelated ingredients like eggplant, tuna, crab, etc.

    Return ONLY a JSON array of ingredient objects in this exact format:
    [
      {"name": "ingredient name", "amount": "quantity", "unit": "measurement unit"},
      {"name": "next ingredient", "amount": "quantity", "unit": "measurement unit"}
    ]
    
    Use appropriate units (cups, tbsp, tsp, g, kg, pieces, etc.) and realistic amounts for each ingredient.
    IMPORTANT: Double check that EVERY ingredient you list is actually used in a traditional ${recipeName} recipe.
    `;
    
    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.2, // Lower temperature for more focused/accurate responses
        topP: 0.8,
        topK: 40
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw AI ingredients response:", text);
    
    // Parse the JSON from the response
    try {
      // Try to extract JSON array
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const ingredients = JSON.parse(jsonMatch[0]);
        
        // Validate ingredients format
        if (Array.isArray(ingredients) && ingredients.length > 0) {
          // Ensure all ingredients have the required properties
          const validIngredients = ingredients.filter(ing => 
            ing.name && ing.amount && ing.unit
          );
          
          if (validIngredients.length > 0) {
            console.log(`Generated ${validIngredients.length} ingredients for "${recipeName}"`);
            return res.json({
              success: true,
              ingredients: validIngredients,
              source: "ai-generated"
            });
          }
        }
      }
      
      // If JSON parsing fails, try extracting ingredients manually
      console.log("JSON parsing failed, trying text extraction");
      const extractedIngredients = extractIngredientsFromText(text);
      return res.json({
        success: true,
        ingredients: extractedIngredients,
        source: "ai-extracted"
      });
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fall back to basic ingredients
      return res.json({
        success: true,
        ingredients: getBasicCookingIngredients(),
        source: "fallback-basic"
      });
    }
  } catch (error) {
    console.error("Error generating ingredients with AI:", error);
    // Fall back to basic ingredients
    return res.json({
      success: true,
      ingredients: getBasicCookingIngredients(),
      source: "error-fallback"
    });
  }
}

// Extract ingredients from unstructured text
function extractIngredientsFromText(text) {
  const ingredients = [];
  const lines = text.split('\n');
  
  // Common measurement units
  const units = ['cups', 'cup', 'tbsp', 'tsp', 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'lbs', 'pieces', 'piece', 'pinch', 'dash'];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip empty lines or lines that don't look like ingredients
    if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) continue;
    
    // Try to extract quantity, unit and ingredient name
    const quantityMatch = trimmedLine.match(/^([\d./]+|\ba\b|\ban\b)/i);
    if (quantityMatch) {
      let amount = quantityMatch[0];
      let remaining = trimmedLine.slice(quantityMatch[0].length).trim();
      
      // Find the unit
      let unit = 'pieces';
      for (const possibleUnit of units) {
        if (remaining.toLowerCase().startsWith(possibleUnit.toLowerCase())) {
          unit = possibleUnit.toLowerCase();
          remaining = remaining.slice(possibleUnit.length).trim();
          break;
        }
      }
      
      // Clean up the remaining text to get ingredient name
      const name = remaining.replace(/^(of|-)/, '').trim();
      
      if (name) {
        ingredients.push({ name, amount, unit });
      }
    }
  }
  
  // If we couldn't extract anything, provide minimal ingredients
  if (ingredients.length === 0) {
    return getBasicCookingIngredients();
  }
  
  return ingredients;
}

// Function for basic cooking ingredients - no recipe-specific hardcoding
function getBasicCookingIngredients() {
  return [
    { name: "Main Ingredient", amount: "500", unit: "g" },
    { name: "Salt", amount: "1", unit: "tsp" },
    { name: "Pepper", amount: "1/2", unit: "tsp" },
    { name: "Garlic", amount: "3", unit: "pieces" },
    { name: "Onion", amount: "1", unit: "piece" },
    { name: "Vegetable oil", amount: "2", unit: "tbsp" }
  ];
}

// Add this route to handle ingredient suggestions
router.post("/suggest-ingredients", async (req, res) => {
  try {
    console.log("Ingredient suggestion request received for:", req.body.recipeName);
    const { recipeName, description } = req.body;
    
    if (!recipeName) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name is required" 
      });
    }
    
    // Use AI to generate appropriate ingredients
    return await generateIngredientsWithAI(recipeName, description, res);
    
  } catch (error) {
    console.error("Error in suggest-ingredients:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating ingredients",
      error: error.message
    });
  }
});

// Add this route after the suggest-ingredients route
router.post("/suggest-steps", async (req, res) => {
  try {
    console.log("Step suggestion request received for:", req.body.recipeName);
    const { recipeName, ingredients, category, description } = req.body;
    
    if (!recipeName) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipe name is required" 
      });
    }
    
    // Use AI to generate appropriate steps
    return await generateStepsWithAI(recipeName, ingredients, category, description, res);
    
  } catch (error) {
    console.error("Error in suggest-steps:", error);
    return res.status(500).json({
      success: false,
      message: "Error generating preparation steps",
      error: error.message
    });
  }
});

// Add this function for step generation with AI
async function generateStepsWithAI(recipeName, ingredients, category, description = "", res) {
  try {
    console.log(`Generating AI steps for recipe: ${recipeName}`);
    
    // Check if Gemini AI is available
    if (!genAI) {
      console.log("Gemini AI not available, using minimal steps");
      return res.json({
        success: true,
        steps: getBasicCookingSteps(recipeName),
        source: "system-minimal"
      });
    }
    
    // Format ingredients for better prompt context
    const formattedIngredients = Array.isArray(ingredients) 
      ? ingredients.join(", ") 
      : ingredients;
    
    // Create a prompt for the AI with stronger instructions
    const prompt = `
    You are a professional chef creating detailed cooking instructions for "${recipeName}".
    
    Recipe Category: ${category || "Main Course"}
    Recipe Description: ${description || ""}
    Available Ingredients: ${formattedIngredients}

    IMPORTANT: Create 5-8 clear, practical cooking steps that:
    1. Specifically use the ingredients mentioned above
    2. Follow proper cooking techniques for this type of dish
    3. Result in an authentic version of ${recipeName}
    
    Return ONLY a JSON array of step objects with this exact structure:
    [
      {"instruction": "Brief step title", "details": "Detailed explanation of this step"},
      {"instruction": "Next step title", "details": "Detailed explanation of this step"}
    ]
    
    Make each step specific to this recipe, not generic cooking instructions.
    Double check that your steps match the proper preparation method for ${recipeName}.
    `;
    
    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more focused/accurate responses
        topP: 0.8,
        topK: 40
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Raw AI steps response:", text);
    
    // Parse the JSON from the response
    try {
      // Try to extract JSON array
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const steps = JSON.parse(jsonMatch[0]);
        
        // Validate steps format
        if (Array.isArray(steps) && steps.length > 0) {
          // Ensure all steps have the required properties
          const validSteps = steps.filter(step => 
            step.instruction && step.details
          );
          
          if (validSteps.length > 0) {
            console.log(`Generated ${validSteps.length} steps for "${recipeName}"`);
            return res.json({
              success: true,
              steps: validSteps,
              source: "ai-generated"
            });
          }
        }
      }
      
      // If JSON parsing fails, try extracting steps manually
      console.log("JSON parsing failed, trying text extraction");
      const extractedSteps = extractStepsFromText(text, recipeName);
      return res.json({
        success: true,
        steps: extractedSteps,
        source: "ai-extracted"
      });
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      // Fall back to basic steps
      return res.json({
        success: true,
        steps: getBasicCookingSteps(recipeName),
        source: "fallback-basic"
      });
    }
  } catch (error) {
    console.error("Error generating steps with AI:", error);
    // Fall back to basic steps
    return res.json({
      success: true,
      steps: getBasicCookingSteps(recipeName),
      source: "error-fallback"
    });
  }
}

// Extract steps from unstructured text
function extractStepsFromText(text, recipeName) {
  const steps = [];
  const lines = text.split('\n');
  
  let currentInstruction = "";
  let currentDetails = "";
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Check if this line looks like a new step (has a number or step keyword)
    if (/^(\d+\.|\[\d+\]|Step \d+:|Step:|Instruction:|First:|Next:)/i.test(trimmedLine)) {
      // If we have an existing instruction, save it
      if (currentInstruction) {
        steps.push({
          instruction: currentInstruction,
          details: currentDetails || `Complete this step for ${recipeName}`
        });
      }
      
      // Start a new instruction
      currentInstruction = trimmedLine.replace(/^(\d+\.|\[\d+\]|Step \d+:|Step:|Instruction:|First:|Next:)\s*/i, "");
      currentDetails = "";
    } else if (currentInstruction) {
      // Add to existing details
      if (currentDetails) currentDetails += " ";
      currentDetails += trimmedLine;
    } else {
      // If no instruction yet, this might be the first one
      currentInstruction = trimmedLine;
    }
  }
  
  // Add the last step if exists
  if (currentInstruction) {
    steps.push({
      instruction: currentInstruction,
      details: currentDetails || `Complete this step for ${recipeName}`
    });
  }
  
  // If we couldn't extract steps properly, generate basic steps
  if (steps.length === 0) {
    return getBasicCookingSteps(recipeName);
  }
  
  return steps;
}

// Basic cooking steps as fallback
function getBasicCookingSteps(recipeName) {
  return [
    {
      instruction: "Prepare ingredients",
      details: `Gather and measure all ingredients for ${recipeName}. Wash, peel, and chop vegetables as needed.`
    },
    {
      instruction: "Heat cooking vessel",
      details: "Place a pot or pan over medium heat. Add oil or butter if the recipe requires it."
    },
    {
      instruction: "Cook main ingredients",
      details: "Add the main ingredients and cook according to their requirements."
    },
    {
      instruction: "Add seasonings",
      details: "Add salt, pepper, and other seasonings to taste. Stir well to combine."
    },
    {
      instruction: "Simmer if needed",
      details: "Cover and reduce heat if needed. Cook until all ingredients are tender and flavors are well combined."
    },
    {
      instruction: "Serve",
      details: `Serve your ${recipeName} hot. Garnish if desired.`
    }
  ];
}

// Add this line at the end of the file
export default router;