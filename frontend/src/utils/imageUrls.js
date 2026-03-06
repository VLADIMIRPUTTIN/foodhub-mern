export const DEFAULT_PROFILE_IMAGE = "https://ui-avatars.com/api/?name=User&background=CF996C&color=fff&size=128";
export const DEFAULT_RECIPE_IMAGE = "https://placehold.co/400x300/f5f5f5/999999?text=No+Image&font=roboto";

/**
 * Builds a proper Cloudinary URL for profile images
 */
export const buildProfileImageUrl = (profileImage) => {
    if (!profileImage) return DEFAULT_PROFILE_IMAGE;
    
    // ✅ Already a full external URL (Google profile pics, etc.)
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
        return profileImage;
    }
    
    // ✅ Cloudinary URLs
    if (profileImage.includes('cloudinary.com')) {
        return profileImage;
    }
    
    // ✅ Relative paths - add baseURL
    const baseURL = import.meta.env.MODE === "development" 
        ? "http://localhost:5000" 
        : "";
    
    return `${baseURL}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`;
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