export const DEFAULT_PROFILE_IMAGE = "https://placehold.co/150x150/cccccc/666666?text=User&font=roboto";
export const DEFAULT_RECIPE_IMAGE = "https://placehold.co/400x300/f5f5f5/999999?text=No+Image&font=roboto";

/**
 * Builds a proper Cloudinary URL for profile images
 */
export const buildProfileImageUrl = (imageUrl) => {
    if (!imageUrl) {
        return DEFAULT_PROFILE_IMAGE;
    }

    // If it's already a full URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // If it's a Cloudinary public ID, build the URL
    const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/duceirdeu/image/upload";
    
    // Handle different possible formats
    if (imageUrl.startsWith('v1') || imageUrl.startsWith('foodhub/')) {
        return `${CLOUDINARY_BASE_URL}/${imageUrl}`;
    }

    // Default case - assume it's a public ID
    return `${CLOUDINARY_BASE_URL}/v1/${imageUrl}`;
};

/**
 * Builds a proper Cloudinary URL for recipe images
 */
export const buildRecipeImageUrl = (imageUrl) => {
    if (!imageUrl) {
        return DEFAULT_RECIPE_IMAGE;
    }

    // ✅ If it's already a full HTTPS Cloudinary URL, return as-is
    if (imageUrl.startsWith('https://res.cloudinary.com/')) {
        return imageUrl;
    }

    // If it's any other full URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // ✅ If it's a relative path (old local images), return placeholder
    console.warn('⚠️ Detected non-Cloudinary image path:', imageUrl);
    return DEFAULT_RECIPE_IMAGE;
};