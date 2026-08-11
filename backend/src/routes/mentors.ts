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

// Get all mentors
router.get('/', async (req, res) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: Role.mentor },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        skills: true,
        location: true,
        reputation: true,
        jobTitle: true,
        department: true,
        createdAt: true
      }
    });
    res.json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mentor profile by ID
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const mentorId = parseInt(req.params.id);

    const mentor = await prisma.user.findFirst({
      where: { 
        id: mentorId,
        role: Role.mentor 
      },
      include: {
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        articles: {
          orderBy: { createdAt: 'desc' }
        },
        mentorConnections: {
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        mentorRequests: {
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' });
    }

    // Calculate stats
    const stats = {
      answersProvided: mentor.answers.length,
      articlesWritten: mentor.articles.length,
      menteesConnected: mentor.mentorConnections.length,
      mentorshipRequests: mentor.mentorRequests.length
    };

    res.json({
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      bio: mentor.bio,
      avatarUrl: mentor.avatarUrl,
      skills: mentor.skills,
      location: mentor.location,
      jobTitle: mentor.jobTitle,
      department: mentor.department,
      reputation: mentor.reputation,
      joinedDate: mentor.createdAt,
      answers: mentor.answers,
      articles: mentor.articles,
      connections: mentor.mentorConnections,
      mentorshipRequests: mentor.mentorRequests,
      stats
    });

  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current mentor profile (authenticated user)
router.get('/profile/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    const mentor = await prisma.user.findFirst({
      where: { 
        id: userId,
        role: Role.mentor 
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
        answers: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        articles: {
          orderBy: { createdAt: 'desc' }
        },
        mentorConnections: {
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        mentorRequests: {
          include: {
            mentee: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }

    // Calculate stats
    const stats = {
      answersProvided: mentor.answers.length,
      articlesWritten: mentor.articles.length,
      menteesConnected: mentor.mentorConnections.length,
      mentorshipRequests: mentor.mentorRequests.length
    };

    // Transform questions to include tags as string array
    const questionsWithTags = mentor.questions.map((question: any) => ({
      id: question.id,
      title: question.title,
      body: question.body,
      createdAt: question.createdAt,
      tags: question.tags.map((qt: any) => qt.tag.name)
    }));

    // Transform answers to include content (body field from schema)
    const answersWithContent = mentor.answers.map((answer: any) => ({
      id: answer.id,
      content: answer.body,
      createdAt: answer.createdAt,
      question: answer.question
    }));

    res.json({
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      bio: mentor.bio,
      avatarUrl: mentor.avatarUrl,
      skills: mentor.skills,
      location: mentor.location,
      jobTitle: mentor.jobTitle,
      department: mentor.department,
      reputation: mentor.reputation,
      joinedDate: mentor.createdAt,
      questions: questionsWithTags,
      answers: answersWithContent,
      articles: mentor.articles,
      connections: mentor.mentorConnections,
      mentorshipRequests: mentor.mentorRequests,
      stats
    });

  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update mentor profile
router.put('/profile/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    const { name, bio, skills, location } = req.body;

    const updatedMentor = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(location !== undefined && { location })
      }
    });

    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedMentor.id,
        name: updatedMentor.name,
        email: updatedMentor.email,
        bio: updatedMentor.bio,
        skills: updatedMentor.skills,
        location: updatedMentor.location
      }
    });

  } catch (error) {
    console.error('Error updating mentor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as mentorsRouter };
