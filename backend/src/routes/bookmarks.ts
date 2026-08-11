import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { awardReputation } from '../lib/reputation';

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

// Idempotent helper: create if not exists (race-safe via upsert)
async function ensureQuestionBookmark(userId: number, questionId: number) {
  // Confirm question exists
  const question = await prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
  if (!question) throw Object.assign(new Error('Question not found'), { status: 404 });

  return prisma.questionBookmark.upsert({
    where: { userId_questionId: { userId, questionId } },
    update: {},
    create: { userId, questionId },
  });
}

async function removeQuestionBookmark(userId: number, questionId: number) {
  await prisma.questionBookmark.deleteMany({ where: { userId, questionId } });
}

async function ensureArticleBookmark(userId: number, articleId: number) {
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!article) throw Object.assign(new Error('Article not found'), { status: 404 });

  return prisma.articleBookmark.upsert({
    where: { userId_articleId: { userId, articleId } },
    update: {},
    create: { userId, articleId },
  });
}

async function removeArticleBookmark(userId: number, articleId: number) {
  await prisma.articleBookmark.deleteMany({ where: { userId, articleId } });
}

async function ensureCommunityPostBookmark(userId: number, communityPostId: number) {
  const post = await prisma.communityPost.findUnique({ where: { id: communityPostId }, select: { id: true } });
  if (!post) throw Object.assign(new Error('Community post not found'), { status: 404 });

  return prisma.communityPostBookmark.upsert({
    where: { userId_communityPostId: { userId, communityPostId } },
    update: {},
    create: { userId, communityPostId },
  });
}

async function removeCommunityPostBookmark(userId: number, communityPostId: number) {
  await prisma.communityPostBookmark.deleteMany({ where: { userId, communityPostId } });
}

// POST /api/bookmarks/questions/:questionId
router.post('/questions/:questionId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const questionId = Number(req.params.questionId);
    if (!questionId || Number.isNaN(questionId)) return res.status(400).json({ message: 'Invalid question id' });
    const existed = await prisma.questionBookmark.findUnique({ where: { userId_questionId: { userId, questionId } } });
    const bookmark = await ensureQuestionBookmark(userId, questionId);
    if (!existed) {
      const question = await prisma.question.findUnique({ where: { id: questionId }, select: { authorId: true } });
      if (question && question.authorId !== userId) {
        await awardReputation(prisma as any, { userId: question.authorId, action: 'question_bookmarked', entityType: 'question', entityId: questionId });
      }
    }
    res.json({ message: 'Bookmarked', bookmark });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ message: err?.message || 'Failed to bookmark question' });
  }
});

// DELETE /api/bookmarks/questions/:questionId
router.delete('/questions/:questionId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const questionId = Number(req.params.questionId);
    if (!questionId || Number.isNaN(questionId)) return res.status(400).json({ message: 'Invalid question id' });
    const existed = await prisma.questionBookmark.findUnique({ where: { userId_questionId: { userId, questionId } } });
    await removeQuestionBookmark(userId, questionId);
    if (existed) {
      const question = await prisma.question.findUnique({ where: { id: questionId }, select: { authorId: true } });
      if (question && question.authorId !== userId) {
        await awardReputation(prisma as any, { userId: question.authorId, action: 'question_bookmarked', overridePoints: -10, entityType: 'question', entityId: questionId, bypassCap: true, customDescription: 'Bookmark removed' });
      }
    }
    res.json({ message: 'Removed' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});

// POST /api/bookmarks/articles/:articleId
router.post('/articles/:articleId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const articleId = Number(req.params.articleId);
    if (!articleId || Number.isNaN(articleId)) return res.status(400).json({ message: 'Invalid article id' });
    const existed = await prisma.articleBookmark.findUnique({ where: { userId_articleId: { userId, articleId } } });
    const bookmark = await ensureArticleBookmark(userId, articleId);
    if (!existed) {
      const article = await prisma.article.findUnique({ where: { id: articleId }, select: { authorId: true } });
      if (article && article.authorId !== userId) {
        await awardReputation(prisma as any, { userId: article.authorId, action: 'article_bookmarked', entityType: 'article', entityId: articleId });
      }
    }
    res.json({ message: 'Bookmarked', bookmark });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ message: err?.message || 'Failed to bookmark article' });
  }
});

router.delete('/articles/:articleId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const articleId = Number(req.params.articleId);
    if (!articleId || Number.isNaN(articleId)) return res.status(400).json({ message: 'Invalid article id' });
    const existed = await prisma.articleBookmark.findUnique({ where: { userId_articleId: { userId, articleId } } });
    await removeArticleBookmark(userId, articleId);
    if (existed) {
      const article = await prisma.article.findUnique({ where: { id: articleId }, select: { authorId: true } });
      if (article && article.authorId !== userId) {
        await awardReputation(prisma as any, { userId: article.authorId, action: 'article_bookmarked', overridePoints: -10, entityType: 'article', entityId: articleId, bypassCap: true, customDescription: 'Bookmark removed' });
      }
    }
    res.json({ message: 'Removed' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});

// POST /api/bookmarks/community-posts/:postId
router.post('/community-posts/:postId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const postId = Number(req.params.postId);
    if (!postId || Number.isNaN(postId)) return res.status(400).json({ message: 'Invalid post id' });
    const existed = await prisma.communityPostBookmark.findUnique({ where: { userId_communityPostId: { userId, communityPostId: postId } } });
    const bookmark = await ensureCommunityPostBookmark(userId, postId);
    if (!existed) {
      const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
      if (post && post.authorId !== userId) {
        await awardReputation(prisma as any, { userId: post.authorId, action: 'community_post_bookmarked', entityType: 'community_post', entityId: postId });
      }
    }
    res.json({ message: 'Bookmarked', bookmark });
  } catch (err: any) {
    const status = err?.status || 500;
    res.status(status).json({ message: err?.message || 'Failed to bookmark post' });
  }
});

router.delete('/community-posts/:postId', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const postId = Number(req.params.postId);
    if (!postId || Number.isNaN(postId)) return res.status(400).json({ message: 'Invalid post id' });
    const existed = await prisma.communityPostBookmark.findUnique({ where: { userId_communityPostId: { userId, communityPostId: postId } } });
    await removeCommunityPostBookmark(userId, postId);
    if (existed) {
      const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { authorId: true } });
      if (post && post.authorId !== userId) {
        await awardReputation(prisma as any, { userId: post.authorId, action: 'community_post_bookmarked', overridePoints: -10, entityType: 'community_post', entityId: postId, bypassCap: true, customDescription: 'Bookmark removed' });
      }
    }
    res.json({ message: 'Removed' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});

// GET /api/bookmarks - current user's bookmarks grouped by type
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId as number;
    const [qbs, abs, cbs] = await Promise.all([
      prisma.questionBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { question: { select: { id: true, title: true, createdAt: true } } }
      }),
      prisma.articleBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { article: { select: { id: true, title: true, createdAt: true } } }
      }),
      prisma.communityPostBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { communityPost: { select: { id: true, title: true, createdAt: true, communityId: true, community: { select: { name: true } } } } }
      })
    ]);

    const result = {
      questions: qbs.map(b => ({ id: b.id, questionId: b.question.id, title: b.question.title, createdAt: b.question.createdAt })),
      articles: abs.map(b => ({ id: b.id, articleId: b.article.id, title: b.article.title, createdAt: b.article.createdAt })),
      posts: cbs.map(b => ({ id: b.id, postId: b.communityPost.id, title: b.communityPost.title, communityId: b.communityPost.communityId, communityName: (b.communityPost as any).community?.name, createdAt: b.communityPost.createdAt }))
    };

    res.json(result);
  } catch (err) {
    console.error('Failed to load bookmarks', err);
    res.status(500).json({ message: 'Failed to load bookmarks' });
  }
});

export { router as bookmarksRouter };
