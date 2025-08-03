import cloudinary from './cloudinary.js';
import { User } from '../models/user.model.js';

export const validateAndCleanupImages = async () => {
    try {
        const users = await User.find({ profileImage: { $exists: true, $ne: null } });
        
        for (const user of users) {
            if (user.profileImage && user.profileImage.includes('cloudinary')) {
                try {
                    // Extract public ID from Cloudinary URL
                    const publicId = user.profileImage.split('/').pop().split('.')[0];
                    await cloudinary.api.resource(publicId);
                } catch (error) {
                    if (error.http_code === 404) {
                        console.log(`Removing broken image for user ${user.email}`);
                        user.profileImage = null;
                        await user.save();
                    }
                }
            }
        }
    } catch (error) {
        console.error('Image cleanup failed:', error);
    }
};