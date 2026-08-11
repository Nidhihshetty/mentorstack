'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { authAPI, Article, Question } from '@/lib/auth-api';
import { 
  BookOpen, 
  MessageCircle, 
  Users, 
  ArrowLeft, 
  Calendar,
  User,
  MessageSquare,
  ExternalLink,
  Hash,
  UsersRound
} from 'lucide-react';

interface Community {
  id: number;
  name: string;
  description: string;
  skills: string[];
  creatorName: string;
  memberCount: number;
  postCount: number;
  createdAt: string;
}

interface TagContentData {
  tagName: string;
  stats: {
    totalArticles: number;
    totalQuestions: number;
    totalCommunities: number;
    totalContent: number;
  };
  articles: Article[];
  questions: Question[];
  communities: Community[];
}

export default function TagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tagName = params.tag as string;
  
  const [data, setData] = useState<TagContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'questions' | 'communities'>('all');

  useEffect(() => {
    const loadTagContent = async () => {
      if (!tagName) return;
      
      try {
        setLoading(true);
        const tagData = await authAPI.getTagContent(decodeURIComponent(tagName));
        console.log('📦 Received tag data:', tagData);
        console.log('🏘️ Communities:', tagData.communities);
        setData(tagData);
        setError(null);
      } catch (error) {
        console.error('Error loading tag content:', error);
        setError('Failed to load content for this tag');
      } finally {
        setLoading(false);
      }
    };

    loadTagContent();
  }, [tagName]);

  const handleBackToTags = () => {
    router.push('/tags');
  };

  const getTabContent = () => {
    if (!data) return { articles: [], questions: [], communities: [] };
    
    switch (activeTab) {
      case 'articles':
        return { articles: data.articles, questions: [], communities: [] };
      case 'questions':
        return { articles: [], questions: data.questions, communities: [] };
      case 'communities':
        return { articles: [], questions: [], communities: data.communities };
      default:
        return { articles: data.articles, questions: data.questions, communities: data.communities };
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-slate-600">Loading {decodeURIComponent(tagName)} content...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Error Loading Content</h3>
              <p className="text-slate-500 mb-4">{error}</p>
              <button 
                onClick={handleBackToTags}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                Back to Tags
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  const { articles, questions, communities } = getTabContent();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Navigation */}
            <div className="mb-6">
              <button
                onClick={handleBackToTags}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to All Tags
              </button>
            </div>

            {/* Tag Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Hash className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-800 capitalize">
                  {data.tagName}
                </h1>
                <p className="text-lg text-slate-600 mt-1">
                  {data.stats.totalContent} pieces of content • {data.stats.totalArticles} articles • {data.stats.totalQuestions} questions • {data.stats.totalCommunities} communities
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6" />
                  <span className="font-medium">Articles</span>
                </div>
                <div className="text-3xl font-bold">{data.stats.totalArticles}</div>
                <div className="text-blue-100 text-sm mt-1">Educational content</div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-medium">Questions</span>
                </div>
                <div className="text-3xl font-bold">{data.stats.totalQuestions}</div>
                <div className="text-emerald-100 text-sm mt-1">Community discussions</div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6" />
                  <span className="font-medium">Communities</span>
                </div>
                <div className="text-3xl font-bold">{data.stats.totalCommunities}</div>
                <div className="text-orange-100 text-sm mt-1">Active groups</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-6 h-6" />
                  <span className="font-medium">Total Content</span>
                </div>
                <div className="text-3xl font-bold">{data.stats.totalContent}</div>
                <div className="text-purple-100 text-sm mt-1">All resources</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-slate-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'all', label: 'All Content', count: data.stats.totalContent },
                  { id: 'articles', label: 'Articles', count: data.stats.totalArticles },
                  { id: 'questions', label: 'Questions', count: data.stats.totalQuestions },
                  { id: 'communities', label: 'Communities', count: data.stats.totalCommunities }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'all' | 'articles' | 'questions' | 'communities')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {(articles.length === 0 && questions.length === 0 && communities.length === 0) ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">No content found</h3>
                  <p className="text-slate-500 mb-6">
                    There&apos;s no {activeTab === 'all' ? 'content' : activeTab} available for this tag yet.
                  </p>
                  <Link href="/articles" className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
                    Explore All Articles
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Articles Section */}
                  {articles.length > 0 && (
                    <div>
                      {activeTab === 'all' && (
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                          Articles ({articles.length})
                        </h3>
                      )}
                      <div className="space-y-4">
                        {articles.map((article) => (
                          <div key={`article-${article.id}`} className="bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link 
                                  href={`/article/${article.id}`}
                                  className="block group"
                                >
                                  <h4 className="text-xl font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors mb-2">
                                    {article.title}
                                  </h4>
                                </Link>
                                <p className="text-slate-600 mb-3 line-clamp-2">
                                  {article.content}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {article.authorName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(article.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {article.tags && article.tags.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {article.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {article.tags.length > 3 && (
                                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                        +{article.tags.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Article
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions Section */}
                  {questions.length > 0 && (
                    <div>
                      {activeTab === 'all' && articles.length > 0 && (
                        <hr className="my-8 border-slate-200" />
                      )}
                      {activeTab === 'all' && (
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <MessageCircle className="w-5 h-5 text-emerald-500" />
                          Questions ({questions.length})
                        </h3>
                      )}
                      <div className="space-y-4">
                        {questions.map((question) => (
                          <div key={`question-${question.id}`} className="bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link 
                                  href={`/questions/${question.id}`}
                                  className="block group"
                                >
                                  <h4 className="text-xl font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors mb-2">
                                    {question.title}
                                  </h4>
                                </Link>
                                <p className="text-slate-600 mb-3 line-clamp-2">
                                  {question.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {question.authorName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(question.createdAt).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {question.answerCount} answers
                                  </span>
                                </div>
                                {question.tags && question.tags.length > 0 && (
                                  <div className="flex gap-2 mt-3">
                                    {question.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {question.tags.length > 3 && (
                                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                        +{question.tags.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  Question
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Communities Section */}
                  {communities.length > 0 && (
                    <div>
                      {activeTab === 'all' && (articles.length > 0 || questions.length > 0) && (
                        <hr className="my-8 border-slate-200" />
                      )}
                      {activeTab === 'all' && (
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-orange-500" />
                          Communities ({communities.length})
                        </h3>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {communities.map((community) => (
                          <Link
                            key={`community-${community.id}`}
                            href={`/community/${community.id}`}
                            className="block bg-slate-50 rounded-lg p-6 hover:bg-slate-100 transition-colors group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-xl font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                                {community.name}
                              </h4>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0 ml-2">
                                Community
                              </span>
                            </div>
                            <p className="text-slate-600 mb-4 line-clamp-2">
                              {community.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {community.creatorName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {community.memberCount} members
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {community.postCount} posts
                              </span>
                            </div>
                            {community.skills && community.skills.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {community.skills.slice(0, 4).map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {community.skills.length > 4 && (
                                  <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                    +{community.skills.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
