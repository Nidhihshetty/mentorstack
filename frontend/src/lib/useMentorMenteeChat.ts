"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WS_BASE_URL } from "./ws-constants";
import { authAPI } from "./auth-api";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE = `${BACKEND_URL}/api`;

export type ChatConnection = {
  connectionId: number;
  conversationId: number | null;
  acceptedAt: string;
  counterpart: { id: number; name: string; email: string; avatarUrl: string | null } | null;
  lastMessage: { id: number; text: string; timestamp: string; senderId: number } | null;
};

export type ChatMessage = {
  id?: number;
  senderId: number;
  content: string;
  timestamp: string;
};

export function useMentorMenteeChat() {
  const [connections, setConnections] = useState<ChatConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, ChatMessage[]>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const auth = authAPI;
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const token = useMemo(() => auth.getToken(), [auth]);

  useEffect(() => {
    (async () => {
      try {
        const me = await auth.getCurrentUser();
        setCurrentUserId(me.user.id);
      } catch (e) {
        console.error('Failed to load current user', e);
      }
    })();
  }, [auth]);

  const fetchConnections = useCallback(async () => {
    if (!token) return [] as ChatConnection[];
    const res = await fetch(`${API_BASE}/chat/connections`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch connections');
    const data = await res.json();
    setConnections(data.connections || []);
    return data.connections as ChatConnection[];
  }, [token]);

  const fetchMessages = useCallback(async (connectionId: number) => {
    if (!token) return [] as ChatMessage[];
    const res = await fetch(`${API_BASE}/chat/messages?connectionId=${connectionId}&limit=100`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    const data = await res.json();
    const list: ChatMessage[] = (data.messages || []).map((m: any) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.message,
      timestamp: m.timestamp,
    }));
    setMessages((prev) => ({ ...prev, [connectionId]: list }));
    return list;
  }, [token]);

  const openWs = useCallback((connectionId: number) => {
    if (!token) return;
    // Close any previous
    try { wsRef.current?.close(); } catch {}
    const wsUrl = `${WS_BASE_URL}/ws/chat?token=${encodeURIComponent(token)}&connectionId=${connectionId}`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === 'chat.message') {
          const cm: ChatMessage = {
            id: msg.messageId,
            senderId: msg.senderId,
            content: msg.content,
            timestamp: msg.timestamp,
          };
          setMessages((prev) => ({
            ...prev,
            [connectionId]: [...(prev[connectionId] || []), cm],
          }));
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };
    ws.onerror = (err) => console.error('WS error', err);
    wsRef.current = ws;
    setActiveConnectionId(connectionId);
  }, [token]);

  const send = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content }));
  }, []);

  const selectConnection = useCallback(async (connectionId: number) => {
    await fetchMessages(connectionId);
    openWs(connectionId);
  }, [fetchMessages, openWs]);

  useEffect(() => {
    // Load connections at mount
    fetchConnections().catch((e) => console.error(e));
    return () => { try { wsRef.current?.close(); } catch {} };
  }, [fetchConnections]);

  return {
    connections,
    activeConnectionId,
    messages: activeConnectionId ? (messages[activeConnectionId] || []) : [],
    send,
    selectConnection,
    refetch: fetchConnections,
    currentUserId,
  };
}
