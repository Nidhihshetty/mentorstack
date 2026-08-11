'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/admin-api';
import type { Article } from '@/lib/admin-api';
import {
    FileText,
    Search,
    Eye,
    Trash2,
    ThumbsUp,
    ThumbsDown,
    User,
    Calendar,
    Tag,
    Image as ImageIcon,
    Bookmark,
    TrendingUp,
    Filter,
    X
} from 'lucide-react';

// Extended Article interface with additional fields
interface ExtendedArticle extends Article {
    authorRole?: 'mentor' | 'mentee';
    imageUrls?: string[];
    updatedAt?: string;
    tags?: Array<{
        tag: {
            id: number;
            name: string;
        };
    }>;
    _count?: {
        votes?: number;
        bookmarks?: number;
    };
}

export default function AdminArticlesPage() {
    const router = useRouter();
    const [articles, setArticles] = useState<ExtendedArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'mentor' | 'mentee'>('all');
    const [selectedArticle, setSelectedArticle] = useState<ExtendedArticle | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [articleToDelete, setArticleToDelete] = useState<ExtendedArticle | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        checkAuth();
        loadArticles();
    }, []);

    const checkAuth = async () => {
        try {
            if (!adminAPI.isAuthenticated()) {
                router.push('/admin/login');
            }
        } catch {
            router.push('/admin/login');
        }
    };

    const loadArticles = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await adminAPI.getArticles();
            setArticles(response.articles || []);
        } catch (err) {
            console.error('Error loading articles:', err);
            setError('Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    // Filter articles based on search and role filter
    const filteredArticles = articles.filter(article => {
        const matchesSearch =
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.author?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags?.some((t: any) => t.tag.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole = filterRole === 'all' || article.authorRole === filterRole || article.author?.role === filterRole;

        return matchesSearch && matchesRole;
    });

    // Calculate stats
    const totalArticles = articles.length;
    const totalUpvotes = articles.reduce((sum, a) => sum + (a.upvotes || 0), 0);
    const totalVotes = articles.reduce((sum, a) => sum + (a.upvotes || 0) + (a.downvotes || 0), 0);
    const totalBookmarks = articles.reduce((sum, a) => sum + (a._count?.bookmarks || 0), 0);

    const handleViewArticle = (article: Article) => {
        setSelectedArticle(article);
        setShowDetailModal(true);
    };

    const handleDeleteClick = (article: Article) => {
        setArticleToDelete(article);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!articleToDelete) return;

        try {
            await adminAPI.deleteArticle(articleToDelete.id);
            setArticles(articles.filter(a => a.id !== articleToDelete.id));
            setShowDeleteConfirm(false);
            setArticleToDelete(null);
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Failed to delete article');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'mentor':
                return 'bg-purple-100 text-purple-700';
            case 'mentee':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Loading state
    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-500 mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading articles...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-xl mb-4">Error loading articles</div>
                        <div className="text-gray-600 mb-4">{error}</div>
                        <button
                            onClick={loadArticles}
                            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Page Header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                                <FileText className="w-8 h-8" />
                                Article Management
                            </h1>
                            <p className="text-teal-100">Manage and moderate all platform articles</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center">
                                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-xs text-teal-100">Total</p>
                                            <p className="text-3xl font-extrabold">{totalArticles}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-5 shadow-md border border-teal-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-teal-700 font-medium">Total Articles</p>
                                <p className="text-3xl font-bold text-teal-900 mt-1">{totalArticles}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-5 shadow-md border border-green-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 font-medium">Total Upvotes</p>
                                <p className="text-3xl font-bold text-green-900 mt-1">{totalUpvotes}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl shadow-lg">
                                <ThumbsUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 shadow-md border border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Total Votes</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">{totalVotes}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 shadow-md border border-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700 font-medium">Total Bookmarks</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">{totalBookmarks}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg">
                                <Bookmark className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="p-6">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by title, content, author, or tags..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600">Filter by role:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterRole('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterRole === 'all'
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterRole('mentor')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterRole === 'mentor'
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Mentors
                                </button>
                                <button
                                    onClick={() => setFilterRole('mentee')}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filterRole === 'mentee'
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Mentees
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Articles Grid */}
                <div className="space-y-4">
                    {filteredArticles.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-16">
                            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">No articles found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        filteredArticles.map((article) => (
                            <div key={article.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:border-teal-300 transition-all duration-300">
                                <div className="flex gap-6">
                                    {/* Article Thumbnail - Image or Gradient with Icon */}
                                    <button
                                        type="button"
                                        aria-label="Preview first image"
                                        onClick={() => {
                                            if (article.imageUrls && article.imageUrls.length > 0) {
                                                setPreviewImage(article.imageUrls[0]);
                                            }
                                        }}
                                        disabled={!(article.imageUrls && article.imageUrls.length > 0)}
                                        className={`w-48 h-32 rounded-lg flex-shrink-0 overflow-hidden relative group shadow-md hover:shadow-xl transition-all duration-300 text-left ${
                                            article.imageUrls && article.imageUrls.length > 0 ? 'cursor-pointer' : 'cursor-not-allowed bg-gradient-to-br from-teal-100 to-emerald-100'
                                        }`}
                                    >
                                        {article.imageUrls && article.imageUrls.length > 0 ? (
                                            <>
                                                <img
                                                    src={article.imageUrls[0]}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                                    <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200">
                                                        <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                                                        <p className="text-white text-xs font-semibold mt-1 text-center">Preview</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-16 h-16 text-teal-600" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Article Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Title and Author */}
                                        <div className="mb-3">
                                            <h3 className="text-xl font-bold text-slate-800 mb-2">{article.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span>{article.author?.name || 'Unknown'}</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(article.authorRole || article.author?.role || 'mentee')}`}>
                                                    {(article.authorRole || article.author?.role || 'mentee').charAt(0).toUpperCase() + (article.authorRole || article.author?.role || 'mentee').slice(1)}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatDate(article.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Preview */}
                                        <p className="text-slate-600 mb-3 line-clamp-2">
                                            {truncateContent(article.content)}
                                        </p>

                                        {/* Tags */}
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <Tag className="w-4 h-4 text-slate-400" />
                                                <div className="flex flex-wrap gap-2">
                                                    {article.tags.slice(0, 4).map((tagItem) => (
                                                        <span
                                                            key={tagItem.tag.id}
                                                            className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg"
                                                        >
                                                            {tagItem.tag.name}
                                                        </span>
                                                    ))}
                                                    {article.tags.length > 4 && (
                                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                                                            +{article.tags.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Images Indicator */}
                                        {article.imageUrls && article.imageUrls.length > 1 && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                                <ImageIcon className="w-4 h-4" />
                                                <span>{article.imageUrls.length} images attached</span>
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                                                <ThumbsUp className="w-4 h-4" />
                                                <span className="font-bold">{article.upvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg">
                                                <ThumbsDown className="w-4 h-4" />
                                                <span className="font-bold">{article.downvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="font-bold">{(article.upvotes || 0) + (article.downvotes || 0)}</span>
                                                <span className="text-xs">votes</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
                                                <Bookmark className="w-4 h-4" />
                                                <span className="font-bold">{article._count?.bookmarks || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col justify-center gap-3 min-w-[120px]">
                                        <button
                                            onClick={() => handleViewArticle(article)}
                                            className="px-4 py-2.5 bg-gradient-to-r from-secondary-dark to-secondary-dark text-white rounded-lg hover:from-primary hover:to-primary hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(article)}
                                            className="px-4 py-2.5 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 hover:shadow-md transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Article Detail Modal */}
            {showDetailModal && selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Ambient gradient backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-900/85 to-cyan-900/90 backdrop-blur-sm" />
                    {/* Gradient frame */}
                    <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-300/60 bg-white backdrop-blur-xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-emerald-200/60 flex items-center justify-between bg-white/10 backdrop-blur-md">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-emerald-600" />
                                Article Details
                            </h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="p-2 rounded-lg hover:bg-white/30 transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-700" />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-8">
                                {/* Title / primary meta */}
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">{selectedArticle.title}</h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <User className="w-4 h-4" />
                                            <span className="font-medium">{selectedArticle.author?.name || 'Unknown'}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getRoleBadgeColor(selectedArticle.authorRole || selectedArticle.author?.role || 'mentee')}`}>{(selectedArticle.authorRole || selectedArticle.author?.role || 'mentee').charAt(0).toUpperCase() + (selectedArticle.authorRole || selectedArticle.author?.role || 'mentee').slice(1)}</span>
                                        <div className="flex items-center gap-1 text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Published {formatDate(selectedArticle.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Images Gallery */}
                                {(selectedArticle.imageUrls && selectedArticle.imageUrls.length > 0) && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <ImageIcon className="w-5 h-5 text-emerald-600" />
                                            Article Images ({selectedArticle.imageUrls?.length || 3})
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedArticle.imageUrls.map((url) => (
                                                <button
                                                    key={url}
                                                    type="button"
                                                    onClick={() => setPreviewImage(url)}
                                                    className="relative group rounded-lg overflow-hidden bg-slate-100 shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <img src={url} alt="" className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity duration-300">
                                                        <div className="text-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                                            <Eye className="w-10 h-10 text-white mx-auto" />
                                                            <p className="text-white text-sm font-semibold mt-2">Click to preview</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-slate-900">Content</h4>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {selectedArticle.content}
                                        </p>
                                    </div>
                                </div>

                                {/* Tags */}
                                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                            <Tag className="w-5 h-5 text-emerald-600" />
                                            Tags
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedArticle.tags.map((tagItem) => (
                                                <span key={tagItem.tag.id} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-800">
                                                    {tagItem.tag.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Statistics */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-slate-900">Engagement Statistics</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="rounded-lg p-4 text-center bg-green-50 border border-green-200">
                                            <ThumbsUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-green-700">{selectedArticle.upvotes}</p>
                                            <p className="text-xs font-medium text-green-600">Upvotes</p>
                                        </div>
                                        <div className="rounded-lg p-4 text-center bg-red-50 border border-red-200">
                                            <ThumbsDown className="w-6 h-6 text-red-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-red-700">{selectedArticle.downvotes}</p>
                                            <p className="text-xs font-medium text-red-600">Downvotes</p>
                                        </div>
                                        <div className="rounded-lg p-4 text-center bg-blue-50 border border-blue-200">
                                            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-blue-700">{(selectedArticle.upvotes || 0) + (selectedArticle.downvotes || 0)}</p>
                                            <p className="text-xs font-medium text-blue-600">Total Votes</p>
                                        </div>
                                        <div className="rounded-lg p-4 text-center bg-purple-50 border border-purple-200">
                                            <Bookmark className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-purple-700">{selectedArticle._count?.bookmarks || 0}</p>
                                            <p className="text-xs font-medium text-purple-600">Bookmarks</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Author Details */}
                                {selectedArticle.author && (
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-slate-900">Author Information</h4>
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 border border-emerald-100">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                                {selectedArticle.author.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold text-slate-900">{selectedArticle.author.name}</p>
                                                <p className="text-sm text-slate-600">{selectedArticle.author.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-slate-900">Metadata</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 rounded-lg bg-white/60 border border-emerald-100">
                                            <span className="font-medium text-slate-700">Article ID:</span> {selectedArticle.id}
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/60 border border-emerald-100">
                                            <span className="font-medium text-slate-700">Author ID:</span> {selectedArticle.author?.id || 'N/A'}
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/60 border border-emerald-100">
                                            <span className="font-medium text-slate-700">Created:</span> {new Date(selectedArticle.createdAt).toLocaleString()}
                                        </div>
                                        {selectedArticle.updatedAt && (
                                            <div className="p-3 rounded-lg bg-white/60 border border-emerald-100">
                                                <span className="font-medium text-slate-700">Updated:</span> {new Date(selectedArticle.updatedAt).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 border-t border-emerald-200/60 flex items-center justify-end gap-3 bg-white/20 backdrop-blur-md">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-6 py-2.5 rounded-lg font-semibold border-2 border-slate-300 bg-white/60 text-slate-700 hover:bg-white hover:border-slate-400 transition shadow-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { setShowDetailModal(false); handleDeleteClick(selectedArticle); }}
                                className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700 transition flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Article
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && articleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-900/85 to-cyan-900/90 backdrop-blur-sm" />
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-white/92 to-white/82 backdrop-blur-xl shadow-2xl p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Article?</h3>
                            <p className="text-slate-700">
                                Are you sure you want to delete "{articleToDelete.title}"? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setArticleToDelete(null); }}
                                className="flex-1 px-4 py-2.5 rounded-lg font-semibold border-2 border-slate-300 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-4 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60] animate-fadeIn"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
                        {/* Close button */}
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-200 z-10 group"
                        >
                            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Image container */}
                        <div
                            className="relative max-h-[90vh] max-w-full animate-scaleIn"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="max-h-[90vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                            />
                            {/* Image info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-lg">
                                <p className="text-white text-sm font-medium flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" />
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
