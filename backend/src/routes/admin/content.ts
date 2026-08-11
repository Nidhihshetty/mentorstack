import express from 'express';
import { prisma } from '../../lib/prisma';
import { requireAdmin } from '../../middleware/adminAuth';

const router = express.Router();

// protect all admin content routes
router.use(requireAdmin);

// Helper to parse pagination
function parsePagination(query: any) {
  const page = Math.max(1, Number.parseInt(query.page || '1'));
  const limit = Math.max(1, Number.parseInt(query.limit || '20'));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// GET /content/questions
router.get('/questions', async (req: any, res: any) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { answers: true, bookmarks: true, tags: true } }
        }
      }),
      prisma.question.count()
    ]);

    res.json({ questions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching questions', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// DELETE /content/questions/:id
router.delete('/questions/:id', async (req: any, res: any) => {
  try {
  const id = Number.parseInt(req.params.id);
    await prisma.question.delete({ where: { id } });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('Error deleting question', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// GET /content/questions/:id (question details with answers)
router.get('/questions/:id', async (req: any, res: any) => {
  try {
    const id = Number.parseInt(req.params.id);
    const question = await prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        tags: {
          select: {
            tag: { select: { id: true, name: true } }
          }
        },
        _count: { select: { answers: true, bookmarks: true, tags: true } },
        answers: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            body: true,
            upvotes: true,
            downvotes: true,
            createdAt: true,
            author: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } }
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const normalized = {
      ...question,
      tags: question.tags.map((t: any) => t.tag)
    };

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching question details', err);
    res.status(500).json({ error: 'Failed to fetch question details' });
  }
});

// PATCH /content/questions/:id (edit title/body)
router.patch('/questions/:id', async (req: any, res: any) => {
  try {
    const id = Number.parseInt(req.params.id);
    const { title, body } = req.body || {};
    if (!title && !body) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(body ? { body } : {})
      },
      select: { id: true, title: true, body: true, updatedAt: true }
    });
    res.json({ message: 'Question updated', question });
  } catch (err) {
    console.error('Error updating question', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /content/answers/:id
router.delete('/answers/:id', async (req: any, res: any) => {
  try {
    const id = Number.parseInt(req.params.id);
    await prisma.answer.delete({ where: { id } });
    res.json({ message: 'Answer deleted' });
  } catch (err) {
    console.error('Error deleting answer', err);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

// GET /content/articles
router.get('/articles', async (req: any, res: any) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          authorId: true,
          authorRole: true,
          title: true,
          content: true,
          imageUrls: true,
          upvotes: true,
          downvotes: true,
          createdAt: true,
          updatedAt: true,
          author: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              role: true,
              avatarUrl: true 
            } 
          },
          tags: {
            select: {
              tag: { 
                select: { 
                  id: true, 
                  name: true 
                } 
              }
            }
          },
          _count: { 
            select: { 
              votes: true,
              bookmarks: true, 
              tags: true 
            } 
          }
        }
      }),
      prisma.article.count()
    ]);

    res.json({ articles, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching articles', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /content/articles/:id (article details)
router.get('/articles/:id', async (req: any, res: any) => {
  try {
    const id = Number.parseInt(req.params.id);
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        authorRole: true,
        title: true,
        content: true,
        imageUrls: true,
        upvotes: true,
        downvotes: true,
        createdAt: true,
        updatedAt: true,
        author: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            avatarUrl: true 
          } 
        },
        tags: {
          select: {
            tag: { 
              select: { 
                id: true, 
                name: true,
                description: true 
              } 
            }
          }
        },
        votes: {
          select: {
            id: true,
            voterId: true,
            voteType: true,
            createdAt: true,
            voter: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        bookmarks: {
          select: {
            id: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        _count: { 
          select: { 
            votes: true,
            bookmarks: true, 
            tags: true 
          } 
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (err) {
    console.error('Error fetching article details', err);
    res.status(500).json({ error: 'Failed to fetch article details' });
  }
});

// DELETE /content/articles/:id
router.delete('/articles/:id', async (req: any, res: any) => {
  try {
  const id = Number.parseInt(req.params.id);
    await prisma.article.delete({ where: { id } });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    console.error('Error deleting article', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// GET /content/posts (community posts)
router.get('/posts', async (req: any, res: any) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          content: true,
          upvotes: true,
          downvotes: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
          community: { select: { id: true, name: true } }
        }
      }),
      prisma.communityPost.count()
    ]);

    res.json({ posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error fetching posts', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// DELETE /content/posts/:id
router.delete('/posts/:id', async (req: any, res: any) => {
  try {
  const id = Number.parseInt(req.params.id);
    await prisma.communityPost.delete({ where: { id } });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Error deleting post', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
