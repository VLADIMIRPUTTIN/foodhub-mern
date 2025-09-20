import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("Cloudinary configured with cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API key exists:", !!process.env.CLOUDINARY_API_KEY);

// Test the connection
cloudinary.api.ping((error, result) => {
    if (error) {
        console.error("Cloudinary connection error:", error);
    } else {
        console.log("Cloudinary connection successful:", result);
    }
});

// Add a function to check if image exists
export const checkImageExists = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    if (error.http_code === 404) {
      console.log(`Image ${publicId} not found in Cloudinary`);
      return null;
    }
    throw error;
  }
};

export default cloudinary;