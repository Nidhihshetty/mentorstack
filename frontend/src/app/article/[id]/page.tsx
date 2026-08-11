"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { authAPI, Article } from "../../../lib/auth-api";
import BookmarkButton from "@/components/BookmarkButton";
import ArticleImageUpload from "@/components/ArticleImageUpload";
import Layout from "../../../components/Layout";
import { Edit, Trash2, Save, XCircle, Eye, X } from "lucide-react";

export default function ArticleView() {
    const { id } = useParams();
    const router = useRouter();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editTags, setEditTags] = useState<string[]>([]);
    const [editImages, setEditImages] = useState<File[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchArticle = useCallback(async () => {
            try {
                setLoading(true);
                const response = await authAPI.getArticle(Number(id));
                setArticle(response);
                
                // Debug: Log author avatar
                console.log('Article data:', response);
                console.log('Author Avatar URL:', response.authorAvatar);
                
                // set initial user vote if provided by API
                const typed = response as Article & { userVote?: 'upvote' | 'downvote' | null };
                setUserVote(typed.userVote ?? null);
                setError(null);

                // Get current user ID
                try {
                    const userResponse = await authAPI.getCurrentUser();
                    setCurrentUserId(userResponse.user.id);
                } catch (error) {
                    console.error('Error getting current user:', error);
                }
            } catch (err) {
            console.error("Error fetching article:", err);
            setError("Failed to load article");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchArticle();
        }
    }, [id, fetchArticle]);

    const handleVote = async (voteType: "upvote" | "downvote") => {
        if (!article) return;

        // Optimistic update: compute new local state
        const previous: Article & { userVote?: 'upvote' | 'downvote' | null } = {
            id: article.id,
            title: article.title,
            content: article.content,
            imageUrls: article.imageUrls,
            authorName: article.authorName,
            authorBio: article.authorBio,
            authorAvatar: article.authorAvatar,
            upvotes: article.upvotes,
            downvotes: article.downvotes,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
            userVote
        };

        const currently = userVote;
        const newVote = currently === voteType ? null : voteType;

        // Adjust counts locally
        const upvotes = article.upvotes;
        const downvotes = article.downvotes;

        let newUp = upvotes;
        let newDown = downvotes;

        // Remove previous vote effect
        if (currently === 'upvote') newUp = Math.max(0, newUp - 1);
        if (currently === 'downvote') newDown = Math.max(0, newDown - 1);

        // Apply new vote
        if (newVote === 'upvote') newUp += 1;
        if (newVote === 'downvote') newDown += 1;

        setArticle(prev => prev ? { ...prev, upvotes: newUp, downvotes: newDown } : prev);
        setUserVote(newVote);

        try {
            await authAPI.voteOnArticle(article.id, voteType);
            // Server handled it, nothing more to do
        } catch (err) {
            console.error("Error voting on article:", err);
            // Revert to previous state on error
            setArticle(previous);
            setUserVote(previous.userVote ?? null);
            alert('Failed to register vote. Please try again.');
        }
    };

    const handleEditArticle = () => {
        if (!article) return;
        setEditTitle(article.title);
        setEditContent(article.content);
        setEditTags(article.tags || []);
        setExistingImageUrls(article.imageUrls || []);
        setEditImages([]);
        setIsEditing(true);
    };

    const handleSaveArticle = async () => {
        if (!article || editTitle.trim().length < 1 || editContent.trim().length < 1) return;

        setIsSubmitting(true);
        try {
            if (editImages.length > 0) {
                const formData = new FormData();
                formData.append('title', editTitle.trim());
                formData.append('content', editContent.trim());
                formData.append('existingImageUrls', JSON.stringify(existingImageUrls));
                formData.append('tags', JSON.stringify(editTags));

                // Add new images
                editImages.forEach((image) => {
                    formData.append('images', image);
                });

                await authAPI.updateArticle(article.id, formData);
            } else {
                await authAPI.updateArticle(article.id, {
                    title: editTitle.trim(),
                    content: editContent.trim(),
                    tags: editTags,
                    existingImageUrls,
                });
            }
            
            // Reload article to show updates
            await fetchArticle();
            setIsEditing(false);
            setEditImages([]);
        } catch (error) {
            console.error('Error updating article:', error);
            alert('Failed to update article. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteArticle = async () => {
        if (!article) return;
        
        if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
            return;
        }

        setIsSubmitting(true);
        try {
            await authAPI.deleteArticle(article.id);
            router.push('/articles');
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Failed to delete article. Please try again.');
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const renderContent = (content: string) => {
        // Simple markdown-like rendering
        let html = content;
        
        // Code blocks with syntax highlighting (light background for contrast)
        html = html.replace(
            /```(\w+)?\n([\s\S]*?)```/g,
            '<pre class="bg-gray-100 text-gray-900 border border-gray-200 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm"><code>$2</code></pre>'
        );

        // Inline code (light background, dark text)
        html = html.replace(
            /`([^`]+)`/g,
            '<code class="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">$1</code>'
        );
        
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold text-gray-900 mt-8 mb-4">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-gray-900 mt-10 mb-5">$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        
        // Links
        html = html.replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
        );
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-4">');
        html = html.replace(/\n/g, '<br/>');
        
        return `<p class="text-gray-700 leading-relaxed mb-4">${html}</p>`;
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-primary)' }}></div>
                        <p className="mt-4" style={{ color: 'var(--color-tertiary)' }}>Loading article...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !article) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-tertiary)' }}>
                            {error || "Article not found"}
                        </h3>
                        <button
                            onClick={() => router.push("/articles")}
                            className="px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                        >
                            Back to Articles
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
                <div className="max-w-4xl mx-auto p-6">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mb-6 transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-tertiary)' }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Articles
                    </button>

                    {/* Article Header */}
                    <article 
                        className="rounded-lg border overflow-hidden shadow-sm"
                        style={{
                            backgroundColor: 'var(--color-neutral)',
                            borderColor: 'var(--color-surface-dark)'
                        }}
                    >
                        {/* Featured Images with Preview (up to 3) */}
                        {article.imageUrls && article.imageUrls.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/5 p-2">
                                {article.imageUrls.slice(0, 3).map((imageUrl, index) => {
                                    const remainingCount = article.imageUrls.length - 3;
                                    const showRemainingBadge = index === 2 && remainingCount > 0;

                                    return (
                                        <div
                                            key={`${imageUrl}-${index}`}
                                            className={`relative cursor-pointer group overflow-hidden rounded-md ${
                                                index === 0 ? 'h-64 md:h-80 md:col-span-2' : 'h-40 md:h-80'
                                            }`}
                                            onClick={() => setPreviewImage(imageUrl)}
                                        >
                                            <Image
                                                src={imageUrl}
                                                alt={`${article.title} image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                            <div className="absolute inset-0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                                                <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200">
                                                    <Eye className="w-12 h-12 text-white drop-shadow-lg" />
                                                    <p className="text-white text-sm font-semibold mt-2 text-center">Click to preview</p>
                                                </div>
                                            </div>

                                            {showRemainingBadge && (
                                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                                    +{remainingCount} more
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="p-8">
                            {/* Article Meta */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    {article.authorAvatar ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: 'var(--color-primary)' }}>
                                            <Image
                                                src={article.authorAvatar}
                                                alt={article.authorName}
                                                width={48}
                                                height={48}
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-12 h-12 bg-gradient-to-br rounded-full flex items-center justify-center text-white font-semibold text-lg"
                                            style={{
                                                background: 'linear-gradient(to bottom right, var(--color-primary), #059669)'
                                            }}
                                        >
                                            {article.authorName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold" style={{ color: 'var(--color-tertiary)' }}>{article.authorName}</h3>
                                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-tertiary-light)' }}>
                                            <span>{formatDate(article.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Edit/Delete buttons for article author */}
                                {currentUserId && article.authorId === currentUserId && !isEditing && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleEditArticle}
                                            className="p-2 rounded-lg transition-colors hover:opacity-80"
                                            style={{
                                                color: 'var(--color-primary)',
                                                backgroundColor: 'var(--color-surface-light)'
                                            }}
                                            title="Edit article"
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            onClick={handleDeleteArticle}
                                            className="p-2 rounded-lg transition-colors"
                                            style={{
                                                color: '#dc2626',
                                                backgroundColor: '#fee2e2'
                                            }}
                                            title="Delete article"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Article Title */}
                            {isEditing ? (
                                <div className="mb-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>Title</label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full text-2xl font-bold border-2 rounded-lg p-3 focus:outline-none"
                                            style={{
                                                backgroundColor: 'var(--color-neutral)',
                                                borderColor: 'var(--color-surface-dark)',
                                                color: 'var(--color-tertiary)'
                                            }}
                                            placeholder="Article title"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>Content (Markdown supported)</label>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full p-4 border-2 rounded-lg resize-none focus:ring-2"
                                            style={{
                                                backgroundColor: 'var(--color-neutral)',
                                                borderColor: 'var(--color-surface-dark)',
                                                color: 'var(--color-tertiary)'
                                            }}
                                            rows={20}
                                            placeholder="Article content (Markdown supported)"
                                        />
                                    </div>

                                    {/* Tags Section */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {editTags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                                >
                                                    {tag}
                                                    <button
                                                        onClick={() => setEditTags(editTags.filter((_, i) => i !== index))}
                                                        className="hover:text-blue-600"
                                                        type="button"
                                                        title="Remove tag"
                                                        aria-label={`Remove ${tag} tag`}
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && tagInput.trim()) {
                                                        e.preventDefault();
                                                        if (!editTags.includes(tagInput.trim().toLowerCase())) {
                                                            setEditTags([...editTags, tagInput.trim().toLowerCase()]);
                                                        }
                                                        setTagInput('');
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Add a tag and press Enter"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (tagInput.trim() && !editTags.includes(tagInput.trim().toLowerCase())) {
                                                        setEditTags([...editTags, tagInput.trim().toLowerCase()]);
                                                        setTagInput('');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                            >
                                                Add Tag
                                            </button>
                                        </div>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                                            Images <span className="text-sm" style={{ color: 'var(--color-tertiary-light)' }}>(Optional)</span>
                                        </label>
                                        <ArticleImageUpload
                                            onImagesChange={setEditImages}
                                            onExistingImagesChange={setExistingImageUrls}
                                            initialImages={existingImageUrls}
                                            maxImages={5}
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <button
                                            onClick={handleSaveArticle}
                                            disabled={isSubmitting || !editTitle.trim() || !editContent.trim()}
                                            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ backgroundColor: 'var(--color-primary)' }}
                                        >
                                            <Save size={18} />
                                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            disabled={isSubmitting}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition disabled:opacity-50"
                                            style={{
                                                backgroundColor: 'var(--color-surface)',
                                                color: 'var(--color-secondary)'
                                            }}
                                        >
                                            <XCircle size={18} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: 'var(--color-tertiary)' }}>
                                        {article.title}
                                    </h1>

                                    {/* Article Actions */}
                                    <div className="flex items-center justify-between mb-8 py-4 border-y" style={{ borderColor: 'var(--color-surface-dark)' }}>
                                        <div className="flex items-center gap-4">
                                            {/* Vote Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVote("upvote")}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        userVote === "upvote" ? "border-2" : ""
                                                    }`}
                                                    style={{
                                                        color: userVote === "upvote" ? '#7c3aed' : 'var(--color-tertiary-light)',
                                                        backgroundColor: userVote === "upvote" ? '#f3e8ff' : 'transparent',
                                                        borderColor: userVote === "upvote" ? '#c4b5fd' : 'transparent'
                                                    }}
                                                    title="Upvote article"
                                                    aria-label="Upvote article"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </button>
                                                <span className="text-sm font-medium min-w-[2rem] text-center" style={{ color: 'var(--color-tertiary)' }}>
                                                    {article.upvotes - article.downvotes}
                                                </span>
                                                <button
                                                    onClick={() => handleVote("downvote")}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        userVote === "downvote" ? "border-2" : ""
                                                    }`}
                                                    style={{
                                                        color: userVote === "downvote" ? '#dc2626' : 'var(--color-tertiary-light)',
                                                        backgroundColor: userVote === "downvote" ? '#fee2e2' : 'transparent',
                                                        borderColor: userVote === "downvote" ? '#fca5a5' : 'transparent'
                                                    }}
                                                    title="Downvote article"
                                                    aria-label="Downvote article"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <BookmarkButton kind="article" id={article.id} />
                                        </div>
                                    </div>

                                    {/* Tags Display */}
                                    {article.tags && article.tags.length > 0 && (
                                        <div className="mb-6">
                                            <div className="flex flex-wrap gap-2">
                                                {article.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 rounded-full text-sm font-medium"
                                                        style={{
                                                            backgroundColor: 'var(--color-surface-light)',
                                                            color: 'var(--color-secondary)'
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Article Content */}
                                    <div 
                                        className="prose prose-slate max-w-none"
                                        style={{ color: 'var(--color-tertiary)' }}
                                        dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
                                    />
                                </>
                            )}

                        </div>
                    </article>
                </div>

                {/* Image Preview Modal */}
                {previewImage && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadeIn"
                        onClick={() => setPreviewImage(null)}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 hover:rotate-90"
                            aria-label="Close preview"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                        <div className="max-w-7xl max-h-[90vh] p-4">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                width={1200}
                                height={800}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
