"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { authAPI } from "@/lib/auth-api";

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<{
    questions: Array<{ questionId: number; title: string; createdAt: string }>;
    articles: Array<{ articleId: number; title: string; createdAt: string }>;
    posts: Array<{ postId: number; title: string; communityId: number; communityName?: string; createdAt: string }>;
  }>({
    questions: [],
    articles: [],
    posts: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'articles' | 'posts'>('questions');

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const data = await authAPI.getMyBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      alert('Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (type: 'question' | 'article' | 'post', id: number) => {
    try {
      if (type === 'question') {
        await authAPI.removeQuestionBookmark(id);
      } else if (type === 'article') {
        await authAPI.removeArticleBookmark(id);
      } else {
        await authAPI.removeCommunityPostBookmark(id);
      }
      // Reload bookmarks
      await loadBookmarks();
    } catch (error) {
      console.error('Error removing bookmark:', error);
      alert('Failed to remove bookmark. Please try again.');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64 animate-fadeIn" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <div className="text-lg font-medium" style={{ color: 'var(--color-tertiary)' }}>Loading your bookmarks...</div>
        </div>
      </Layout>
    );
  }

  const totalBookmarks = bookmarks.questions.length + bookmarks.articles.length + bookmarks.posts.length;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-8 animate-fadeIn" style={{ backgroundColor: 'var(--color-neutral-dark)', minHeight: '100vh' }}>
        {/* Header Section */}
        <div className="mb-8 animate-slideInRight">
          <div className="flex items-center gap-4 mb-3">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
              }}
            >
              <svg className="w-8 h-8" fill="none" stroke="var(--color-neutral)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-tertiary)' }}>
                My Bookmarks
              </h1>
              <p className="text-base mt-1" style={{ color: 'var(--color-tertiary-light)' }}>
                {totalBookmarks === 0 
                  ? "✨ Start saving content you want to revisit later"
                  : `📚 ${totalBookmarks} saved item${totalBookmarks === 1 ? '' : 's'} • Keep learning and growing`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div 
          className="rounded-2xl shadow-xl border overflow-hidden animate-fadeInUp"
          style={{ 
            backgroundColor: 'var(--color-neutral)',
            borderColor: 'var(--color-surface-dark)'
          }}
        >
          <div style={{ borderBottom: '2px solid var(--color-surface-dark)' }}>
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('questions')}
                className="group py-5 px-8 text-sm font-semibold border-b-3 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                style={{
                  borderBottomWidth: '3px',
                  borderBottomColor: activeTab === 'questions' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'questions' ? 'var(--color-primary)' : 'var(--color-tertiary-light)',
                  backgroundColor: activeTab === 'questions' ? 'var(--color-surface-light)' : 'transparent'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Questions</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: activeTab === 'questions' ? 'var(--color-primary)' : 'var(--color-surface-dark)',
                    color: activeTab === 'questions' ? 'var(--color-neutral)' : 'var(--color-tertiary-light)'
                  }}
                >
                  {bookmarks.questions.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className="group py-5 px-8 text-sm font-semibold border-b-3 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                style={{
                  borderBottomWidth: '3px',
                  borderBottomColor: activeTab === 'articles' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'articles' ? 'var(--color-primary)' : 'var(--color-tertiary-light)',
                  backgroundColor: activeTab === 'articles' ? 'var(--color-surface-light)' : 'transparent'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Articles</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: activeTab === 'articles' ? 'var(--color-primary)' : 'var(--color-surface-dark)',
                    color: activeTab === 'articles' ? 'var(--color-neutral)' : 'var(--color-tertiary-light)'
                  }}
                >
                  {bookmarks.articles.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className="group py-5 px-8 text-sm font-semibold border-b-3 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                style={{
                  borderBottomWidth: '3px',
                  borderBottomColor: activeTab === 'posts' ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === 'posts' ? 'var(--color-primary)' : 'var(--color-tertiary-light)',
                  backgroundColor: activeTab === 'posts' ? 'var(--color-surface-light)' : 'transparent'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <span>Community Posts</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: activeTab === 'posts' ? 'var(--color-primary)' : 'var(--color-surface-dark)',
                    color: activeTab === 'posts' ? 'var(--color-neutral)' : 'var(--color-tertiary-light)'
                  }}
                >
                  {bookmarks.posts.length}
                </span>
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                {bookmarks.questions.length > 0 ? (
                  bookmarks.questions.map((bookmark, index) => (
                    <div
                      key={bookmark.questionId}
                      className="group relative rounded-xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer animate-fadeInUp"
                      style={{
                        backgroundColor: 'var(--color-surface-light)',
                        borderColor: 'var(--color-surface-dark)',
                        animationDelay: `${index * 0.1}s`
                      }}
                      onClick={() => router.push(`/questions/${bookmark.questionId}`)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div 
                          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-neutral)' }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-primary"
                            style={{ color: 'var(--color-tertiary)' }}
                          >
                            {bookmark.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-tertiary-light)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Saved on {new Date(bookmark.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBookmark('question', bookmark.questionId);
                          }}
                          className="flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-secondary)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'var(--color-secondary)'
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 animate-fadeIn">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-float"
                      style={{ backgroundColor: 'var(--color-surface-light)' }}
                    >
                      <svg className="w-12 h-12" fill="none" stroke="var(--color-tertiary-light)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-tertiary)' }}>No bookmarked questions yet</h3>
                    <p style={{ color: 'var(--color-tertiary-light)' }}>Start saving questions you want to revisit later</p>
                  </div>
                )}
              </div>
            )}

            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div className="space-y-4">
                {bookmarks.articles.length > 0 ? (
                  bookmarks.articles.map((bookmark, index) => (
                    <div
                      key={bookmark.articleId}
                      className="group relative rounded-xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer animate-fadeInUp"
                      style={{
                        backgroundColor: 'var(--color-surface-light)',
                        borderColor: 'var(--color-surface-dark)',
                        animationDelay: `${index * 0.1}s`
                      }}
                      onClick={() => router.push(`/article/${bookmark.articleId}`)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div 
                          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-neutral)' }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-primary"
                            style={{ color: 'var(--color-tertiary)' }}
                          >
                            {bookmark.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-tertiary-light)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Saved on {new Date(bookmark.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBookmark('article', bookmark.articleId);
                          }}
                          className="flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-secondary)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'var(--color-secondary)'
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 animate-fadeIn">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-float"
                      style={{ backgroundColor: 'var(--color-surface-light)' }}
                    >
                      <svg className="w-12 h-12" fill="none" stroke="var(--color-tertiary-light)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-tertiary)' }}>No bookmarked articles yet</h3>
                    <p style={{ color: 'var(--color-tertiary-light)' }}>Save insightful articles to read later</p>
                  </div>
                )}
              </div>
            )}

            {/* Community Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {bookmarks.posts.length > 0 ? (
                  bookmarks.posts.map((bookmark, index) => (
                    <div
                      key={bookmark.postId}
                      className="group relative rounded-xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer animate-fadeInUp"
                      style={{
                        backgroundColor: 'var(--color-surface-light)',
                        borderColor: 'var(--color-surface-dark)',
                        animationDelay: `${index * 0.1}s`
                      }}
                      onClick={() => router.push(`/community/${bookmark.communityId}/post/${bookmark.postId}`)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div 
                          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                          style={{ 
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                            color: 'var(--color-neutral)' 
                          }}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-primary"
                            style={{ color: 'var(--color-tertiary)' }}
                          >
                            {bookmark.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: 'var(--color-tertiary-light)' }}>
                            {bookmark.communityName && (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="font-semibold">{bookmark.communityName}</span>
                              </div>
                            )}
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Saved on {new Date(bookmark.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBookmark('post', bookmark.postId);
                          }}
                          className="flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-secondary)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'var(--color-secondary)'
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 animate-fadeIn">
                    <div 
                      className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-float"
                      style={{ backgroundColor: 'var(--color-surface-light)' }}
                    >
                      <svg className="w-12 h-12" fill="none" stroke="var(--color-tertiary-light)" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-tertiary)' }}>No bookmarked posts yet</h3>
                    <p style={{ color: 'var(--color-tertiary-light)' }}>Save interesting community discussions</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
