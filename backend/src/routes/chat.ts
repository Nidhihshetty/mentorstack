import { Router } from 'express';
import authenticateToken, { AuthenticatedRequest } from '../middleware/authenticateToken';
import { publish } from '../realtime/rabbit';
import { EXCHANGES } from '../realtime/constants';
import { prisma } from '../lib/prisma';

export const chatRouter = Router();

// POST /api/chat/ask { question: string }
chatRouter.post('/ask', authenticateToken as any, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { question } = req.body as { question?: string };
    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    const userId = req.user!.userId;

    await publish({
      exchange: EXCHANGES.direct,
      routingKey: 'ai-question',
      message: { userId, question: question.trim() },
    });

    res.json({ status: 'queued' });
  } catch (e) {
    console.error('chat/ask error', e);
    res.status(500).json({ error: 'Failed to queue question' });
  }
});

// GET /api/chat/messages?connectionId=123&limit=50
chatRouter.get('/messages', authenticateToken as any, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const connectionId = Number(req.query.connectionId);
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    if (!connectionId || Number.isNaN(connectionId)) {
      res.status(400).json({ error: 'connectionId required' });
      return;
    }

    const conn = await prisma.connection.findUnique({ where: { id: connectionId },
      select: { mentorUserId: true, menteeUserId: true, conversation: { select: { id: true } } }
    });
    if (!conn || (conn.mentorUserId !== userId && conn.menteeUserId !== userId)) {
      res.status(403).json({ error: 'Not part of this connection' });
      return;
    }

    if (!conn.conversation) {
      res.json({ messages: [] });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: conn.conversation.id },
      orderBy: { id: 'desc' },
      take: limit,
      select: { id: true, senderId: true, message: true, timestamp: true, isRead: true },
    });
    res.json({ messages: messages.reverse() });
  } catch (e) {
    console.error('GET /api/chat/messages error', e);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/chat/connections - list all accepted connections for the authenticated user (as mentor or mentee)
chatRouter.get('/connections', authenticateToken as any, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ mentorUserId: userId }, { menteeUserId: userId }],
      },
      include: {
        conversation: { select: { id: true } },
        mentor: { select: { id: true, name: true, email: true, avatarUrl: true } },
        mentee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { acceptedAt: 'desc' },
    });

    // Fetch last message for each connection in one go
    const convIds = connections.map(c => c.conversation?.id).filter(Boolean) as number[];
    const lastMessagesMap = new Map<number, { id: number; message: string; timestamp: Date; senderId: number }>();
    if (convIds.length) {
      const lastMessages = await prisma.message.findMany({
        where: { conversationId: { in: convIds } },
        distinct: ['conversationId'],
        orderBy: [{ conversationId: 'asc' }, { id: 'desc' }],
        select: { id: true, conversationId: true, message: true, timestamp: true, senderId: true },
      });
      // Note: Prisma distinct ordering trick can vary; if not supported, we'd fetch per conversation or with a raw query.
      for (const m of lastMessages) lastMessagesMap.set(m.conversationId, { id: m.id, message: m.message, timestamp: m.timestamp, senderId: m.senderId });
    }

    const data = connections.map((c) => {
      const counterpart = c.mentorUserId === userId ? c.mentee : c.mentor;
      const lm = c.conversation?.id ? lastMessagesMap.get(c.conversation.id) : undefined;
      return {
        connectionId: c.id,
        acceptedAt: c.acceptedAt,
        conversationId: c.conversation?.id || null,
        counterpart: counterpart ? { id: counterpart.id, name: counterpart.name, email: counterpart.email, avatarUrl: counterpart.avatarUrl } : null,
        lastMessage: lm ? { id: lm.id, text: lm.message, timestamp: lm.timestamp, senderId: lm.senderId } : null,
      };
    });

    res.json({ connections: data });
  } catch (e) {
    console.error('GET /api/chat/connections error', e);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});
