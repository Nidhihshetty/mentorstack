import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

const router = express.Router();

// Middleware to verify JWT token
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

// Get all mentees
router.get('/', async (req, res) => {
  try {
    const mentees = await prisma.user.findMany({
      where: { role: Role.mentee },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
        reputation: true,
        jobTitle: true,
        department: true,
        createdAt: true
      }
    });
    res.json(mentees);
  } catch (error) {
    console.error('Error fetching mentees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mentee profile by ID
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const menteeId = parseInt(req.params.id);
    
    const mentee = await prisma.user.findFirst({
      where: { 
        id: menteeId,
        role: Role.mentee 
      },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' }
        },
        menteeRequests: true
      }
    });

    if (!mentee) {
      return res.status(404).json({ message: 'Mentee not found' });
    }

    // Calculate stats
    const stats = {
      questionsAsked: mentee.questions.length,
      mentorshipRequestsCount: mentee.menteeRequests.length
    };

    res.json({
      id: mentee.id,
      name: mentee.name,
      email: mentee.email,
      bio: mentee.bio,
      skills: mentee.skills,
      jobTitle: mentee.jobTitle,
      department: mentee.department,
      reputation: mentee.reputation,
      joinedDate: mentee.createdAt,
      questions: mentee.questions,
      stats
    });

  } catch (error) {
    console.error('Error fetching mentee profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current mentee profile (authenticated user)
router.get('/profile/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'mentee') {
      return res.status(403).json({ message: 'Access denied. Mentee role required.' });
    }

    const mentee = await prisma.user.findFirst({
      where: { 
        id: userId,
        role: Role.mentee 
      },
      include: {
        questions: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        communityPosts: {
          include: {
            community: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        articles: {
          orderBy: { createdAt: 'desc' }
        },
        menteeRequests: true
      }
    });

    if (!mentee) {
      return res.status(404).json({ message: 'Mentee profile not found' });
    }

    // Calculate stats
    // Get bookmarks count across question, article and community post bookmarks
    const [qbCount, abCount, cbCount] = await Promise.all([
      prisma.questionBookmark.count({ where: { userId: userId } }),
      prisma.articleBookmark.count({ where: { userId: userId } }),
      prisma.communityPostBookmark.count({ where: { userId: userId } }),
    ]);

    const stats = {
      questionsAsked: mentee.questions.length,
      bookmarksCount: qbCount + abCount + cbCount,
      mentorshipRequestsCount: mentee.menteeRequests.length
    };

    // Transform questions to include tags as string array
    const questionsWithTags = mentee.questions.map((question: any) => ({
      id: question.id,
      title: question.title,
      body: question.body,
      createdAt: question.createdAt,
      tags: question.tags.map((qt: any) => qt.tag.name)
    }));

    // Transform community posts
    const communityPosts = mentee.communityPosts.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      communityId: post.communityId,
      communityName: post.community.name,
      createdAt: post.createdAt,
      upvotes: post.upvotes,
      downvotes: post.downvotes
    }));

    // Transform answered questions
    const answeredQuestions = mentee.answers.map((answer: any) => ({
      id: answer.id,
      questionId: answer.questionId,
      questionTitle: answer.question.title,
      content: answer.body,
      createdAt: answer.createdAt,
      upvotes: answer.upvotes,
      downvotes: answer.downvotes
    }));

    // Transform articles
    const articles = mentee.articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      createdAt: article.createdAt,
      upvotes: article.upvotes,
      downvotes: article.downvotes
    }));

    res.json({
      id: mentee.id,
      name: mentee.name,
      email: mentee.email,
      bio: mentee.bio,
      avatarUrl: mentee.avatarUrl,
      skills: mentee.skills,
      jobTitle: mentee.jobTitle,
      department: mentee.department,
      reputation: mentee.reputation,
      joinedDate: mentee.createdAt,
      questions: questionsWithTags,
      communityPosts: communityPosts,
      answeredQuestions: answeredQuestions,
      articles: articles,
      stats
    });

  } catch (error) {
    console.error('Error fetching mentee profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mentee profile
router.put('/profile/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'mentee') {
      return res.status(403).json({ message: 'Access denied. Mentee role required.' });
    }

    const { name, bio, skills, jobTitle, department, avatarUrl, location } = req.body;

    const updatedMentee = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(location !== undefined && { location })
      }
    });

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedMentee.id,
        name: updatedMentee.name,
        email: updatedMentee.email,
        bio: updatedMentee.bio,
        skills: updatedMentee.skills,
        jobTitle: updatedMentee.jobTitle,
        department: updatedMentee.department,
        avatarUrl: updatedMentee.avatarUrl,
        location: updatedMentee.location
      }
    });

  } catch (error) {
    console.error('Error updating mentee profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as menteesRouter };
