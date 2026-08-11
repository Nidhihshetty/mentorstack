"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { authAPI } from './auth-api';
import { API_URL } from './api-config';

type AiItem = { id: number; prompt: string; response: string; timestamp: string };

export function useAiHistory(initialLimit = 50) {
  const [items, setItems] = useState<AiItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useMemo(() => (typeof window !== 'undefined' ? authAPI.getToken() : null), []);

  const fetchPage = useCallback(async (cursor?: number) => {
    if (!token) return { items: [] as AiItem[], nextCursor: null as number | null };
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(initialLimit));
      if (cursor) params.set('cursor', String(cursor));
      const res = await fetch(`${API_URL}/ai/history?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load AI history');
      const data = await res.json();
      return { items: (data.items || []) as AiItem[], nextCursor: data.nextCursor ?? null };
    } catch (e: any) {
      setError(e?.message || 'Failed to load AI history');
      return { items: [], nextCursor: null };
    } finally {
      setLoading(false);
    }
  }, [initialLimit, token]);

  const loadInitial = useCallback(async () => {
    const page = await fetchPage();
    setItems(page.items);
    setNextCursor(page.nextCursor);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const page = await fetchPage(nextCursor);
    setItems((prev) => [...prev, ...page.items]);
    setNextCursor(page.nextCursor);
  }, [fetchPage, nextCursor]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  return { items, nextCursor, loading, error, loadMore, reload: loadInitial };
}
