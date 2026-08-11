import { Router } from 'express';
import { prisma } from '../lib/prisma';
import authenticateToken, { AuthenticatedRequest } from '../middleware/authenticateToken';

export const aiRouter = Router();

// Simple header-based auth for internal agent
function verifyAgent(req: any): boolean {
  const expected = process.env.AGENT_TOKEN || '';
  if (!expected) return true; // if not configured, allow (dev convenience)
  const got = req.header('X-Agent-Token') || '';
  return expected && got && expected === got;
}

// POST /api/ai/log
aiRouter.post('/log', async (req, res) => {
  try {
    if (!verifyAgent(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId, prompt, response } = req.body || {};
    const uid = Number(userId);
    if (!uid || !prompt || !response) {
      res.status(400).json({ error: 'userId, prompt and response are required' });
      return;
    }

    // Ensure user exists to avoid FK errors
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Be defensive about payload sizes
    const promptStr = String(prompt).slice(0, 15000);
    const responseStr = String(response).slice(0, 15000);

    const log = await prisma.aiLog.create({
      data: { userId: uid, prompt: promptStr, response: responseStr },
    });

    res.json({ status: 'ok', id: log.id, timestamp: log.timestamp });
  } catch (e: any) {
    console.error('AI log route error', e);
    const message = e?.message || 'Failed to create AI log';
    // Return detailed error in non-production to help diagnose
    if (process.env.NODE_ENV !== 'production') {
      res.status(500).json({ error: 'Failed to create AI log', detail: message });
    } else {
      res.status(500).json({ error: 'Failed to create AI log' });
    }
  }
});

export default aiRouter;

// Authenticated: GET /api/ai/history?limit=50
// Returns the current user's AI prompt/response pairs ordered by timestamp desc
aiRouter.get('/history', authenticateToken as any, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined; // optional id cursor for pagination

    const where: any = { userId };
    const orderBy = { id: 'desc' as const };

    let items;
    if (cursor && !Number.isNaN(cursor)) {
      // cursor-based pagination: fetch items with id < cursor
      items = await prisma.aiLog.findMany({
        where: { ...where, id: { lt: cursor } },
        orderBy,
        take: limit,
        select: { id: true, prompt: true, response: true, timestamp: true },
      });
    } else {
      items = await prisma.aiLog.findMany({
        where,
        orderBy,
        take: limit,
        select: { id: true, prompt: true, response: true, timestamp: true },
      });
    }

    const nextCursor = items.length === limit ? items[items.length - 1].id : null;
    res.json({ items, nextCursor });
  } catch (e) {
    console.error('GET /api/ai/history error', e);
    res.status(500).json({ error: 'Failed to fetch AI history' });
  }
});
