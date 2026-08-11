import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { awardReputation } from '../lib/reputation';
import { Role } from '@prisma/client';
import { articleImageStorage, deleteImage, extractPublicId } from '../lib/cloudinary';

const router = express.Router();

// Configure multer to use Cloudinary storage for article images
const upload = multer({ storage: articleImageStorage });

const uploadArticleImages = (req: any, res: any, next: any) => {
  upload.array('images', 5)(req, res, (err: any) => {
    if (err) {
      console.error('Article image upload error:', err);
      return res.status(400).json({
        message: 'Image upload failed',
        details: err.message || 'Invalid image upload request',
      });
    }
    next();
  });
};

const getUploadedImageUrl = (file: any): string | null => {
  return file?.path || file?.secure_url || file?.url || null;
};

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

// Get all articles with proper category filtering
router.get('/', async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    // Filter by category/tag if provided
    if (category && category !== 'all') {
      whereClause.tags = {
        some: {
          tag: {
            name: {
              contains: category.toLowerCase(),
              mode: 'insensitive'
            }
          }
        }
      };
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            avatarUrl: true
          }
        },
        votes: true,
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const formattedArticles = articles.map(article => {
      const upvotes = article.votes.filter(vote => vote.voteType === 'upvote').length;
      const downvotes = article.votes.filter(vote => vote.voteType === 'downvote').length;
      
      return {
        id: article.id,
        title: article.title,
        content: article.content,
        imageUrls: article.imageUrls,
        authorId: article.authorId,
        authorName: article.author.name,
        authorBio: article.author.bio,
        authorAvatar: article.author.avatarUrl,
        upvotes,
        downvotes,
        tags: article.tags.map(at => at.tag.name),
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      };
    });

    // Get total count for pagination
    const totalArticles = await prisma.article.count({ where: whereClause });
    const totalPages = Math.ceil(totalArticles / limit);

    res.json({
      articles: formattedArticles,
      pagination: {
        currentPage: page,
        totalPages,
        totalArticles,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular tags/categories - MUST come before /:id route
router.get('/tags/popular', async (req: any, res: any) => {
  try {
    // Get actual tags from the database with article counts
    const tagsWithCounts = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      },
      orderBy: {
        articles: {
          _count: 'desc'
        }
      },
      take: 20 // Top 20 tags
    });

    const colors = [
      'bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-yellow-100',
      'bg-pink-100', 'bg-indigo-100', 'bg-gray-100', 'bg-red-100',
      'bg-teal-100', 'bg-orange-100'
    ];

    const popularTags = tagsWithCounts
      .filter(tag => tag._count.articles > 0) // Only tags with articles
      .map((tag, index) => ({
        name: tag.name,
        count: tag._count.articles,
        color: colors[index % colors.length]
      }));

    res.json(popularTags);
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get article by ID
router.get('/:id', async (req: any, res: any) => {
  try {
    const articleId = parseInt(req.params.id);
    // Check for optional auth token to include user vote
    let currentUserId: number | null = null;
    let currentUserRole: string | null = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
        currentUserId = decoded.userId;
        currentUserRole = decoded.role;
      } catch (err) {
        // ignore invalid token and continue without user vote
      }
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            avatarUrl: true
          }
        },
        votes: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const upvotes = article.votes.filter(vote => vote.voteType === 'upvote').length;
    const downvotes = article.votes.filter(vote => vote.voteType === 'downvote').length;

    // Determine current user's vote if available (any user can vote on articles)
    let userVote: 'upvote' | 'downvote' | null = null;
    if (currentUserId) {
      const userVoteRecord = article.votes.find(v => v.voterId === currentUserId);
      userVote = userVoteRecord ? (userVoteRecord.voteType as 'upvote' | 'downvote') : null;
    }

    const formattedArticle = {
      id: article.id,
      title: article.title,
      content: article.content,
      imageUrls: article.imageUrls,
      authorId: article.authorId,
      authorName: article.author.name,
      authorBio: article.author.bio,
      authorAvatar: article.author.avatarUrl,
      upvotes,
      downvotes,
      userVote,
      tags: article.tags.map(at => at.tag.name),
      createdAt: article.createdAt,
      updatedAt: article.updatedAt
    };

    res.json(formattedArticle);
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new article (all authenticated users can create)
router.post('/', authenticateToken, uploadArticleImages, async (req: any, res: any) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Handle uploaded images from Cloudinary
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = getUploadedImageUrl(file);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }

    // Parse tags if they're provided as a JSON string
    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        console.error('Error parsing tags:', error);
        parsedTags = [];
      }
    }

    // Create the article and award reputation to author
    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.article.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          authorId: userId,
          authorRole: userRole as Role,
          imageUrls: imageUrls
        },
        include: {
          author: {
            select: {
              name: true,
              bio: true,
              avatarUrl: true
            }
          }
        }
      });
      // Award reputation for publishing
      await awardReputation(tx as any, { userId, action: 'article_published', entityType: 'article', entityId: created.id });
      return created;
    });

    // Create tags if they don't exist and link them to the article
    if (parsedTags.length > 0) {
      for (const tagName of parsedTags) {
        try {
          // Find or create tag
          let tag = await prisma.tag.findUnique({
            where: { name: tagName.toLowerCase().trim() }
          });

          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: tagName.toLowerCase().trim() }
            });
          }

          // Link tag to article
          await prisma.articleTag.create({
            data: {
              articleId: article.id,
              tagId: tag.id
            }
          });
        } catch (error) {
          console.error(`Error creating/linking tag ${tagName}:`, error);
          // Continue with other tags even if one fails
        }
      }
    }

    res.status(201).json({
      message: 'Article created successfully',
      article: {
        id: article.id,
        title: article.title,
        content: article.content,
        imageUrls: article.imageUrls,
        authorName: article.author.name,
        createdAt: article.createdAt,
        tags: parsedTags
      }
    });

  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ message: 'Server error', details: (error as any)?.message });
  }
});

// Vote on an article (adjust reputation of the ARTICLE AUTHOR when net vote changes)
router.post('/:id/vote', authenticateToken, async (req: any, res: any) => {
  try {
    const articleId = parseInt(req.params.id);
    const { voteType } = req.body;
    const userId = req.user.userId;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check if user has already voted
    const existingVote = await prisma.articleVote.findUnique({
      where: {
        voterId_articleId: {
          voterId: userId,
          articleId: articleId
        }
      }
    });

    const authorId = article.authorId;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off -> reverse previous reputation impact
        await prisma.$transaction(async (tx) => {
          await tx.articleVote.delete({ where: { id: existingVote.id } });
          // Reverse: if previous was upvote subtract 5, if downvote add 2
          if (existingVote.voteType === 'upvote') {
            await awardReputation(tx as any, { userId: authorId, action: 'article_upvoted', overridePoints: -5, entityType: 'article', entityId: articleId, bypassCap: true, customDescription: 'Upvote removed' });
          } else {
            await awardReputation(tx as any, { userId: authorId, action: 'article_downvoted', overridePoints: 2, entityType: 'article', entityId: articleId, bypassCap: true, customDescription: 'Downvote removed' });
          }
        });
        return res.json({ message: 'Vote removed successfully' });
      } else {
        // Switching vote: apply delta (up->down: -5 then -2 = -7 total; we implement as -7) (down->up: +2 then +5 = +7)
        const delta = existingVote.voteType === 'upvote' ? -7 : 7;
        await prisma.$transaction(async (tx) => {
          await tx.articleVote.update({ where: { id: existingVote.id }, data: { voteType: voteType as any } });
          await awardReputation(tx as any, { userId: authorId, action: voteType === 'upvote' ? 'article_upvoted' : 'article_downvoted', overridePoints: delta, entityType: 'article', entityId: articleId, bypassCap: true, customDescription: 'Vote switched' });
        });
        return res.json({ message: 'Vote updated successfully' });
      }
    }

    // New vote
    await prisma.$transaction(async (tx) => {
      await tx.articleVote.create({
        data: {
          voterId: userId,
          articleId: articleId,
          voteType: voteType as 'upvote' | 'downvote'
        }
      });
      await awardReputation(tx as any, { userId: authorId, action: voteType === 'upvote' ? 'article_upvoted' : 'article_downvoted', entityType: 'article', entityId: articleId });
    });

    res.json({ message: 'Vote recorded successfully' });

  } catch (error) {
    console.error('Error voting on article:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an article (only by author)
router.put('/:id', authenticateToken, uploadArticleImages, async (req: any, res: any) => {
  try {
    const articleId = parseInt(req.params.id);
    const { title, content, tags, existingImageUrls } = req.body;
    const userId = req.user.userId;

    // Validation - relaxed for editing
    if (!title || title.trim().length < 1) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!content || content.trim().length < 1) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if article exists and user is the author
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (article.authorId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own articles' });
    }

    // Handle image URLs
    let imageUrls: string[] = [];
    
    // Parse existing image URLs if provided (these are Cloudinary URLs to keep)
    if (existingImageUrls) {
      try {
        imageUrls = typeof existingImageUrls === 'string' 
          ? JSON.parse(existingImageUrls) 
          : existingImageUrls;
      } catch (error) {
        console.error('Error parsing existing image URLs:', error);
        imageUrls = [];
      }
    }

    // Delete old images that were removed (compare article.imageUrls with existingImageUrls)
    if (article.imageUrls && Array.isArray(article.imageUrls)) {
      const removedImages = article.imageUrls.filter((url: string) => !imageUrls.includes(url));
      for (const imageUrl of removedImages) {
        try {
          const publicId = extractPublicId(imageUrl);
          if (publicId) {
            await deleteImage(publicId);
            console.log(`Deleted removed image: ${publicId}`);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
    }

    // Add newly uploaded images (Cloudinary URLs)
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = getUploadedImageUrl(file);
        if (imageUrl) imageUrls.push(imageUrl);
      }
    }

    // Update the article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        title: title.trim(),
        content: content.trim(),
        imageUrls: imageUrls
      },
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            avatarUrl: true
          }
        }
      }
    });

    // Update tags if provided
    if (tags) {
      let parsedTags: string[] = [];
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        console.error('Error parsing tags:', error);
        parsedTags = [];
      }

      if (parsedTags.length > 0) {
        // Remove existing tags
        await prisma.articleTag.deleteMany({
          where: { articleId }
        });

        // Add new tags
        for (const tagName of parsedTags) {
          try {
            let tag = await prisma.tag.findUnique({
              where: { name: tagName.toLowerCase().trim() }
            });

            if (!tag) {
              tag = await prisma.tag.create({
                data: { name: tagName.toLowerCase().trim() }
              });
            }

            await prisma.articleTag.create({
              data: {
                articleId: articleId,
                tagId: tag.id
              }
            });
          } catch (error) {
            console.error(`Error creating/linking tag ${tagName}:`, error);
          }
        }
      }
    }

    // Fetch complete article with tags
    const completeArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: {
            name: true,
            bio: true,
            avatarUrl: true
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
      message: 'Article updated successfully',
      article: {
        id: completeArticle!.id,
        title: completeArticle!.title,
        content: completeArticle!.content,
        imageUrls: completeArticle!.imageUrls,
        authorName: completeArticle!.author.name,
        authorBio: completeArticle!.author.bio,
        authorAvatar: completeArticle!.author.avatarUrl,
        tags: completeArticle!.tags.map(at => at.tag.name),
        updatedAt: completeArticle!.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

// Delete an article (only by author)
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const articleId = parseInt(req.params.id);
    const userId = req.user.userId;

    // Check if article exists and user is the author
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (article.authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own articles' });
    }

    // Delete images from Cloudinary before deleting the article
    if (article.imageUrls && article.imageUrls.length > 0) {
      for (const imageUrl of article.imageUrls) {
        try {
          const publicId = extractPublicId(imageUrl);
          if (publicId) {
            await deleteImage(publicId);
          }
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with deletion even if image cleanup fails
        }
      }
    }

    // Delete the article (cascade will handle related records)
    await prisma.article.delete({
      where: { id: articleId }
    });

    res.json({ message: 'Article deleted successfully' });

  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined
    });
  }
});

export { router as articlesRouter };
