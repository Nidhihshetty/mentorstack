import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './middleware/auth';
import { menteesRouter } from './routes/mentees';
import { communitiesRouter } from './routes/communities';
import { questionsRouter } from './routes/questions';
import { articlesRouter } from './routes/articles';
import { tagsRouter } from './routes/tags';
import rephraseRoute from './routes/rephrase';
import summarizeRoute from "./routes/summarize";
import { mentorsRouter } from './routes/mentors';
import { mentorListRouter } from './routes/mentorlist';
import { menteeRequestRouter } from './routes/mentee-request';
import tagsRoute from "./routes/rectags";
import spellcheckerRoute from './routes/spellcheck-express';
import similarQuestionsRoute from './routes/similar-questions';
import validateAnswerRoute from './routes/validate-answer';
import { createServer, IncomingMessage } from 'node:http';
// inlined discussions connection handler to avoid import/init order issues
import { prisma } from './lib/prisma';
import { chatRouter } from './routes/chat';
import WebSocket, { WebSocketServer, RawData } from 'ws';
// Removed legacy parseUrl usage; rely on WHATWG URL API exclusively
import jwt from 'jsonwebtoken';
import { getRabbitChannel, createEphemeralConsumer, publish } from './realtime/rabbit';
import { WS_PATHS, ROUTING_KEYS, EXCHANGES } from './realtime/constants';
import { ensureAiTopology } from './realtime/ai-topology';
import { ensureChatTopology } from './realtime/chat-topology';
import wordleRouter from "./routes/wordle";
import wordsRouter from "./routes/words";
import aiRouter from './routes/ai';
import { bookmarksRouter } from './routes/bookmarks';
import uploadRouter from './routes/upload';
import { reputationRouter } from './routes/reputation';
import { badgesRouter } from './routes/badges';
// Admin routes
import { adminAuthRouter } from './routes/admin/auth';
import { adminUsersRouter } from './routes/admin/users';
import adminStatsRouter from './routes/admin/stats';
import adminCommunitiesRouter from './routes/admin/communities';
import adminContentRouter from './routes/admin/content';
import adminTagsRouter from './routes/admin/tags';
import adminMentorshipRouter from './routes/admin/mentorship';
import adminBadgesRouter from './routes/admin/badges';
import adminReputationRouter from './routes/admin/reputation';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3000'];

const isDevLocalOrigin = (origin: string) => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const isVercelPreviewOrigin = (origin: string) => /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isDevLocalOrigin(origin) || isVercelPreviewOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentees', menteesRouter);
app.use('/api/communities', communitiesRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/rephrase', rephraseRoute);
app.use("/api/summarize", summarizeRoute);
app.use('/api/mentors', mentorsRouter);
app.use('/api/mentor-list', mentorListRouter);
app.use('/api/mentee-request', menteeRequestRouter);
app.use("/api/rectags", tagsRoute);
app.use("/api/wordle", wordleRouter);
app.use("/api/words", wordsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/spellcheck', spellcheckerRoute);
app.use('/api/similar-questions', similarQuestionsRoute);
app.use('/api/ai', aiRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/reputation', reputationRouter);
app.use('/api/badges', badgesRouter);

// Admin Routes - Protected by requireAdmin middleware
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/stats', adminStatsRouter);
app.use('/api/admin/communities', adminCommunitiesRouter);
app.use('/api/admin/content', adminContentRouter);
app.use('/api/admin/tags', adminTagsRouter);
app.use('/api/admin/mentorship', adminMentorshipRouter);
app.use('/api/admin/badges', adminBadgesRouter);
app.use('/api/admin/reputation', adminReputationRouter);

app.use('/api/validate-answer', validateAnswerRoute);
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MentorStack API is running' });
});

// Add a simple root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'MentorStack Backend API', 
    endpoints: [
      '/api/health', 
      '/api/auth/signup', 
      '/api/auth/login', 
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/auth/me',
      '/api/mentees',
      '/api/mentees/profile/me',
      '/api/mentors',
      '/api/communities',
      '/api/questions',
      '/api/articles',
      '/api/admin/auth/login',
      '/api/admin/users',
      '/api/admin/stats/overview',
      '/api/admin/content/questions',
      '/api/admin/content/articles',
      '/api/admin/content/posts'
    ] 
  });
});

// Create HTTP server to attach WebSocket server
const server = createServer(app);

// Create WebSocket servers without attaching them to the HTTP server directly.
const discussionsWss = new WebSocketServer({ noServer: true });
const mainWss = new WebSocketServer({ noServer: true });
const chatWss = new WebSocketServer({ noServer: true });

// Helper: auth from query
function authenticateFromQuery(reqUrl: string | undefined) {
  if (!reqUrl) return null as any;
  let token = '';
  try {
    const u = new URL(reqUrl, 'http://localhost');
    token = u.searchParams.get('token') || '';
  } catch {
    return null;
  }
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
  } catch {
    return null;
  }
}

// Assign connection handlers
discussionsWss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  try {
  const urlObj = new URL(req.url || '', 'http://localhost');
    const communityId = Number(urlObj.searchParams.get('communityId'));
    const auth = authenticateFromQuery(req.url);

    if (!auth || !communityId || Number.isNaN(communityId)) {
      ws.close(1008, 'Unauthorized or invalid community');
      return;
    }

    // Verify membership
    const isMember = await prisma.communityMember.findFirst({
      where: { communityId, userId: auth.userId, userRole: auth.role },
    });
    if (!isMember) {
      ws.close(1008, 'Not a member of this community');
      return;
    }

    // Send recent history first (last 50 messages)
    try {
      const recent = await prisma.$queryRaw<any[]>`
        SELECT cm.id, cm."communityId", cm."senderId", cm.content, cm."createdAt",
               u.name as "senderName", u.role as "senderRole"
        FROM "CommunityMessage" cm
        JOIN "User" u ON u.id = cm."senderId"
        WHERE cm."communityId" = ${communityId}
        ORDER BY cm."createdAt" DESC
        LIMIT 50
      `;
      const orderedRecent = recent.slice().reverse();
      const historyPayload = {
        type: 'community.history',
        communityId,
        messages: orderedRecent.map((m: any) => ({
          id: m.id,
          content: m.content,
          timestamp: m.createdAt,
          senderId: m.senderId,
          senderRole: m.senderRole,
          senderName: m.senderName,
        }))
      } as any;
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(historyPayload));
    } catch (e) {
      console.error('Failed to load community history', e);
    }

    // Create ephemeral RabbitMQ consumer bound to topic community.<id>
    const bindingKey = ROUTING_KEYS.community(communityId);
    const consumer = await createEphemeralConsumer(bindingKey, (msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    });

    ws.on('message', async (raw: RawData) => {
      try {
        let text = '';
        if (typeof raw === 'string') {
          text = raw;
        } else if (Buffer.isBuffer(raw)) {
          text = raw.toString();
        } else if (Array.isArray(raw)) {
          text = Buffer.concat(raw as any).toString();
        } else if (raw instanceof ArrayBuffer) {
          text = Buffer.from(raw).toString();
        }
        const payload = JSON.parse(text);
        const content = String(payload?.content || '').slice(0, 4000);
        if (!content) return;

        // Persist message
        const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { name: true, role: true } });
        const inserted = await prisma.$queryRaw<any[]>`
          INSERT INTO "CommunityMessage" ("communityId", "senderId", content, "createdAt", "updatedAt")
          VALUES (${communityId}, ${auth.userId}, ${content}, NOW(), NOW())
          RETURNING id, "createdAt"
        `;
        const saved = inserted?.[0] ?? { id: undefined, createdAt: new Date().toISOString() };

        const enriched = {
          type: 'community.message',
          communityId,
          content,
          senderId: auth.userId,
          senderRole: auth.role,
          senderName: user?.name || `user-${auth.userId}`,
          messageId: saved.id,
          timestamp: saved.createdAt,
        } as any;

        await publish({
          exchange: EXCHANGES.discussions,
          routingKey: bindingKey,
          message: enriched,
        });
      } catch (e) {
        console.error('Failed to process incoming message', e);
      }
    });

    ws.on('close', async () => {
      try { await consumer.cancel(); } catch {}
    });

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'system', message: 'joined', communityId }));
    }
  } catch (err) {
    console.error('WS connection error', err);
    try { ws.close(1011, 'Internal error'); } catch {}
  }
});

mainWss.on('connection', async (ws: WebSocket, req) => {
  try {
  const urlObj = new URL(req.url || '', 'http://localhost');
  const token = urlObj.searchParams.get('token') || '';
    if (!token) { ws.close(1008, 'Unauthorized'); return; }
    const auth = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const userId = auth.userId;
    if (!userId) { ws.close(1008, 'Unauthorized'); return; }

    const bindingKey = `bot-reply.${userId}`;
    // Inline direct-exchange ephemeral consumer to avoid import issues
    const ch = await getRabbitChannel();
    const q = await ch.assertQueue('', { exclusive: true, durable: false, autoDelete: true });
    await ch.bindQueue(q.queue, EXCHANGES.direct, bindingKey);
    const consumerTag = (await ch.consume(q.queue, (msg: any) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(content));
      } catch (e) {
        console.error('Failed to parse direct message', e);
      } finally {
        ch.ack(msg);
      }
    })).consumerTag;

    ws.on('close', async () => {
      try { await ch.cancel(consumerTag); } catch {}
      try { await ch.unbindQueue(q.queue, EXCHANGES.direct, bindingKey); } catch {}
      try { await ch.deleteQueue(q.queue); } catch {}
    });
  } catch (e) {
    console.error('WS /ws error', e);
    try { ws.close(1011, 'Internal error'); } catch {}
  }
});

// Mentor-Mentee direct chat WS: /ws/chat?token=...&connectionId=123
chatWss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  try {
  const urlObj = new URL(req.url || '', 'http://localhost');
  const token = urlObj.searchParams.get('token') || '';
  const connectionId = Number(urlObj.searchParams.get('connectionId'));
    if (!token || !connectionId || Number.isNaN(connectionId)) {
      ws.close(1008, 'Unauthorized or invalid connection');
      return;
    }

    const auth = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    const userId = auth.userId as number;
    if (!userId) { ws.close(1008, 'Unauthorized'); return; }

    // Validate membership in the connection (either mentor or mentee)
    const conn = await prisma.connection.findUnique({ where: { id: connectionId },
      select: { id: true, mentorUserId: true, menteeUserId: true, conversation: { select: { id: true } } }
    });
    if (!conn || (conn.mentorUserId !== userId && conn.menteeUserId !== userId)) {
      ws.close(1008, 'Not part of this connection');
      return;
    }

    // Ensure conversation exists for this connection
    let conversationId = conn.conversation?.id;
    if (!conversationId) {
      const created = await prisma.conversation.create({ data: { connectionId } });
      conversationId = created.id;
    }

    // Bind ephemeral consumer for this connection
    const bindingKey = ROUTING_KEYS.chatConnection(connectionId);
    const ch = await getRabbitChannel();
    const q = await ch.assertQueue('', { exclusive: true, durable: false, autoDelete: true });
    await ch.bindQueue(q.queue, EXCHANGES.chats, bindingKey);
    const consumerTag = (await ch.consume(q.queue, (msg: any) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(content));
      } catch (e) {
        console.error('Failed to parse chat message', e);
      } finally {
        ch.ack(msg);
      }
    })).consumerTag;

    ws.on('message', async (raw: RawData) => {
      try {
        let text = '';
        if (typeof raw === 'string') {
          text = raw;
        } else if (Buffer.isBuffer(raw)) {
          text = raw.toString();
        } else if (Array.isArray(raw)) {
          text = Buffer.concat(raw as any).toString();
        } else if (raw instanceof ArrayBuffer) {
          text = Buffer.from(raw).toString();
        }
        const payload = JSON.parse(text);
        const content = String(payload?.content || '').slice(0, 4000);
        if (!content) return;

        // Persist message
        const message = await prisma.message.create({
          data: {
            conversationId: Number(conversationId),
            senderId: userId,
            message: content,
          },
          select: { id: true, timestamp: true }
        });

        // Publish to RabbitMQ so the other peer(s) subscribed to this connection receive it
        await publish({
          exchange: EXCHANGES.chats,
          routingKey: bindingKey,
          message: {
            type: 'chat.message',
            connectionId,
            conversationId,
            messageId: message.id,
            senderId: userId,
            content,
            timestamp: message.timestamp,
          }
        });
      } catch (e) {
        console.error('Failed to process outbound chat message', e);
      }
    });

    ws.on('close', async () => {
      try { await ch.cancel(consumerTag); } catch {}
      try { await ch.unbindQueue(q.queue, EXCHANGES.chats, bindingKey); } catch {}
      try { await ch.deleteQueue(q.queue); } catch {}
    });

    // Initial handshake
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'system', message: 'joined', connectionId, conversationId }));
    }
  } catch (err) {
    console.error('/ws/chat error', err);
    try { ws.close(1011, 'Internal error'); } catch {}
  }
});

// Centralized upgrade handler
server.on('upgrade', (request, socket, head) => {
  let pathname: string | null = null;
  try {
    pathname = new URL(request.url || '', 'http://localhost').pathname;
  } catch {
    pathname = null;
  }

  if (pathname === WS_PATHS.discussions) {
    discussionsWss.handleUpgrade(request, socket, head, (ws) => {
      discussionsWss.emit('connection', ws, request);
    });
  } else if (pathname === '/ws') {
    mainWss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      mainWss.emit('connection', ws, request);
    });
  } else if (pathname === WS_PATHS.chat) {
    chatWss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
      chatWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});


server.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`🔐 Admin API available at http://localhost:${PORT}/api/admin`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`🔌 WebSocket endpoints ready for /ws and /ws/discussions`);
  try {
    await ensureAiTopology();
    console.log('🧠 AI topology ensured (direct exchange + user-questions-queue)');
    await ensureChatTopology();
    console.log('💬 Chat topology ensured (chats topic exchange)');
  } catch (e) {
    console.error('Failed to ensure AI topology', e);
  }
});
