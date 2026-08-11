'use client';

import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useDiscussions, type DiscussionMessage } from '@/lib/useDiscussions';
import { useEffect, useRef, useState } from 'react';
import { authAPI } from '@/lib/auth-api';

export default function CommunityDiscussionsPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = parseInt(params.id as string);

  const [isMember, setIsMember] = useState(false);
  const [communityName, setCommunityName] = useState<string>('');
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const { messages, sendMessage, connect, disconnect, connected } = useDiscussions();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!communityId) return;
    // verify membership
    authAPI.checkCommunityMembership(communityId)
      .then(res => setIsMember(res.isMember))
      .catch(() => setIsMember(false));
    // fetch community name
    authAPI.getCommunity(communityId)
      .then(c => setCommunityName(c.name))
      .catch(() => setCommunityName(''));
    // fetch current user id
    authAPI.getCurrentUser()
      .then(u => setMyUserId(u.user.id))
      .catch(() => setMyUserId(null));
  }, [communityId]);

  useEffect(() => {
    if (isMember && communityId) {
      connect(communityId);
      return () => disconnect();
    }
  }, [isMember, communityId, connect, disconnect]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isMember) {
    return (
      <Layout>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div 
          className="min-h-screen"
          style={{ background: 'var(--color-neutral-dark)' }}
        >
          <div 
            className="mx-auto max-w-6xl p-6 h-full"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
          <button 
            onClick={() => router.push(`/community/${communityId}`)} 
            className="mb-4 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-surface-dark)',
              color: 'var(--color-tertiary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)';
              e.currentTarget.style.color = 'var(--color-tertiary)';
            }}
          >
            ← Back
          </button>
          <div 
            className="p-6 rounded-xl flex items-center gap-3"
            style={{
              background: 'var(--color-surface-light)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              animation: 'slideDown 0.5s ease-out'
            }}
          >
            <span className="text-2xl">🔒</span>
            <span className="font-medium">Join this community to access discussions.</span>
          </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div 
        className="min-h-screen"
        style={{ background: 'var(--color-neutral-dark)' }}
      >
        <div 
          className="mx-auto max-w-6xl p-6 h-full flex flex-col min-h-0"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
        <div 
          className="flex items-center justify-between mb-4 shrink-0 p-4 rounded-xl"
          style={{ 
            background: 'var(--color-neutral)',
            border: '1px solid var(--color-surface-dark)',
            animation: 'slideDown 0.5s ease-out'
          }}
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/community/${communityId}`)} 
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-surface-dark)',
                color: 'var(--color-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-surface)';
                e.currentTarget.style.color = 'var(--color-tertiary)';
              }}
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <h1 
                className="text-xl font-semibold"
                style={{ color: 'var(--color-tertiary)' }}
              >
                {communityName || 'Community Discussions'}
              </h1>
            </div>
          </div>
          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
            style={{
              background: connected ? 'var(--color-surface-light)' : 'var(--color-surface)',
              color: connected ? 'var(--color-primary)' : 'var(--color-tertiary-light)',
            }}
          >
            <span className={connected ? '🟢' : '🔴'}></span>
            {connected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        <div 
          className="rounded-xl flex-1 min-h-0 flex flex-col"
          style={{ 
            background: 'var(--color-neutral)',
            border: '1px solid var(--color-surface-dark)',
            animation: 'fadeInUp 0.6s ease-out'
          }}
        >
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
            {messages
              .filter((m: DiscussionMessage) => m.type === 'community.message' && !!m.content)
              .map((m: DiscussionMessage, i: number) => {
                const mine = !!myUserId && m.senderId === myUserId;
                const name = mine ? 'You' : (m.senderName || `${m.senderRole} #${m.senderId}`);
                return (
                  <div key={i} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div 
                      className="text-xs mb-1 font-medium"
                      style={{ color: mine ? 'var(--color-primary)' : 'var(--color-tertiary-light)' }}
                    >
                      {name}
                    </div>
                    <div
                      className="rounded-lg px-4 py-2 inline-block max-w-[90%] whitespace-pre-wrap shadow-sm"
                      style={{
                        background: mine ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: mine ? 'white' : 'var(--color-tertiary)',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            <div ref={bottomRef} />
          </div>
          <div 
            className="p-4 flex gap-2 shrink-0"
            style={{ 
              borderTop: '1px solid var(--color-surface-dark)',
            }}
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { sendMessage(message); setMessage(''); } }}
              placeholder="Type a message..."
              className="flex-1 rounded-lg px-4 py-3 focus:outline-none transition-all duration-200"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-surface-dark)',
                color: 'var(--color-tertiary)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-primary)';
                e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-surface-dark)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => { sendMessage(message); setMessage(''); }}
              disabled={!message.trim()}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'var(--color-secondary)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📤 Send
            </button>
          </div>
        </div>
        </div>
      </div>
    </Layout>
  );
}
