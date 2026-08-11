"use client";

import { Fragment } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { X, User, MessageSquare, FileText, Users as UsersIcon, Star, Sparkles, UserCircle2, BadgeCheck, Hash, Bookmark, ThumbsUp, ThumbsDown } from "lucide-react";
import type { User as AdminUser, Question, Article, Community } from "@/lib/admin-api";

const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
};

// Reusable metric chip
function MetricChip({ label, value, icon }: Readonly<{ label: string; value: React.ReactNode; icon?: React.ReactNode }>) {
  return (
    <div
      className="relative rounded-lg px-3 py-2 bg-gradient-to-br from-emerald-50 to-cyan-50 ring-1 ring-emerald-200/60 shadow-sm"
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 flex items-center gap-1">{icon}{label}</div>
      <div className="mt-0.5 text-emerald-700 font-medium text-sm truncate" title={typeof value === 'string' || typeof value === 'number' ? String(value) : label}>
        {value ?? 0}
      </div>
      {/* static chip, no hover overlay */}
    </div>
  );
}

type BaseModalProps<T> = Readonly<{ isOpen: boolean; onClose: () => void; data: T[] | null }>;

function ModalShell({ isOpen, onClose, title, icon, children }: Readonly<{ isOpen: boolean; onClose: () => void; title: string; icon?: React.ComponentType<any>; children: React.ReactNode }>) {
  const Icon = icon;
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Ambient gradient backdrop */}
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-900/85 to-cyan-900/90 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-5xl transform overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-emerald-300/60 via-cyan-300/50 to-emerald-300/60 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.45)] transition-all">
                <div className="rounded-2xl bg-gradient-to-br from-white/92 to-white/82 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-xl border border-emerald-300/60">
                  {/* Header */}
                  <div className="relative px-8 pt-6 pb-5">
                    <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-[radial-gradient(circle_at_top_left,theme(colors.emerald.300),transparent_60%)]" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-inner">
                          {Icon ? <Icon className="w-6 h-6 text-white" /> : null}
                        </div>
                        <DialogTitle as="h3" className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                          {title}
                        </DialogTitle>
                      </div>
                      <button
                        onClick={onClose}
                        className="group relative inline-flex items-center justify-center rounded-lg p-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
                        aria-label="Close modal"
                      >
                        <X className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700" />
                        <span className="absolute -inset-2 rounded-lg bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    </div>
                    {/* Decorative divider */}
                    <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                  </div>

                  <div className="px-8 pb-8">
                    <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-300/40 hover:scrollbar-thumb-emerald-400/60">
                      {children}
                    </div>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AdminModals({
  isUsersModalOpen,
  setIsUsersModalOpen,
  usersData,
  isQuestionsModalOpen,
  setIsQuestionsModalOpen,
  questionsData,
  isArticlesModalOpen,
  setIsArticlesModalOpen,
  articlesData,
  isCommunitiesModalOpen,
  setIsCommunitiesModalOpen,
  communitiesData
}: Readonly<{
  isUsersModalOpen: boolean;
  setIsUsersModalOpen: (open: boolean) => void;
  usersData: AdminUser[] | null;
  isQuestionsModalOpen: boolean;
  setIsQuestionsModalOpen: (open: boolean) => void;
  questionsData: Question[] | null;
  isArticlesModalOpen: boolean;
  setIsArticlesModalOpen: (open: boolean) => void;
  articlesData: Article[] | null;
  isCommunitiesModalOpen: boolean;
  setIsCommunitiesModalOpen: (open: boolean) => void;
  communitiesData: Community[] | null;
}>) {
  return (
    <>
      <ModalShell isOpen={isUsersModalOpen} onClose={() => setIsUsersModalOpen(false)} title="Users" icon={User}>
        {usersData && usersData.length > 0 ? (
          <div className="space-y-4">
            {usersData.map((u: any) => {
              const counts = u._count || {};
              return (
                <div
                  key={u.id}
                  className="relative rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_-10px_rgba(16,185,129,0.25)]"
                >
                  {/* no hover overlay */}
                  <div className="flex items-center justify-between mb-4 relative">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-inner">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 tracking-tight">{u.name}</h3>
                        <p className="text-xs text-gray-500">{u.email}</p>
                        <span className="inline-flex items-center mt-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/60">{u.role}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">Joined {formatDate(u.createdAt)}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                    {[
                      ['Questions', counts.questions, <MessageSquare key="i1" className="w-3.5 h-3.5" />],
                      ['Answers', counts.answers, <MessageSquare key="i2" className="w-3.5 h-3.5" />],
                      ['Articles', counts.articles, <FileText key="i3" className="w-3.5 h-3.5" />],
                      ['Mentor Conn.', counts.mentorConnections, <UsersIcon key="i4" className="w-3.5 h-3.5" />],
                      ['Mentee Conn.', counts.menteeConnections, <UsersIcon key="i5" className="w-3.5 h-3.5" />],
                      ['Communities', counts.communityMemberships, <UsersIcon key="i6" className="w-3.5 h-3.5" />],
                      ['Posts', counts.communityPosts, <MessageSquare key="i7" className="w-3.5 h-3.5" />]
                    ].map(([label, value, icon]) => (
                      <MetricChip key={label as string} label={label as string} value={value as React.ReactNode} icon={icon as React.ReactNode} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </ModalShell>

      <ModalShell isOpen={isQuestionsModalOpen} onClose={() => setIsQuestionsModalOpen(false)} title="Questions" icon={MessageSquare}>
        {questionsData && questionsData.length > 0 ? (
          <div className="space-y-4">
            {questionsData.map((q: any) => (
              <div
                key={q.id}
                className="relative rounded-2xl border border-teal-200/50 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_-10px_rgba(13,148,136,0.25)]"
              >
                {/* no hover overlay */}
                <div className="flex justify-between mb-2 relative">
                  <h3 className="font-medium text-gray-900 tracking-tight line-clamp-1">{q.title || 'Untitled question'}</h3>
                  <span className="text-[11px] text-gray-500 font-medium">{formatDate(q.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{q.body}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  <MetricChip label="Answers" value={q._count?.answers ?? 0} icon={<MessageSquare className="w-3.5 h-3.5" />} />
                  <MetricChip label="Author" value={q.author?.name || 'Unknown'} icon={<User className="w-3.5 h-3.5" />} />
                  <MetricChip label="Author Role" value={q.author?.role || '-'} icon={<BadgeCheck className="w-3.5 h-3.5" />} />
                  <MetricChip label="Bookmarks" value={q._count?.bookmarks ?? 0} icon={<Bookmark className="w-3.5 h-3.5" />} />
                  <MetricChip label="Tags" value={q._count?.tags ?? 0} icon={<Hash className="w-3.5 h-3.5" />} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No questions found</p>
          </div>
        )}
      </ModalShell>

      <ModalShell isOpen={isArticlesModalOpen} onClose={() => setIsArticlesModalOpen(false)} title="Articles" icon={FileText}>
        {articlesData && articlesData.length > 0 ? (
          <div className="space-y-4">
            {articlesData.map((a: any) => (
              <div
                key={a.id}
                className="relative rounded-2xl border border-teal-200/50 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_-10px_rgba(13,148,136,0.25)]"
              >
                {/* no hover overlay */}
                <div className="flex justify-between mb-2 relative">
                  <h3 className="font-medium text-gray-900 tracking-tight line-clamp-1">{a.title}</h3>
                  <span className="text-[11px] text-gray-500 font-medium">{formatDate(a.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{a.content}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <MetricChip label="Upvotes" value={a.upvotes ?? 0} icon={<ThumbsUp className="w-3.5 h-3.5" />} />
                  <MetricChip label="Downvotes" value={a.downvotes ?? 0} icon={<ThumbsDown className="w-3.5 h-3.5" />} />
                  <MetricChip label="Author" value={a.author?.name || '-'} icon={<User className="w-3.5 h-3.5" />} />
                  <MetricChip label="Author Role" value={a.author?.role || '-'} icon={<BadgeCheck className="w-3.5 h-3.5" />} />
                  <MetricChip label="Bookmarks" value={a._count?.bookmarks ?? 0} icon={<Bookmark className="w-3.5 h-3.5" />} />
                  <MetricChip label="Tags" value={a._count?.tags ?? 0} icon={<Hash className="w-3.5 h-3.5" />} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No articles found</p>
          </div>
        )}
      </ModalShell>

      <ModalShell isOpen={isCommunitiesModalOpen} onClose={() => setIsCommunitiesModalOpen(false)} title="Communities" icon={UsersIcon}>
        {communitiesData && communitiesData.length > 0 ? (
          <div className="space-y-5">
            {communitiesData.map((c: any) => (
              <div
                key={c.id}
                className="relative rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl p-6 shadow-[0_8px_30px_-10px_rgba(16,185,129,0.25)]"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-inner">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                        {c.name}
                        {(c._count?.members ?? 0) >= 10 && (
                          <span className="inline-flex items-center" aria-label="Popular community" title="Popular community">
                            <BadgeCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <UserCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate max-w-[200px]" title={c.createdBy?.name || '-'}>{c.createdBy?.name || '-'}</span>
                        <span className="mx-1">•</span>
                        <span>{formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Explore CTA removed per request */}
                </div>
                {c.description && (
                  <p className="text-sm text-gray-700/90 mb-4 leading-relaxed line-clamp-2">
                    {c.description}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="relative rounded-xl px-3 py-2 bg-gradient-to-br from-emerald-50 to-cyan-50 ring-1 ring-emerald-200/60 shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 flex items-center gap-1"><UsersIcon className="w-3.5 h-3.5" /> Members</div>
                    <div className="mt-0.5 text-emerald-700 font-semibold text-base">{c._count?.members ?? 0}</div>
                  </div>
                  <div className="relative rounded-xl px-3 py-2 bg-gradient-to-br from-emerald-50 to-cyan-50 ring-1 ring-emerald-200/60 shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Posts</div>
                    <div className="mt-0.5 text-emerald-700 font-semibold text-base">{c._count?.posts ?? 0}</div>
                  </div>
                  <div className="relative rounded-xl px-3 py-2 bg-gradient-to-br from-emerald-50 to-cyan-50 ring-1 ring-emerald-200/60 shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Creator</div>
                    <div className="mt-0.5 text-emerald-700 font-semibold text-base truncate" title={c.createdBy?.name || '-'}>{c.createdBy?.name || '-'}</div>
                  </div>
                  <div className="relative rounded-xl px-3 py-2 bg-gradient-to-br from-emerald-50 to-cyan-50 ring-1 ring-emerald-200/60 shadow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> Skills</div>
                    <div className="mt-0.5 text-emerald-700 font-semibold text-base">{(c.skills || []).length}</div>
                  </div>
                </div>
                {(c.skills && c.skills.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.skills.slice(0, 6).map((s: string, i: number) => (
                      <span key={s + i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-emerald-800 bg-emerald-50 ring-1 ring-inset ring-emerald-200/60">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {s}
                      </span>
                    ))}
                    {c.skills.length > 6 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium text-gray-600 bg-gray-50 ring-1 ring-inset ring-gray-200/60">+{c.skills.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No communities found</p>
          </div>
        )}
      </ModalShell>
    </>
  );
}
