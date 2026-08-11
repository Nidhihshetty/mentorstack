import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../middleware/adminAuth';

const router: any = express.Router();

// Get a user's reputation history (paginated)
router.get('/history', requireAdmin, async (req: any, res: any) => {
  const userId = Number(req.query.userId);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  if (!userId || Number.isNaN(userId)) { res.status(400).json({ error: 'userId is required' }); return; }

  const [items, total, user] = await Promise.all([
    prisma.reputationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reputationHistory.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, reputation: true } })
  ]);

  res.json({
    user,
    page,
    limit,
    total,
    items,
  });
});

// Admin adjust reputation
router.post('/adjust', requireAdmin, async (req: any, res: any) => {
  const { userId, points, reason, entityType, entityId } = req.body || {};
  if (!userId || typeof points !== 'number') {
    res.status(400).json({ error: 'userId and numeric points are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { id: true } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const updated = await prisma.$transaction(async (tx) => {
      const history = await tx.reputationHistory.create({
        data: {
          userId: Number(userId),
          points: Math.trunc(points),
          action: 'admin_adjustment',
          description: String(reason || '').slice(0, 300) || null,
          entityType: entityType ? String(entityType) : 'admin',
          entityId: entityId ? Number(entityId) : null,
        }
      });
      const user = await tx.user.update({
        where: { id: Number(userId) },
        data: { reputation: { increment: Math.trunc(points) } },
        select: { id: true, reputation: true }
      });
      return { history, user };
    });

    res.json({ message: 'Reputation adjusted', ...updated });
  } catch (e) {
    console.error('Failed to adjust reputation', e);
    res.status(500).json({ error: 'Failed to adjust reputation' });
  }
});

export default router;
