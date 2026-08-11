"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI, Question } from "@/lib/admin-api";
import {
  MessageSquare,
  Search,
  Trash2,
  Pencil,
  User,
  Users,
  GraduationCap,
  ShieldCheck,
  CalendarDays,
  CornerDownRight,
  Award,
  Flame,
  ThumbsUp,
  ThumbsDown,
  MessageSquareQuote,
} from "lucide-react";

// request for the questions tab only
// Only questions tab remains per request
type ContentType = 'questions';

type AnswerItem = {
  id: number;
  body: string;
  author?: { name?: string };
  upvotes: number;
  downvotes: number;
  createdAt: string;
};

type QuestionDetails = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  author?: { name?: string };
  _count?: { answers?: number };
  answers?: AnswerItem[];
};

export default function ContentAdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [selectedRole, setSelectedRole] = useState<'mentor' | 'mentee'>("mentor");

  useEffect(() => {
    loadContent();
  }, [currentPage, searchTerm]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getQuestions(currentPage, 20);
      setQuestions(response.questions);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      try {
        await adminAPI.deleteQuestion(questionId);
        loadContent(); // Reload content
      } catch (err) {
        console.error("Failed to delete question:", err);
      }
    }
  };

  const openQuestionDetails = async (q: Question) => {
    setSelectedQuestion(q);
    setShowQuestionModal(true);
    setQuestionDetails(null);
    setEditMode(false);
    setDetailsError(null);
    try {
      setDetailsLoading(true);
      const details = await adminAPI.getQuestionDetails(q.id);
      setQuestionDetails(details);
      setEditTitle(details.title);
      setEditBody(details.body);
    } catch (e: any) {
      setDetailsError(e.message || 'Failed to load question');
    } finally {
      setDetailsLoading(false);
    }
  };

  const saveQuestionEdits = async () => {
    if (!selectedQuestion) return;
    try {
      const payload: { title?: string; body?: string } = {};
      if (editTitle && editTitle !== questionDetails?.title) payload.title = editTitle;
      if (editBody && editBody !== questionDetails?.body) payload.body = editBody;
      if (Object.keys(payload).length === 0) { setEditMode(false); return; }
      await adminAPI.updateQuestion(selectedQuestion.id, payload);
      // refresh details and list
      await openQuestionDetails(selectedQuestion);
      await loadContent();
      setEditMode(false);
    } catch (e) {
      alert((e as any).message || 'Failed to update question');
    }
  };

  const deleteAnswer = async (answerId: number) => {
    if (!questionDetails) return;
    if (!confirm('Delete this answer?')) return;
    try {
      await adminAPI.deleteAnswer(answerId);
      // remove locally without refetch for snappier UX
      setQuestionDetails({
        ...questionDetails,
        answers: (questionDetails.answers ?? []).filter((a: any) => a.id !== answerId),
        _count: { ...questionDetails._count, answers: Math.max(0, (questionDetails._count?.answers || 1) - 1) }
      });
    } catch (e) {
      alert((e as any).message || 'Failed to delete answer');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const countsByRole = useMemo(() => {
    const acc: Record<'mentor'|'mentee', number> = { mentor: 0, mentee: 0 };
    for (const q of questions) {
      const r = q.author?.role as 'mentor'|'mentee' | undefined;
      if (r && acc[r] !== undefined) acc[r] += 1;
    }
    return acc;
  }, [questions]);

  const getFilteredQuestions = () => {
    const lowered = searchTerm.toLowerCase();
    return questions
      .filter(q => q.author.role === selectedRole)
      .filter(q =>
        !lowered ||
        q.title.toLowerCase().includes(lowered) ||
        q.body.toLowerCase().includes(lowered)
      );
  };

  const roleStats = useMemo(() => {
  const list = questions.filter(q => q.author.role === selectedRole);
    const activeAuthors = new Set(list.map(q => q.author.id)).size;
    const totalQuestions = list.length;
    const totalAnswers = list.reduce((s, q) => s + (q._count?.answers ?? 0), 0);
    const totalReputation = list.reduce((s, q) => s + (((q as any).author?.reputation) ?? 0), 0);
    return { activeAuthors, totalQuestions, totalAnswers, totalReputation };
  }, [questions, selectedRole]);

  // articles removed

  if (loading && questions.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Banner (Matches Communities style) */}
        <div className="relative overflow-hidden bg-teal-600 rounded-xl px-8 py-6 mb-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
              <MessageSquare className="w-8 h-8" /> Q&A Management
            </h1>
            <p className="text-sm text-teal-100/90 mt-1">Manage and moderate all platform questions & answers</p>
          </div>
          <div className="hidden md:block">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-teal-500/40 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-teal-500/50 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-teal-100 font-medium">Total</p>
                    <p className="text-4xl font-extrabold leading-tight">{questions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-teal-500/30 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-teal-400/25 blur-2xl" />
          </div>
        </div>
  {/* Top Section: Tabs + Search + Stats */}
  <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm">
          <div className="flex gap-3 items-center overflow-x-auto">
            {([
                { key: 'mentor' as const, label: 'Mentors', icon: <Users className="w-4 h-4" />, count: countsByRole.mentor },
                { key: 'mentee' as const, label: 'Mentees', icon: <GraduationCap className="w-4 h-4" />, count: countsByRole.mentee },
              ]).map(t => (
              <button
                key={t.key}
                onClick={() => setSelectedRole(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${selectedRole === t.key ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                {t.icon}
                <span>{t.label} ({t.count})</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search by title or body...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-xl bg-white border-2 border-slate-200 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatTile label={`Active ${selectedRole.charAt(0).toUpperCase()+selectedRole.slice(1)}s`} value={roleStats.activeAuthors} color="emerald" icon={<ShieldCheck className="w-5 h-5" />} trend={percent(roleStats.activeAuthors, roleStats.totalQuestions)} trendLabel="of posters" />
            <StatTile label="Questions" value={roleStats.totalQuestions} color="blue" icon={<MessageSquare className="w-5 h-5" />} trend={avg(roleStats.totalAnswers, roleStats.totalQuestions)} trendLabel="answers/q" />
            <StatTile label="Answers" value={roleStats.totalAnswers} color="purple" icon={<CornerDownRight className="w-5 h-5" />} trend={percent(roleStats.totalAnswers, roleStats.totalQuestions)} trendLabel="answer rate" />
            <StatTile label="Reputation" value={roleStats.totalReputation} color="green" icon={<Award className="w-5 h-5" />} trend={avg(roleStats.totalReputation, roleStats.activeAuthors)} trendLabel="avg per author" />
          </div>
        </div>

        {/* Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">

          {/* Content */}
          <div className="p-6">
              <div className="space-y-4">
                {getFilteredQuestions().length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Try adjusting your search criteria" : "No questions have been posted yet"}
                    </p>
                  </div>
                ) : (
                  getFilteredQuestions().map((question) => (
                    <div key={question.id} className="group relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                        <div className="absolute -top-10 -right-10 h-32 w-32 bg-emerald-100/50 rounded-full blur-xl" />
                      </div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700 ring-1 ring-emerald-200">{question.author.role === 'mentor' ? <Users className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />} {question.author.role}</span>
                            {question._count.answers > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200"><CornerDownRight className="w-3.5 h-3.5" /> {question._count.answers} answers</span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1" title={question.title}>{question.title}</h3>
                          <p className="text-sm text-gray-700/90 mb-3 line-clamp-2">{question.body}</p>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
                            <IconText icon={<User className="w-3.5 h-3.5" />} text={question.author.name} />
                            <IconText icon={<CalendarDays className="w-3.5 h-3.5" />} text={formatDate(question.createdAt)} />
                            <IconText icon={<Flame className="w-3.5 h-3.5" />} text={`${question._count.answers + 1} activity`} />
                          </div>
                        </div>
                        <div className="flex items-stretch gap-2 ml-4">
                          <ActionIconButton vertical onClick={() => openQuestionDetails(question)} label="Details" className="text-emerald-600 hover:bg-emerald-50"><MessageSquare className="w-5 h-5" /></ActionIconButton>
                          <ActionIconButton vertical onClick={() => { setEditMode(true); setEditTitle(question.title); setEditBody(question.body); openQuestionDetails(question); }} label="Edit" className="text-cyan-600 hover:bg-cyan-50"><Pencil className="w-5 h-5" /></ActionIconButton>
                          <ActionIconButton vertical onClick={() => handleDeleteQuestion(question.id)} label="Delete" className="text-red-600 hover:bg-red-50"><Trash2 className="w-5 h-5" /></ActionIconButton>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 rounded-b-xl bg-white">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

        {/* Question Detail Modal */}
        {showQuestionModal && selectedQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-900/85 to-cyan-900/90 backdrop-blur-sm" />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-[1px] bg-gradient-to-br from-emerald-300/60 via-cyan-300/50 to-emerald-300/60 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.45)]">
              <div className="rounded-2xl bg-gradient-to-br from-white/92 to-white/82 backdrop-blur-xl border border-emerald-300/60">
              <div className="px-8 pt-6 pb-5 border-b border-emerald-200/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-black dark:text-white">Question Details</h3>
                    {selectedQuestion && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          {selectedQuestion.author.role === 'mentor' ? <Users className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />} {selectedQuestion.author.role}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 ring-1 ring-blue-200"><MessageSquare className="w-3.5 h-3.5" /> {(questionDetails?._count?.answers ?? 0)} answers</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 ring-1 ring-slate-200"><CalendarDays className="w-3.5 h-3.5" /> {selectedQuestion ? new Date(selectedQuestion.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowQuestionModal(false)} className="rounded-lg p-2 text-emerald-600 hover:text-emerald-700">✕</button>
                </div>
              </div>
              <div className="px-8 py-6 space-y-8">
                {detailsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                  </div>
                  
                )}
                {detailsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{detailsError}</div>
                )}
                {(!detailsLoading && !detailsError && questionDetails) && (
                  <>
                    {/* Overview + Edit */}
                    <div className="space-y-3">
                      {editMode ? (
                        <div className="space-y-3">
                          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-emerald-300/60 rounded-lg bg-white/85 focus:outline-none focus:ring-2 focus:ring-emerald-500/80" />
                          <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={6} className="w-full px-3 py-2 border border-emerald-300/60 rounded-lg bg-white/85 focus:outline-none focus:ring-2 focus:ring-emerald-500/80" />
                        </div>
                      ) : (
                        <>
                          <h4 className="text-xl font-semibold text-gray-900 tracking-tight flex items-center gap-2"><MessageSquareQuote className="w-5 h-5 text-emerald-600" /> {questionDetails.title}</h4>
                          <p className="text-[15px] text-gray-800/95 leading-relaxed whitespace-pre-wrap bg-gradient-to-br from-white/80 to-white/60 border border-emerald-200/50 rounded-lg p-4">{questionDetails.body}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            {/* Show author only; date and answers are already displayed in the header chips */}
                            <IconText icon={<User className="w-3.5 h-3.5" />} text={questionDetails.author?.name || 'Unknown'} />
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-end text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          {editMode ? (
                            <>
                              <button onClick={saveQuestionEdits} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-[0_8px_24px_-8px_rgba(6,182,212,0.4)]">Save</button>
                              <button onClick={() => { setEditMode(false); setEditTitle(questionDetails.title); setEditBody(questionDetails.body); }} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/75 border border-emerald-300/60 text-emerald-700 hover:bg-emerald-50/80">Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => setEditMode(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/75 border border-cyan-300/60 text-cyan-700 hover:bg-cyan-50/80">Edit</button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Answer list with the delete functionalities*/}
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold tracking-wide text-emerald-700/90 uppercase">Answers ({questionDetails._count?.answers ?? 0})</h5>
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {(questionDetails.answers ?? []).length > 0 ? (questionDetails.answers ?? []).map((a: any) => (
                          <div key={a.id} className="rounded-lg p-3 bg-gradient-to-br from-white/92 to-white/70 ring-1 ring-emerald-300/60 shadow-[0_12px_30px_-12px_rgba(6,182,212,0.25)]">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 w-full">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 mb-1">
                                  <div className="flex items-center gap-3">
                                    <IconText icon={<User className="w-3.5 h-3.5" />} text={a.author?.name || 'Unknown'} />
                                    <IconText icon={<CalendarDays className="w-3.5 h-3.5" />} text={new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1 text-emerald-600"><ThumbsUp className="w-3.5 h-3.5" /> {a.upvotes}</span>
                                    <span className="inline-flex items-center gap-1 text-rose-600"><ThumbsDown className="w-3.5 h-3.5" /> {a.downvotes}</span>
                                  </div>
                                </div>
                                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                              </div>
                              <button onClick={() => deleteAnswer(a.id)} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md" title="Delete Answer">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )) : (
                          <p className="text-xs text-gray-500">No answers yet.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200/60">
                  <button onClick={() => setShowQuestionModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-white/75 border border-emerald-300/60 text-emerald-700 hover:bg-emerald-50/80">Close</button>
                </div>
              </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatTile({ label, value, color = 'emerald', icon, trend, trendLabel }: Readonly<{ label: string; value: number | string; color?: 'emerald'|'green'|'blue'|'purple'|'amber'; icon?: ReactNode; trend?: string; trendLabel?: string }>) {
  const palette: Record<string, { ring: string; text: string; bg: string }> = {
    emerald: { ring: 'ring-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    green:   { ring: 'ring-green-100',   text: 'text-green-600',   bg: 'bg-green-50' },
    blue:    { ring: 'ring-blue-100',    text: 'text-blue-600',    bg: 'bg-blue-50' },
    purple:  { ring: 'ring-purple-100',  text: 'text-purple-600',  bg: 'bg-purple-50' },
    amber:   { ring: 'ring-amber-100',   text: 'text-amber-600',   bg: 'bg-amber-50' },
  };
  const c = palette[color] || palette.emerald;
  return (
    <div className={`relative rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition`}>      
      <div className={`shrink-0 h-11 w-11 ${c.bg} ${c.text} ${c.ring} ring-4 rounded-lg flex items-center justify-center shadow-inner`}>{icon ?? <span className="font-bold">{String(label).charAt(0)}</span>}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
      {trend && trendLabel && (
        <div className="text-right">
          <p className="text-xs font-medium text-slate-400">{trendLabel}</p>
          <p className="text-sm font-semibold text-slate-700">{trend}</p>
        </div>
      )}
    </div>
  );
}

function IconText({ icon, text }: Readonly<{ icon: ReactNode; text: string | number }>) {
  return (
    <span className="inline-flex items-center gap-1"><span className="text-slate-400">{icon}</span><span className="truncate max-w-[140px]">{text}</span></span>
  );
}

function ActionIconButton({ onClick, children, label, className, vertical = false }: Readonly<{ onClick: () => void; children: ReactNode; label: string; className?: string; vertical?: boolean }>) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`group relative flex ${vertical ? 'flex-col items-center justify-center w-16 py-2' : 'items-center'} gap-1 p-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600/40 ${className}`}
    >
      {children}
      {vertical && <span className="text-[11px] font-medium text-slate-600 group-hover:text-current mt-0.5 select-none">{label}</span>}
    </button>
  );
}

// helpers for trend numbers
function percent(n: number, d: number) {
  if (!d) {
    return '0%';
  }
  return `${((n / d) * 100).toFixed(0)}%`;
}
function avg(total: number, count: number) {
  if (!count) {
    return '0';
  }
  return (total / count).toFixed(1);
}
