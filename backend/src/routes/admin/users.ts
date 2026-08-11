import express from 'express';
import { prisma } from '../../lib/prisma';
import { Role } from '@prisma/client';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// Apply admin authentication to all routes
router.use(requireAdmin);

// Get all users with filtering, pagination, and search
router.get('/', async (req: any, res: any) => {
  try {
    const { page = '1', limit = '100', role, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { skills: { hasSome: [search] } }
      ];
    }

    // Get users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          jobTitle: true,
          department: true,
          bio: true,
          skills: true,
          location: true,
          reputation: true,
          createdAt: true,
          _count: {
            select: {
              questions: true,
              answers: true,
              articles: true,
              mentorConnections: true,
              menteeConnections: true,
              communityPosts: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get users by role (mentors, mentees, admins)
router.get('/by-role/:role', async (req: any, res: any) => {
  try {
    const { role } = req.params;
    const { search } = req.query;

    // Validate role
    if (!['mentor', 'mentee', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const where: any = { role: role as Role };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { skills: { hasSome: [search] } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        bio: true,
        skills: true,
        location: true,
        reputation: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            answers: true,
            articles: true,
            mentorConnections: true,
            menteeConnections: true,
            communityPosts: true
          }
        }
      }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user details
router.get('/:id', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        bio: true,
        skills: true,
        location: true,
        reputation: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            answers: true,
            articles: true,
            mentorConnections: true,
            menteeConnections: true,
            communityPosts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user profile (admin can edit any user)
router.patch('/:id', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, email, jobTitle, department, bio, skills, location } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(location !== undefined && { location })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        bio: true,
        skills: true,
        location: true,
        reputation: true,
        createdAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user role
router.patch('/:id/role', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    // Validate role
    if (!['mentor', 'mentee', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        reputation: true
      }
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete/Deactivate user
router.delete('/:id', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user (this will cascade delete related records based on schema)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics
router.get('/:id/stats', async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        reputation: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get detailed statistics
    const [
      questionsCount,
      answersCount,
      articlesCount,
      communityPostsCount,
      mentorConnectionsCount,
      menteeConnectionsCount
    ] = await Promise.all([
      prisma.question.count({ where: { authorId: userId } }),
      prisma.answer.count({ where: { authorId: userId } }),
      prisma.article.count({ where: { authorId: userId } }),
      prisma.communityPost.count({ where: { authorId: userId } }),
      prisma.connection.count({ where: { mentor: { id: userId } } }),
      prisma.connection.count({ where: { mentee: { id: userId } } })
    ]);

    const stats = {
      user,
      content: {
        questions: questionsCount,
        answers: answersCount,
        articles: articlesCount,
        communityPosts: communityPostsCount
      },
      connections: {
        asMentor: mentorConnectionsCount,
        asMentee: menteeConnectionsCount,
        total: mentorConnectionsCount + menteeConnectionsCount
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export { router as adminUsersRouter };
