export const DEFAULT_PROFILE_IMAGE = "https://via.placeholder.com/150/cccccc/666666?text=User";

/**
 * Builds a proper Cloudinary URL for profile images
 * @param {string} imageUrl - The image URL from the database
 * @returns {string} - Full Cloudinary URL or default placeholder
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
 * @param {string} imageUrl - The image URL from the database
 * @returns {string} - Full Cloudinary URL or default placeholder
 */
export const buildRecipeImageUrl = (imageUrl) => {
    if (!imageUrl) {
        return "https://via.placeholder.com/400x300?text=No+Image";
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