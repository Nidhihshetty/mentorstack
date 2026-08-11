import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);

// Get all communities with pagination and search
router.get('/', async (req: any, res: any) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

  const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);
  const take = Number.parseInt(limit);

    // Build where clause
    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get communities with counts and creator info
    const [communities, totalCount] = await Promise.all([
      prisma.community.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          skills: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true
            }
          },
          _count: { select: { members: true, posts: true } }
        }
      }),
      prisma.community.count({ where: whereClause })
    ]);

    // Get additional stats for each community
    const communitiesWithStats = await Promise.all(
      communities.map(async (community) => {
        const [
          recentPosts,
          activeMembersCount
        ] = await Promise.all([
          prisma.communityPost.count({
            where: {
              communityId: community.id,
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          }),
          prisma.communityMember.count({
            where: {
              communityId: community.id,
              // Approximation of activity using joinedAt (no lastActiveAt in schema)
              joinedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          })
        ]);

        return {
          ...community,
          stats: {
            ...community._count,
            recentPosts,
            activeMembersCount,
            activityScore: recentPosts + (activeMembersCount * 2)
          }
        };
      })
    );

    res.json({
      communities: communitiesWithStats,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number.parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

// Get single community details
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const community = await prisma.community.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true
          }
        },
        members: {
          take: 10,
          orderBy: { joinedAt: 'desc' },
          select: {
            id: true,
            userRole: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                reputation: true
              }
            }
          }
        },
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            upvotes: true,
            downvotes: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true
              }
            },
            // no comments relation in schema; omit
          }
        },
        _count: { select: { members: true, posts: true } }
      }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Get additional analytics
    const [
      memberGrowth,
      postActivity,
      topContributors
    ] = await Promise.all([
      // Member growth over last 6 months
      Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const count = await prisma.communityMember.count({
            where: {
              communityId: community.id,
              joinedAt: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          });
          
          return {
            month: startOfMonth.toISOString().slice(0, 7),
            members: count
          };
        })
      ),
      
      // Post activity over last 30 days
      Promise.all(
        Array.from({ length: 30 }, async (_, i) => {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));

          const posts = await prisma.communityPost.count({
            where: {
              communityId: community.id,
              createdAt: { gte: startOfDay, lte: endOfDay }
            }
          });

          return {
            date: startOfDay.toISOString().split('T')[0],
            posts
          };
        })
      ),
      
      // Top contributors
      prisma.communityMember.findMany({
        where: { communityId: community.id },
        take: 5,
        orderBy: [
          { user: { reputation: 'desc' } },
          { joinedAt: 'asc' }
        ],
        select: {
          userRole: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              reputation: true,
              avatarUrl: true,
              _count: {
                select: {
                  communityPosts: true,
                  answers: true
                }
              }
            }
          }
        }
      })
    ]);

    res.json({
      ...community,
      analytics: {
        memberGrowth: memberGrowth.slice().reverse(),
        postActivity: postActivity.slice().reverse(),
        topContributors
      }
    });
  } catch (error) {
    console.error('Error fetching community details:', error);
    res.status(500).json({ error: 'Failed to fetch community details' });
  }
});

// Update community settings
router.patch('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
  const { name, description, skills } = req.body;

    const community = await prisma.community.update({
      where: { id: Number.parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(skills && { skills })
      },
      select: {
        id: true,
        name: true,
        description: true,
        skills: true
      }
    });

    // Log the change
    // adminLog not in schema; skipping log

    res.json({ message: 'Community updated successfully', community });
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ error: 'Failed to update community' });
  }
});

// Delete community
router.delete('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: Number.parseInt(id) },
      select: { id: true, name: true, createdBy: { select: { id: true } } }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Delete related records first (cascade)
    await prisma.$transaction(async (tx) => {
      // Delete community posts and their comments
      await tx.communityPost.deleteMany({
        where: { communityId: Number.parseInt(id) }
      });

      // Delete community members
      await tx.communityMember.deleteMany({
        where: { communityId: Number.parseInt(id) }
      });

      // Delete community messages
      // Delete community messages (use raw to avoid missing delegate in generated client)
      await tx.$executeRawUnsafe(
        'DELETE FROM "CommunityMessage" WHERE "communityId" = $1',
        Number.parseInt(id)
      );

      // Delete the community
      await tx.community.delete({
        where: { id: Number.parseInt(id) }
      });
    });

    // Log the deletion
    // adminLog not in schema; skipping log

    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ error: 'Failed to delete community' });
  }
});

// Get community members
router.get('/:id/members', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;

    const skip = (Number.parseInt(page as string) - 1) * Number.parseInt(limit as string);
    const take = Number.parseInt(limit as string);

    const whereClause: any = { communityId: Number.parseInt(id) };
    
    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [members, totalCount] = await Promise.all([
      prisma.communityMember.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { joinedAt: 'desc' },
        select: {
          id: true,
          userRole: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              reputation: true,
              avatarUrl: true,
              _count: {
                select: {
                  communityPosts: true,
                  questions: true,
                  answers: true
                }
              }
            }
          }
        }
      }),
      prisma.communityMember.count({ where: { communityId: Number.parseInt(id) } })
    ]);

    res.json({
      members,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number.parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching community members:', error);
    res.status(500).json({ error: 'Failed to fetch community members' });
  }
});

// Remove member from community
router.delete('/:id/members/:memberId', async (req: any, res: any) => {
  try {
    const { id, memberId } = req.params;

    const member = await prisma.communityMember.findFirst({
      where: {
        communityId: Number.parseInt(id),
        userId: Number.parseInt(memberId)
      },
      include: {
        user: { select: { name: true, email: true } },
        community: { select: { name: true } }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in community' });
    }

    await prisma.communityMember.delete({
      where: {
        id: member.id
      }
    });

    // Audit logging skipped (adminLog table not present)

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing community member:', error);
    res.status(500).json({ error: 'Failed to remove community member' });
  }
});

// Get community statistics
router.get('/stats/overview', async (req: any, res: any) => {
  try {
    const [
      totalCommunities,
      totalMembers,
      totalPosts,
      activeCommunities,
      newCommunitiesThisMonth,
      topCommunities
    ] = await Promise.all([
      prisma.community.count(),
      prisma.communityMember.count(),
      prisma.communityPost.count(),
      prisma.community.count({
        where: {
          posts: {
            some: {
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      }),
      prisma.community.count({
        where: {
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      prisma.community.findMany({
        take: 5,
        orderBy: {
          members: { _count: 'desc' }
        },
        select: {
          id: true,
          name: true,
          description: true,
          _count: {
            select: {
              members: true,
              posts: true
            }
          }
        }
      })
    ]);

    res.json({
      totalCommunities,
      totalMembers,
      totalPosts,
      activeCommunities,
      newCommunitiesThisMonth,
      averageMembersPerCommunity: totalCommunities > 0 ? 
        Math.round(totalMembers / totalCommunities) : 0,
      topCommunities
    });
  } catch (error) {
    console.error('Error fetching community statistics:', error);
    res.status(500).json({ error: 'Failed to fetch community statistics' });
  }
});

export default router;
