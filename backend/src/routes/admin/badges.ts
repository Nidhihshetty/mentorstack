import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../middleware/adminAuth';
import multer from 'multer';
// @ts-ignore - No types available for multer-storage-cloudinary
import CloudinaryStorage from 'multer-storage-cloudinary';
import { cloudinary } from '../../lib/cloudinary';

const router = express.Router();

// Storage for badge icons
const badgeIconStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mentorstack/badges',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ width: 256, height: 256, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
    public_id: () => `badge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  } as any,
});
const uploadBadgeIcon = multer({ storage: badgeIconStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Upload icon
router.post('/upload-icon', requireAdmin, (req: any, res: any, next: any) => {
  uploadBadgeIcon.single('image')(req, res, (err: any) => {
    if (err) { res.status(400).json({ error: 'Upload failed', details: String(err?.message || err) }); return; }
    next();
  });
}, async (req: any, res: any) => {
  if (!req.file?.path) { res.status(400).json({ error: 'No image uploaded' }); return; }
  res.json({ imageUrl: req.file.path });
});

// List badges
router.get('/', requireAdmin, async (_req, res) => {
  const badges = await prisma.badge.findMany({ orderBy: { reputationThreshold: 'asc' } });
  const counts = await prisma.userBadge.groupBy({ by: ['badgeId'], _count: { badgeId: true } });
  const countMap = new Map(counts.map(c => [c.badgeId, c._count.badgeId]));
  res.json({ badges: badges.map(b => ({ ...b, awardedCount: countMap.get(b.id) || 0 })) });
});

// Create badge
router.post('/', requireAdmin, async (req: any, res: any) => {
  const { name, description, reputationThreshold, imageUrl, isActive } = req.body || {};
  if (!name || !description || typeof reputationThreshold !== 'number') {
    res.status(400).json({ error: 'name, description, reputationThreshold are required' });
    return;
  }
  const badge = await prisma.badge.create({ data: { name, description, reputationThreshold, imageUrl: imageUrl || null, isActive: isActive ?? true } });
  res.json({ message: 'Badge created', badge });
});

// Update badge
router.put('/:id', requireAdmin, async (req: any, res: any) => {
  const id = Number(req.params.id);
  const { name, description, reputationThreshold, imageUrl, isActive } = req.body || {};
  const badge = await prisma.badge.update({ where: { id }, data: { name, description, reputationThreshold, imageUrl, isActive } });
  res.json({ message: 'Badge updated', badge });
});

// Toggle active
router.patch('/:id/toggle', requireAdmin, async (req: any, res: any) => {
  const id = Number(req.params.id);
  const current = await prisma.badge.findUnique({ where: { id }, select: { isActive: true } });
  if (!current) { res.status(404).json({ error: 'Badge not found' }); return; }
  const badge = await prisma.badge.update({ where: { id }, data: { isActive: !current.isActive } });
  res.json({ message: 'Badge status updated', badge });
});

// Award a badge to a user
router.post('/:id/award', requireAdmin, async (req: any, res: any) => {
  const id = Number(req.params.id);
  const { userId } = req.body || {};
  if (!userId) { res.status(400).json({ error: 'userId is required' }); return; }
  try {
    const existing = await prisma.userBadge.findUnique({ where: { userId_badgeId: { userId, badgeId: id } } });
    if (existing) { res.status(409).json({ error: 'User already has this badge' }); return; }
    const created = await prisma.userBadge.create({ data: { userId, badgeId: id, isDisplayed: true } });
    res.json({ message: 'Badge awarded', userBadge: created });
  } catch (e) {
    console.error('Failed to award badge', e);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

export default router;
