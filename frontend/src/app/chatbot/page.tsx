'use client';

import Layout from '@/components/Layout';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { authAPI } from '@/lib/auth-api';
import { useAiHistory } from '@/lib/useAiHistory';

type ChatRole = 'user' | 'ai' | 'system';
type ChatStatus = 'thinking' | 'streaming' | 'done';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  ts: string;
  status?: ChatStatus;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [isAwaitingAi, setIsAwaitingAi] = useState(false);
  const [pendingAiMessageId, setPendingAiMessageId] = useState<string | null>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const streamTimerRef = useRef<number | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingAiMessageIdRef = useRef<string | null>(null);
  const { items: historyItems, loadMore, nextCursor } = useAiHistory(50);

  const makeMessageId = useCallback((prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  const clearStreamTimer = useCallback(() => {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const streamAIResponse = useCallback((messageId: string, fullText: string) => {
    clearStreamTimer();

    const safeText = fullText?.trim() || 'I could not generate a response.';
    const chunks = safeText.split(/(\s+)/).filter((part) => part.length > 0);
    const stepSize = Math.max(1, Math.ceil(chunks.length / 80));
    let index = 0;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, text: '', status: 'streaming' }
          : msg
      )
    );

    streamTimerRef.current = window.setInterval(() => {
      index = Math.min(index + stepSize, chunks.length);
      const partialText = chunks.slice(0, index).join('');
      const isDone = index >= chunks.length;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: partialText, status: isDone ? 'done' : 'streaming' }
            : msg
        )
      );

      if (isDone) {
        clearStreamTimer();
        setIsAwaitingAi(false);
        setPendingAiMessageId(null);
        pendingAiMessageIdRef.current = null;
      }
    }, 35);
  }, [clearStreamTimer]);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, []);

  // Simple, safe-ish formatter: escape HTML, then allow **bold** and newlines
  const escapeHTML = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const formatAI = (text: string) => {
    const escaped = escapeHTML(text);
    // Bold: **text**
    const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Newlines
    return withBold.replace(/\n/g, '<br/>');
  };

  useEffect(() => {
    setToken(authAPI.getToken());
  }, []);

  useEffect(() => {
    pendingAiMessageIdRef.current = pendingAiMessageId;
  }, [pendingAiMessageId]);

  useEffect(() => {
    return () => {
      clearStreamTimer();
      clearReconnectTimer();
      wsRef.current?.close();
    };
  }, [clearReconnectTimer, clearStreamTimer]);

  // Seed messages with AI history (prompt then response, oldest first)
  const mappedHistory = useMemo(() => {
    // historyItems are newest first; reverse to oldest first
    const chronological = [...historyItems].reverse();
    const pairs: ChatMessage[] = [];
    for (const it of chronological) {
      pairs.push({ id: `history-${it.id}-user`, role: 'user', text: it.prompt, ts: it.timestamp, status: 'done' });
      pairs.push({ id: `history-${it.id}-ai`, role: 'ai', text: it.response, ts: it.timestamp, status: 'done' });
    }
    return pairs;
  }, [historyItems]);

  useEffect(() => {
    // Only seed once initially; if you prefer merge, we can dedupe by timestamp + text
    if (mappedHistory.length && messages.length === 0) {
      setMessages(mappedHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappedHistory]);

  useEffect(() => {
    if (isLoadingOlder) return;
    scrollToBottom();
  }, [messages, isLoadingOlder, scrollToBottom]);

  useEffect(() => {
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');

    let disposed = false;

    const connect = () => {
      if (disposed) return;
      clearReconnectTimer();

      const ws = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (e) => {
        console.log('WebSocket message received:', e.data);
        try {
          const data = JSON.parse(e.data);
          if (data?.type === 'ai.reply' && data?.answer) {
            const pendingId = pendingAiMessageIdRef.current;
            if (pendingId) {
              streamAIResponse(pendingId, String(data.answer));
            } else {
              const newId = makeMessageId('ai');
              const ts = new Date().toISOString();
              setMessages((prev) => [...prev, { id: newId, role: 'ai', text: '', ts, status: 'streaming' }]);
              streamAIResponse(newId, String(data.answer));
            }
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        if (disposed) return;
        reconnectTimerRef.current = window.setTimeout(() => {
          connect();
        }, 2500);
      };
    };

    connect();

    return () => {
      disposed = true;
      clearReconnectTimer();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [token, clearReconnectTimer, makeMessageId, streamAIResponse]);

  const send = async () => {
    const text = input.trim();
    if (!text || isAwaitingAi) return;

    const now = new Date().toISOString();
    const userId = makeMessageId('user');
    const thinkingId = makeMessageId('thinking');

    setInput('');
    setIsAwaitingAi(true);
    setPendingAiMessageId(thinkingId);
    pendingAiMessageIdRef.current = thinkingId;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', text, ts: now, status: 'done' },
      { id: thinkingId, role: 'ai', text: 'AI is thinking...', ts: now, status: 'thinking' },
    ]);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authAPI.getToken()}`,
        },
        body: JSON.stringify({ question: text }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      // If response includes answer directly, stream it as a fallback.
      if (data?.answer) {
        const pendingId = pendingAiMessageIdRef.current;
        if (pendingId) {
          streamAIResponse(pendingId, String(data.answer));
        }
      }
    } catch (e) {
      console.error('Send error:', e);
      clearStreamTimer();
      setIsAwaitingAi(false);
      setPendingAiMessageId(null);
      pendingAiMessageIdRef.current = null;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingId
            ? { ...msg, role: 'system', text: 'Failed to send question', status: 'done' }
            : msg
        )
      );
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6 h-full flex flex-col min-h-0">
        <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 shrink-0">AI Chat</h1>
        <div ref={messagesContainerRef} className="border rounded bg-white p-2 sm:p-3 md:p-4 flex-1 min-h-0 overflow-y-auto">
          {nextCursor && (
            <div className="mb-3 flex justify-center">
              <button
                className="text-sm text-emerald-700 underline disabled:text-gray-400"
                onClick={async () => {
                  setIsLoadingOlder(true);
                  try {
                    await loadMore();
                  } finally {
                    setIsLoadingOlder(false);
                  }
                }}
                disabled={isLoadingOlder}
              >
                Load older
              </button>
            </div>
          )}
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isAI = m.role === 'ai';
            const align = isUser ? 'justify-end' : isAI ? 'justify-start' : 'justify-center';
            const bubble = isUser ? 'bg-blue-100 text-blue-900' : isAI ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-100 text-gray-800';
            return (
              <div key={m.id} className={`mb-2 sm:mb-3 flex ${align}`}>
                <div className="max-w-[95%] sm:max-w-[90%]">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                    {isUser ? 'You' : isAI ? 'AI' : 'System'} • {new Date(m.ts).toLocaleTimeString()}
                  </div>
                  {isAI && m.status === 'thinking' ? (
                    <div className={`px-3 py-2 rounded italic animate-pulse ${bubble}`}>{m.text}</div>
                  ) : isAI ? (
                    <div
                      className={`px-3 py-2 rounded ${bubble}`}
                      dangerouslySetInnerHTML={{ __html: formatAI(m.text) }}
                    />
                  ) : (
                    <div className={`px-3 py-2 rounded whitespace-pre-wrap ${bubble}`}>{m.text}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 sm:mt-3 flex gap-1 sm:gap-2 shrink-0">
          <input
            className="flex-1 border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
            placeholder="Ask the AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            disabled={isAwaitingAi}
          />
          <button
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 text-white rounded text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={send}
            disabled={isAwaitingAi || !input.trim()}
          >
            {isAwaitingAi ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
