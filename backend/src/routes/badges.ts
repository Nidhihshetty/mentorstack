import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Auth middleware (copy pattern used across routes)
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// GET /api/badges/available - Get all available badges with user's earned status
router.get('/available', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;

    // Get user's reputation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputation: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all active badges
    const allBadges = await prisma.badge.findMany({
      where: { isActive: true },
      orderBy: { reputationThreshold: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        reputationThreshold: true,
      }
    });

    // Get user's earned badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: {
        badgeId: true,
        awardedAt: true,
        isDisplayed: true,
      }
    });

    // Create a map of earned badges for quick lookup
    const earnedBadgesMap = new Map(
      userBadges.map(ub => [ub.badgeId, { awardedAt: ub.awardedAt, isDisplayed: ub.isDisplayed }])
    );

    // Add earned status and eligibility to each badge
    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      category: null, // Placeholder for future category feature
      isEarned: earnedBadgesMap.has(badge.id),
      isEligible: user.reputation >= badge.reputationThreshold,
      awardedAt: earnedBadgesMap.get(badge.id)?.awardedAt || null,
      isDisplayed: earnedBadgesMap.get(badge.id)?.isDisplayed || false,
      progressPercent: Math.min(100, Math.round((user.reputation / badge.reputationThreshold) * 100)),
    }));

    return res.json({
      currentReputation: user.reputation,
      badges: badgesWithStatus,
      earnedCount: userBadges.length,
      totalCount: allBadges.length,
    });
  } catch (error) {
    console.error('Error fetching available badges:', error);
    return res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// GET /api/badges/earned - Get only user's earned badges
router.get('/earned', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;

    const earnedBadges = await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
      include: {
        badge: true
      }
    });

    return res.json({
      badges: earnedBadges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        imageUrl: ub.badge.imageUrl,
        category: null, // Placeholder for future category feature
        reputationThreshold: ub.badge.reputationThreshold,
        awardedAt: ub.awardedAt,
        isDisplayed: ub.isDisplayed,
      })),
      count: earnedBadges.length,
    });
  } catch (error) {
    console.error('Error fetching earned badges:', error);
    return res.status(500).json({ error: 'Failed to fetch earned badges' });
  }
});

// POST /api/badges/:badgeId/toggle-display - Toggle badge display on profile
router.post('/:badgeId/toggle-display', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const badgeId = parseInt(req.params.badgeId);

    // Find the user badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        }
      }
    });

    if (!userBadge) {
      return res.status(404).json({ error: 'Badge not earned by user' });
    }

    // Toggle display status
    const updated = await prisma.userBadge.update({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        }
      },
      data: {
        isDisplayed: !userBadge.isDisplayed,
      }
    });

    return res.json({
      success: true,
      isDisplayed: updated.isDisplayed,
    });
  } catch (error) {
    console.error('Error toggling badge display:', error);
    return res.status(500).json({ error: 'Failed to toggle badge display' });
  }
});

// POST /api/badges/check-and-award - Check and award eligible badges to user
router.post('/check-and-award', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;

    // Get user's current reputation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputation: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all eligible badges user should have
    const eligibleBadges = await prisma.badge.findMany({
      where: {
        isActive: true,
        reputationThreshold: { lte: user.reputation }
      }
    });

    // Get badges user already has
    const existingUserBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true }
    });

    const existingBadgeIds = new Set(existingUserBadges.map(ub => ub.badgeId));

    // Award new badges
    const newBadges = eligibleBadges.filter(badge => !existingBadgeIds.has(badge.id));
    const awardedBadges = [];

    for (const badge of newBadges) {
      const awarded = await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          isDisplayed: true, // Display by default
        },
        include: {
          badge: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              reputationThreshold: true,
            }
          }
        }
      });
      awardedBadges.push(awarded);
    }

    return res.json({
      newBadgesAwarded: awardedBadges.length,
      badges: awardedBadges.map(ab => ({
        id: ab.badge.id,
        name: ab.badge.name,
        description: ab.badge.description,
        imageUrl: ab.badge.imageUrl,
        reputationThreshold: ab.badge.reputationThreshold,
      })),
    });
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    return res.status(500).json({ error: 'Failed to check and award badges' });
  }
});

export { router as badgesRouter };
