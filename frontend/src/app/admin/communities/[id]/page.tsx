"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI } from "@/lib/admin-api";
import { Users, ArrowLeft, MessageSquare, Hash, Star, Trash2, User, Mail, Award, TrendingUp, BarChart3, CalendarDays } from "lucide-react";

type CommunityDetails = {
  id: number;
  name: string;
  description: string;
  skills?: string[];
  createdAt: string;
  createdBy?: { id: number; name: string; email: string; reputation?: number };
  _count?: { members: number; posts: number };
  members?: Array<{ id: number; userRole: string; joinedAt: string; user: { id: number; name: string; email: string; reputation?: number } }>;
  posts?: Array<{ id: number; title: string; content: string; createdAt: string; upvotes: number; downvotes: number; author?: { id: number; name: string; email: string } }>;
  analytics?: {
    memberGrowth?: Array<{ month: string; members: number }>;
    postActivity?: Array<{ date: string; posts: number }>;
    topContributors?: Array<{ userRole: string; joinedAt: string; user: { id: number; name: string; email: string; reputation: number; _count: { communityPosts: number; answers: number } } }>;
  };
};

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const communityId = Number(idParam);
  const [data, setData] = useState<CommunityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletingMemberIds, setDeletingMemberIds] = useState<Set<number>>(new Set());
  const [deletingPostIds, setDeletingPostIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!communityId || Number.isNaN(communityId)) return;
    (async () => {
      try {
        setLoading(true);
        const d = await adminAPI.getCommunityDetails(communityId);
        setData(d);
      } catch (e: any) {
        setError(e.message || "Failed to load community details");
      } finally {
        setLoading(false);
      }
    })();
  }, [communityId]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm("Delete this community? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await adminAPI.deleteCommunity(data.id);
      router.push('/admin/communities');
    } catch (e) {
      console.error("Failed to delete community", e);
      setError("Failed to delete community");
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!data) return;
    if (!confirm('Remove this member from the community?')) return;
    try {
      setDeletingMemberIds(prev => new Set(prev).add(memberId));
      await adminAPI.deleteCommunityMember(data.id, memberId);
      setData(prev => {
        if (!prev) return prev;
        const nextMembers = (prev.members || []).filter(m => m.id !== memberId);
        const nextCount = Math.max(0, (prev._count?.members ?? nextMembers.length) - 1);
        return {
          ...prev,
          members: nextMembers,
          _count: { ...(prev._count || { members: 0, posts: 0 }), members: nextCount }
        };
      });
    } catch (e) {
      console.error('Failed to remove member', e);
      setError('Failed to remove member');
    } finally {
      setDeletingMemberIds(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const handleRemovePost = async (postId: number) => {
    if (!data) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      setDeletingPostIds(prev => new Set(prev).add(postId));
      await adminAPI.deletePost(postId);
      setData(prev => {
        if (!prev) return prev;
        const nextPosts = (prev.posts || []).filter(p => p.id !== postId);
        const nextCount = Math.max(0, (prev._count?.posts ?? nextPosts.length) - 1);
        return {
          ...prev,
          posts: nextPosts,
          _count: { ...(prev._count || { members: 0, posts: 0 }), posts: nextCount }
        };
      });
    } catch (e) {
      console.error('Failed to delete post', e);
      setError('Failed to delete post');
    } finally {
      setDeletingPostIds(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/communities')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Community Details</h1>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-72">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {!loading && !error && !data && (
          <div className="text-center text-slate-500 py-20">Community not found.</div>
        )}

        {data && (
          <div className="space-y-10">
            {/* Hero + Overview */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Gradient hero header */}
              <div className="relative bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 ring-4 ring-white/20 flex items-center justify-center text-white shadow-lg">
                    <Users className="w-9 h-9" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold truncate" title={data.name}>{data.name}</h2>
                    <p className="text-xs text-teal-100 mt-1">Created {formatDate(data.createdAt)} • ID {data.id}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 ring-2 ring-red-100 shadow-sm"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Description + Stats */}
              <div className="p-6">
                <p className="text-sm text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{data.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                  <StatCard label="Members" value={data._count?.members ?? 0} color="emerald" icon={<Users className="w-4 h-4" />} />
                  <StatCard label="Posts" value={data._count?.posts ?? 0} color="blue" icon={<MessageSquare className="w-4 h-4" />} />
                  <StatCard label="# Skills" value={(data.skills || []).length} color="purple" icon={<Hash className="w-4 h-4" />} />
                  <StatCard label="Creator Rep" value={data.createdBy?.reputation ?? '—'} color="amber" icon={<Star className="w-4 h-4" />} />
                </div>
                {data.skills && data.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {data.skills.map((s, i) => (
                      <span key={s + i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/70 transition">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Members & Posts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase mb-4 inline-flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600" /> Recent Members</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {data.members && data.members.length > 0 ? data.members.map(m => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                          {m.user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-800 truncate flex items-center gap-1" title={m.user.name}><User className="w-3.5 h-3.5 text-slate-400" />{m.user.name}</p>
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1" title={m.user.email}><Mail className="w-3 h-3 text-slate-400" />{m.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-medium">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{m.userRole}</span>
                        <span className="text-slate-500 flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />Rep {m.user.reputation}</span>
                        <span className="text-slate-400 inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={deletingMemberIds.has(m.id)}
                          className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-500">No members found.</p>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase mb-4 inline-flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" /> Recent Posts</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {data.posts && data.posts.length > 0 ? data.posts.map(p => (
                    <div key={p.id} className="rounded-lg p-3 bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h6 className="text-[13px] font-semibold text-slate-800 line-clamp-1" title={p.title}>{p.title}</h6>
                        <span className="text-[10px] text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mb-1">{p.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>↑ {p.upvotes} • ↓ {p.downvotes}</span>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[140px]" title={p.author?.name || 'Unknown'}>{p.author?.name || 'Unknown'}</span>
                          <button
                            onClick={() => handleRemovePost(p.id)}
                            disabled={deletingPostIds.has(p.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                            title="Delete post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-500">No posts yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Analytics */}
              <div className="space-y-6">
              <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase inline-flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Growth */}
                <div className="rounded-xl p-4 bg-white border border-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/90 mb-3 inline-flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Member Growth (6 mo)</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {data.analytics?.memberGrowth?.length ? data.analytics.memberGrowth.map(g => (
                      <div key={g.month} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">{g.month}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-28 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${Math.min(100, (g.members / ((data._count?.members || g.members) || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-slate-700 font-medium">{g.members}</span>
                        </div>
                      </div>
                    )) : (<p className="text-xs text-slate-400">No growth data.</p>)}
                  </div>
                </div>
                {/* Post Activity */}
                <div className="rounded-xl p-4 bg-white border border-slate-200">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/90 mb-3 inline-flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Post Activity (30 days)</p>
                  <div className="grid grid-cols-5 gap-1 text-[10px] max-h-56 overflow-y-auto pr-1">
                    {data.analytics?.postActivity?.length ? data.analytics.postActivity.map(d => (
                      <div key={d.date} className="flex flex-col items-center gap-1 p-1 rounded bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition">
                        <div className="h-6 w-full rounded-sm bg-slate-200 overflow-hidden flex items-end">
                          <div className="w-full bg-gradient-to-t from-cyan-500 to-sky-400 transition-all duration-500" style={{ height: `${Math.min(100, (d.posts / 5) * 100)}%` }} />
                        </div>
                        <span className="font-medium text-slate-700">{d.posts}</span>
                        <span className="text-slate-500 truncate" title={d.date}>{d.date.slice(5)}</span>
                      </div>
                    )) : (<p className="text-xs text-slate-400 col-span-5">No activity data.</p>)}
                  </div>
                </div>
              </div>
              {/* Top Contributors */}
              <div className="rounded-xl p-4 bg-white border border-slate-200">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 mb-3 inline-flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Top Contributors</p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {data.analytics?.topContributors?.length ? data.analytics.topContributors.map(c => (
                    <div key={c.user.id} className="flex items-center justify-between rounded-md px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-white hover:shadow-sm transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                          {c.user.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-slate-800 truncate" title={c.user.name}>{c.user.name}</p>
                          <p className="text-[10px] text-slate-500 truncate" title={c.user.email}>{c.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-medium">
                        <span className="text-slate-700">Rep {c.user.reputation}</span>
                        <span className="text-slate-600">Posts {c.user._count.communityPosts}</span>
                        <span className="text-slate-500">Answers {c.user._count.answers}</span>
                      </div>
                    </div>
                  )) : (<p className="text-xs text-slate-400">No contributor data.</p>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, icon, color = 'emerald' }: { label: string; value: string | number; icon?: React.ReactNode; color?: 'emerald' | 'blue' | 'purple' | 'amber' }) {
  const palette: Record<string, { ring: string; text: string; bg: string }> = {
    emerald: { ring: 'ring-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    blue:    { ring: 'ring-blue-100',    text: 'text-blue-600',    bg: 'bg-blue-50' },
    purple:  { ring: 'ring-purple-100',  text: 'text-purple-600',  bg: 'bg-purple-50' },
    amber:   { ring: 'ring-amber-100',   text: 'text-amber-600',   bg: 'bg-amber-50' },
  };
  const c = palette[color] || palette.emerald;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 shadow-sm">
      <div className={`shrink-0 h-9 w-9 ${c.bg} ${c.text} ${c.ring} ring-4 rounded-lg flex items-center justify-center`}>{icon}</div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</div>
        <div className="mt-0.5 text-slate-800 font-bold text-lg" title={String(value)}>
          {value}
        </div>
      </div>
    </div>
  );
}
