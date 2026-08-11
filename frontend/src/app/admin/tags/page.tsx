'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI, Tag as TagData } from '@/lib/admin-api';
import {
    Tag,
    Search,
    Plus,
    Edit,
    Trash2,
    Filter,
    Hash,
    TrendingUp,
    Calendar,
    AlignLeft,
    X,
    Save,
    FileText,
    MessageSquare,
    Users
} from 'lucide-react';

type SortOption = 'popular' | 'newest' | 'alphabetical';

export default function AdminTagsPage() {
    const router = useRouter();
    const [tags, setTags] = useState<TagData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('popular');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState<TagData | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        checkAuth();
        loadTags();
    }, []);

    const checkAuth = async () => {
        try {
            if (!adminAPI.isAuthenticated()) {
                router.push('/admin/login');
            }
        } catch (error) {
            router.push('/admin/login');
        }
    };

    const loadTags = async () => {
        try {
            setLoading(true);
            setError('');

            const data = await adminAPI.getTags();
            setTags(data.tags || []);
        } catch (err) {
            console.error('Error loading tags:', err);
            setError(err instanceof Error ? err.message : 'Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTag = async () => {
        if (!formData.name.trim()) {
            alert('Tag name is required');
            return;
        }

        try {
            await adminAPI.createTag(formData);
            await loadTags();
            setShowCreateModal(false);
            setFormData({ name: '', description: '' });
        } catch (err) {
            console.error('Error creating tag:', err);
            alert(err instanceof Error ? err.message : 'Failed to create tag');
        }
    };

    const handleUpdateTag = async () => {
        if (!selectedTag || !formData.name.trim()) {
            alert('Tag name is required');
            return;
        }

        try {
            await adminAPI.updateTag(selectedTag.id, formData);
            await loadTags();
            setShowEditModal(false);
            setSelectedTag(null);
            setFormData({ name: '', description: '' });
        } catch (err) {
            console.error('Error updating tag:', err);
            alert(err instanceof Error ? err.message : 'Failed to update tag');
        }
    };

    const handleDeleteTag = async (tagId: number) => {
        if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
            return;
        }

        try {
            await adminAPI.deleteTag(tagId);
            await loadTags();
        } catch (err) {
            console.error('Error deleting tag:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete tag');
        }
    };

    const openEditModal = (tag: TagData) => {
        setSelectedTag(tag);
        setFormData({
            name: tag.name,
            description: tag.description || ''
        });
        setShowEditModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate total usage
    const getTotalUsage = (tag: TagData) => {
        return tag._count.questions + tag._count.articles + tag._count.communityPosts;
    };

    // Filter and sort tags
    const getFilteredAndSortedTags = () => {
        let filtered = tags.filter(tag =>
            tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        switch (sortBy) {
            case 'popular':
                return filtered.sort((a, b) => getTotalUsage(b) - getTotalUsage(a));
            case 'newest':
                return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'alphabetical':
                return filtered.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return filtered;
        }
    };

    const filteredTags = getFilteredAndSortedTags();

    // Calculate stats
    const stats = {
        totalTags: tags.length,
        totalQuestions: tags.reduce((sum, tag) => sum + tag._count.questions, 0),
        totalArticles: tags.reduce((sum, tag) => sum + tag._count.articles, 0),
        totalPosts: tags.reduce((sum, tag) => sum + tag._count.communityPosts, 0)
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading tags...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-8 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Hash className="w-8 h-8" />
                                <h1 className="text-3xl font-bold">Tags Management</h1>
                            </div>
                            <p className="text-teal-100">Organize and manage content tags across the platform</p>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ name: '', description: '' });
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 bg-white text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Tag
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Tags</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalTags}</p>
                            </div>
                            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                <Tag className="w-6 h-6 text-teal-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Questions</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Articles</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalArticles}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Community Posts</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tags by name or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                            >
                                <option value="popular">Most Popular</option>
                                <option value="newest">Newest First</option>
                                <option value="alphabetical">Alphabetical</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-600">
                        Showing {filteredTags.length} of {tags.length} tags
                    </div>
                </div>

                {/* Tags Grid */}
                {filteredTags.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tags found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ? 'Try adjusting your search query' : 'Get started by creating your first tag'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => {
                                    setFormData({ name: '', description: '' });
                                    setShowCreateModal(true);
                                }}
                                className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Your First Tag
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTags.map((tag) => (
                            <div
                                key={tag.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Tag Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center">
                                            <Hash className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-lg">{tag.name}</h3>
                                            <p className="text-xs text-gray-500">ID: {tag.id}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(tag)}
                                            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                            title="Edit tag"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id)}
                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete tag"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                                    {tag.description || 'No description provided'}
                                </p>

                                {/* Usage Stats */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <MessageSquare className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-blue-900">{tag._count.questions}</p>
                                        <p className="text-xs text-blue-600">Questions</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                                        <FileText className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-purple-900">{tag._count.articles}</p>
                                        <p className="text-xs text-purple-600">Articles</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <Users className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                        <p className="text-sm font-semibold text-green-900">{tag._count.communityPosts}</p>
                                        <p className="text-xs text-green-600">Posts</p>
                                    </div>
                                </div>

                                {/* Total Usage Badge */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(tag.createdAt)}
                                    </div>
                                    <div className="flex items-center gap-1 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold">
                                        <TrendingUp className="w-4 h-4" />
                                        {getTotalUsage(tag)} uses
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Tag Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Create New Tag</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tag Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            placeholder="e.g., JavaScript, React, Python"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <div className="relative">
                                        <AlignLeft className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            rows={3}
                                            placeholder="Brief description of this tag..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTag}
                                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Create Tag
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Tag Modal */}
                {showEditModal && selectedTag && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-gray-900">Edit Tag</h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedTag(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tag Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            placeholder="e.g., JavaScript, React, Python"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <div className="relative">
                                        <AlignLeft className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                            rows={3}
                                            placeholder="Brief description of this tag..."
                                        />
                                    </div>
                                </div>

                                {/* Usage Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Current Usage:</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="text-center">
                                            <p className="font-semibold text-blue-600">{selectedTag._count.questions}</p>
                                            <p className="text-gray-600">Questions</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-purple-600">{selectedTag._count.articles}</p>
                                            <p className="text-gray-600">Articles</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-green-600">{selectedTag._count.communityPosts}</p>
                                            <p className="text-gray-600">Posts</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedTag(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateTag}
                                    className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
