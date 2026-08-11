import { v2 as cloudinary } from 'cloudinary';
// @ts-ignore - No types available for multer-storage-cloudinary
import CloudinaryStorage from 'multer-storage-cloudinary';
import multer from 'multer';

// multer-storage-cloudinary@2 expects an object with shape { v2: cloudinaryClient }
const cloudinaryForStorage = { v2: cloudinary };

// Validate Cloudinary credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  WARNING: Cloudinary credentials are not set in environment variables!');
  console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage configuration for avatars
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinaryForStorage,
  folder: 'mentorstack/avatars',
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  transformation: [
    { width: 500, height: 500, crop: 'fill', gravity: 'face' },
    { quality: 'auto' }
  ],
  filename: (_req: any, _file: any, cb: any) => cb(undefined, `avatar_${Date.now()}_${Math.random().toString(36).substring(7)}`),
} as any);

// Storage configuration for article images
export const articleImageStorage = new CloudinaryStorage({
  cloudinary: cloudinaryForStorage,
  folder: 'mentorstack/articles',
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  transformation: [
    { width: 1200, height: 800, crop: 'limit' },
    { quality: 'auto', fetch_format: 'auto' }
  ],
  filename: (_req: any, _file: any, cb: any) => cb(undefined, `article_${Date.now()}_${Math.random().toString(36).substring(7)}`),
} as any);

// Storage configuration for community post images
export const postImageStorage = new CloudinaryStorage({
  cloudinary: cloudinaryForStorage,
  folder: 'mentorstack/posts',
  allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  transformation: [
    { width: 1200, height: 800, crop: 'limit' },
    { quality: 'auto', fetch_format: 'auto' }
  ],
  filename: (_req: any, _file: any, cb: any) => cb(undefined, `post_${Date.now()}_${Math.random().toString(36).substring(7)}`),
} as any);

// Create multer instances for different upload types
export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export const uploadArticleImages = multer({
  storage: articleImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadPostImages = multer({
  storage: postImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to extract public_id from Cloudinary URL
export const extractPublicId = (url: string): string | null => {
  try {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

// Helper function to get optimized image URL
export const getOptimizedUrl = (publicId: string, options: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
} = {}): string => {
  const {
    width = 800,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality, fetch_format: format }
    ]
  });
};

export { cloudinary };
