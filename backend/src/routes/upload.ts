import express from 'express';
import { uploadAvatar, deleteImage, extractPublicId } from '../lib/cloudinary';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

// Upload avatar
router.post('/avatar', authenticateToken, (req: any, res: any, next: any) => {
  console.log('=== Avatar Upload Request ===');
  console.log('User from token:', req.user);
  console.log('Headers:', req.headers);
  
  uploadAvatar.single('avatar')(req, res, (err: any) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error', 
        details: err.message 
      });
    }
    console.log('Multer processed file successfully');
    next();
  });
}, async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    console.log('Upload request received for user:', userId);
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get the Cloudinary URL
    const avatarUrl = req.file.path;
    console.log('Cloudinary URL:', avatarUrl);

    // Get user's old avatar to delete it
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    // Update user's avatar URL
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });

    console.log('Avatar updated successfully for user:', userId);

    // Delete old avatar from Cloudinary if it exists
    if (user?.avatarUrl) {
      const oldPublicId = extractPublicId(user.avatarUrl);
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId);
          console.log('Old avatar deleted:', oldPublicId);
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Continue even if deletion fails
        }
      }
    }

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ 
      error: 'Failed to upload avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete avatar
router.delete('/avatar', authenticateToken, async (req: any, res: any) => {
  try {
    const { userId } = req.user;

    // Get user's current avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    if (!user?.avatarUrl) {
      return res.status(404).json({ error: 'No avatar to delete' });
    }

    // Extract public ID and delete from Cloudinary
    const publicId = extractPublicId(user.avatarUrl);
    if (publicId) {
      await deleteImage(publicId);
    }

    // Remove avatar URL from database
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null }
    });

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

export default router;
