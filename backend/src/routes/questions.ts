import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { awardReputation } from '../lib/reputation';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

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

// Get all questions
router.get('/', async (req: any, res: any) => {
  try {
    const questions = await prisma.question.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            avatarUrl: true
          }
        },
        answers: true,
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedQuestions = questions.map((question: any) => ({
      id: question.id,
      title: question.title,
      description: question.body,
      tags: question.tags.map((qt: any) => qt.tag.name),
      createdAt: question.createdAt,
      authorName: question.author.name,
      authorRole: question.author.role,
      answerCount: question.answers.length,
      voteScore: 0
    }));

    res.json(formattedQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get question by ID
router.get('/:id', async (req: any, res: any) => {
  try {
  const questionId = Number.parseInt(req.params.id, 10);
    
    // Check for optional auth token to include user vote
    let currentUserId: number | null = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        currentUserId = decoded.userId;
      } catch (err) {
        console.warn('Optional token verification failed in GET /questions/:id', err);
      }
    }
    
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true
          }
        },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                avatarUrl: true
              }
            },
            AnswerVote: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const formattedQuestion = {
      id: question.id,
      title: question.title,
      description: question.body,
      tags: question.tags.map((qt: any) => qt.tag.name),
      createdAt: question.createdAt,
      authorId: question.author.id,
      authorName: question.author.name,
      authorRole: question.author.role,
      voteScore: 0,
      answers: question.answers.map((answer: any) => {
        const upvotes = answer.AnswerVote.filter((v: any) => v.voteType === 'upvote').length;
        const downvotes = answer.AnswerVote.filter((v: any) => v.voteType === 'downvote').length;
        
        // Determine current user's vote if available
        let userVote: 'upvote' | 'downvote' | null = null;
        if (currentUserId) {
          const userVoteRecord = answer.AnswerVote.find((v: any) => v.voterId === currentUserId);
          userVote = userVoteRecord ? (userVoteRecord.voteType as 'upvote' | 'downvote') : null;
        }
        
        return {
          id: answer.id,
          content: answer.body,
          createdAt: answer.createdAt,
          authorId: answer.author.id,
          authorName: answer.author.name,
          authorRole: answer.author.role,
          upvotes,
          downvotes,
          voteScore: upvotes - downvotes,
          userVote
        };
      })
    };

    res.json(formattedQuestion);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new question
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { title, body, tags } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    console.log('📝 Creating question:', { title, body, tags, userId, userRole });

    // Validation
    if (!title || title.trim().length < 10) {
      return res.status(400).json({ message: 'Title must be at least 10 characters long' });
    }

    if (!body || body.trim().length < 20) {
      return res.status(400).json({ message: 'Question body must be at least 20 characters long' });
    }

    // Create the question
    const question = await prisma.question.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        authorId: userId,
        authorRole: userRole as Role,
      },
      include: {
        author: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });

    // Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const trimmedTagName = tagName.trim().toLowerCase();
          
          // Find or create the tag
          let tag = await prisma.tag.findUnique({
            where: { name: trimmedTagName }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: trimmedTagName }
            });
          }

          // Create the question-tag relationship
          await prisma.questionTag.create({
            data: {
              questionId: question.id,
              tagId: tag.id
            }
          });
        }
      }
    }

    // Award reputation for asking a question
    try {
      await awardReputation(prisma as any, { userId, action: 'question_asked', entityType: 'question', entityId: question.id });
    } catch (e) {
      // Non-fatal: log and proceed
      console.warn('Reputation award failed (question_asked):', e);
    }

    // Fetch the complete question with tags
    const completeQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        author: {
          select: {
            name: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const response = {
      message: 'Question created successfully',
      question: {
        id: completeQuestion!.id,
        title: completeQuestion!.title,
        description: completeQuestion!.body,
        tags: completeQuestion!.tags.map(qt => qt.tag.name),
        createdAt: completeQuestion!.createdAt,
        authorName: completeQuestion!.author.name
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('❌ Error creating question:', error);
    res.status(500).json({ 
      message: 'Server error', 
      details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Create answer for a question
router.post('/:questionId/answers', authenticateToken, async (req: any, res: any) => {
  try {
    const questionId = Number.parseInt(req.params.questionId, 10);
    const { content } = req.body;
    const userId = req.user.userId; // Fixed: use userId from token
    const userRole = req.user.role;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Answer content is required' });
    }

    if (content.trim().length < 20) {
      return res.status(400).json({ error: 'Answer must be at least 20 characters long' });
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Create the answer using Prisma
    const answer = await prisma.answer.create({
      data: {
        body: content.trim(),
        questionId,
        authorId: userId,
        authorRole: userRole as Role
      },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    });

    const responseAnswer = {
      id: answer.id,
      content: answer.body,
      authorName: answer.author.name,
      authorRole: answer.author.role,
      createdAt: answer.createdAt,
      upvotes: 0,
      downvotes: 0,
      voteScore: 0
    };

    // Award reputation for posting an answer
    try {
      await awardReputation(prisma as any, { userId, action: 'answer_posted', entityType: 'answer', entityId: answer.id });
    } catch (e) {
      console.warn('Reputation award failed (answer_posted):', e);
    }

    res.status(201).json({ 
      message: 'Answer created successfully',
      answer: responseAnswer
    });
  } catch (error: any) {
    console.error('Error creating answer:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Vote on an answer
router.post('/:questionId/answers/:answerId/vote', authenticateToken, async (req: any, res: any) => {
  try {
    const questionId = Number.parseInt(req.params.questionId, 10);
    const answerId = Number.parseInt(req.params.answerId, 10);
    const { voteType } = req.body;
    const userId = req.user.userId;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type. Must be "upvote" or "downvote"' });
    }

    // Check if answer exists and belongs to the question
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        questionId: questionId
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user has already voted
    const existingVote = await prisma.answerVote.findUnique({
      where: {
        voterId_answerId: {
          voterId: userId,
          answerId: answerId
        }
      }
    });

    if (existingVote) {
      // If clicking the same vote type, remove the vote (toggle off)
      if (existingVote.voteType === voteType) {
        await prisma.answerVote.delete({
          where: { id: existingVote.id }
        });
        // Reverse prior impact
        const delta = existingVote.voteType === 'upvote' ? -5 : 2;
        try {
          await awardReputation(prisma as any, { userId: answer.authorId, action: existingVote.voteType === 'upvote' ? 'answer_upvoted' : 'answer_downvoted', overridePoints: delta, entityType: 'answer', entityId: answerId, bypassCap: true, customDescription: 'Vote removed' });
        } catch (e) {
          console.warn('Reputation reverse failed (vote toggle off):', e);
        }
        return res.json({ message: 'Vote removed successfully' });
      } else {
        // Otherwise update the vote to the new type
        await prisma.answerVote.update({
          where: { id: existingVote.id },
          data: { voteType }
        });
        // Apply switch delta: up->down = -7, down->up = +7
        const delta = existingVote.voteType === 'upvote' ? -7 : 7;
        try {
          await awardReputation(prisma as any, { userId: answer.authorId, action: voteType === 'upvote' ? 'answer_upvoted' : 'answer_downvoted', overridePoints: delta, entityType: 'answer', entityId: answerId, bypassCap: true, customDescription: 'Vote switched' });
        } catch (e) {
          console.warn('Reputation switch failed (vote updated):', e);
        }
        return res.json({ message: 'Vote updated successfully' });
      }
    }

    // Create new vote
    await prisma.answerVote.create({
      data: {
        voterId: userId,
        answerId: answerId,
        voteType
      }
    });
    // New vote delta
    const delta = voteType === 'upvote' ? 5 : -2;
    try {
      await awardReputation(prisma as any, { userId: answer.authorId, action: voteType === 'upvote' ? 'answer_upvoted' : 'answer_downvoted', overridePoints: delta, entityType: 'answer', entityId: answerId });
    } catch (e) {
      console.warn('Reputation award failed (new vote):', e);
    }

    res.json({ message: 'Vote recorded successfully' });

  } catch (error: any) {
    console.error('Error voting on answer:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a question (only by author)
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
  const questionId = Number.parseInt(req.params.id, 10);
    const { title, body, tags } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!title || title.trim().length < 10) {
      return res.status(400).json({ message: 'Title must be at least 10 characters long' });
    }

    if (!body || body.trim().length < 20) {
      return res.status(400).json({ message: 'Question body must be at least 20 characters long' });
    }

    // Check if question exists and user is the author
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.authorId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own questions' });
    }

    // Update the question
    await prisma.question.update({
      where: { id: questionId },
      data: {
        title: title.trim(),
        body: body.trim()
      }
    });

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Remove existing tags
      await prisma.questionTag.deleteMany({
        where: { questionId }
      });

      // Add new tags
      for (const tagName of tags) {
        if (typeof tagName === 'string' && tagName.trim()) {
          const trimmedTagName = tagName.trim().toLowerCase();
          
          const tag = await prisma.tag.findUnique({ where: { name: trimmedTagName } })
            ?? await prisma.tag.create({ data: { name: trimmedTagName } });
          await prisma.questionTag.create({ data: { questionId, tagId: tag.id } });
        }
      }
    }

    // Fetch the complete updated question
    const completeQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        author: {
          select: {
            name: true,
            role: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Question updated successfully',
      question: {
        id: completeQuestion!.id,
        title: completeQuestion!.title,
        description: completeQuestion!.body,
        tags: completeQuestion!.tags.map(qt => qt.tag.name),
        updatedAt: completeQuestion!.updatedAt,
        authorName: completeQuestion!.author.name
      }
    });

  } catch (error: any) {
    console.error('Error updating question:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a question (only by author)
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
  const questionId = Number.parseInt(req.params.id, 10);
    const userId = req.user.userId;

    // Check if question exists and user is the author
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own questions' });
    }

    // Delete the question (cascade will handle related records)
    await prisma.question.delete({
      where: { id: questionId }
    });

    res.json({ message: 'Question deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting question:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update an answer (only by author)
router.put('/:questionId/answers/:answerId', authenticateToken, async (req: any, res: any) => {
  try {
  const questionId = Number.parseInt(req.params.questionId, 10);
  const answerId = Number.parseInt(req.params.answerId, 10);
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ message: 'Answer must be at least 20 characters long' });
    }

    // Check if answer exists and belongs to the question
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        questionId: questionId
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.authorId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own answers' });
    }

    // Update the answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        body: content.trim()
      },
      include: {
        author: {
          select: {
            name: true,
            role: true,
            avatarUrl: true
          }
        },
        AnswerVote: true
      }
    });

    const upvotes = updatedAnswer.AnswerVote.filter((v: any) => v.voteType === 'upvote').length;
    const downvotes = updatedAnswer.AnswerVote.filter((v: any) => v.voteType === 'downvote').length;

    res.json({
      message: 'Answer updated successfully',
      answer: {
        id: updatedAnswer.id,
        content: updatedAnswer.body,
        authorName: updatedAnswer.author.name,
        authorRole: updatedAnswer.author.role,
        updatedAt: updatedAnswer.updatedAt,
        upvotes,
        downvotes,
        voteScore: upvotes - downvotes
      }
    });

  } catch (error: any) {
    console.error('Error updating answer:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete an answer (only by author)
router.delete('/:questionId/answers/:answerId', authenticateToken, async (req: any, res: any) => {
  try {
  const questionId = Number.parseInt(req.params.questionId, 10);
  const answerId = Number.parseInt(req.params.answerId, 10);
    const userId = req.user.userId;

    // Check if answer exists and belongs to the question
    const answer = await prisma.answer.findFirst({
      where: {
        id: answerId,
        questionId: questionId
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    if (answer.authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own answers' });
    }

    // Delete the answer (cascade will handle votes)
    await prisma.answer.delete({
      where: { id: answerId }
    });

    res.json({ message: 'Answer deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting answer:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export { router as questionsRouter };
