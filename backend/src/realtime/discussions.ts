import WebSocket from 'ws';
import url from 'url';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { ROUTING_KEYS, EXCHANGES } from './constants';
import { createEphemeralConsumer, publish } from './rabbit';
import type { IncomingMessage } from 'http';

function authenticateFromQuery(reqUrl: string | undefined) {
  if (!reqUrl) return null;
  const parsed = url.parse(reqUrl, true);
  const token = (parsed.query.token as string) || '';
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    return payload;
  } catch {
    return null;
  }
}

export async function handleDiscussionsConnection(ws: WebSocket, req: IncomingMessage) {
  try {
    const parsed = url.parse(req.url || '', true);
    const communityId = Number(parsed.query.communityId);
    const auth = authenticateFromQuery(req.url);

    if (!auth || !communityId || Number.isNaN(communityId)) {
      ws.close(1008, 'Unauthorized or invalid community');
      return;
    }

    const isMember = await prisma.communityMember.findFirst({
      where: { communityId, userId: auth.userId, userRole: auth.role },
    });
    if (!isMember) {
      ws.close(1008, 'Not a member of this community');
      return;
    }

    const bindingKey = ROUTING_KEYS.community(communityId);
    const consumer = await createEphemeralConsumer(bindingKey, (msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    });

    ws.on('message', async (raw: Buffer) => {
      try {
        const text = raw.toString();
        const payload = JSON.parse(text);
        const content = String(payload?.content || '').slice(0, 4000);
        if (!content) return;

        const enriched = {
          type: 'community.message',
          communityId,
          content,
          senderId: auth.userId,
          senderRole: auth.role,
          timestamp: new Date().toISOString(),
        };

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
}

