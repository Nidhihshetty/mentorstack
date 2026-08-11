'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import BookmarkButton from '@/components/BookmarkButton';
import ArticleImageUpload from '@/components/ArticleImageUpload';
import { authAPI, CommunityPost, Community } from '@/lib/auth-api';
import { Edit, Trash2, Save, XCircle } from 'lucide-react';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const postId = params.postId as string;
  
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize initial images to prevent infinite loop in ArticleImageUpload
  const existingImageUrlsString = JSON.stringify(existingImageUrls);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedInitialImages = useMemo(() => existingImageUrls, [existingImageUrlsString]);

  useEffect(() => {
    const loadData = async () => {
      if (!communityId || !postId) return;
      
      try {
        // Load community and posts data
        const [communityData, postsData] = await Promise.all([
          authAPI.getCommunity(parseInt(communityId)),
          authAPI.getCommunityPosts(parseInt(communityId))
        ]);

        setCommunity(communityData);
        
        // Find the specific post
        const foundPost = postsData.find(p => p.id === parseInt(postId));
        if (foundPost) {
          setPost(foundPost);
        } else {
          // Post not found, redirect back
          router.push(`/community/${communityId}`);
          return;
        }
        
        // Get current user ID
        try {
          const userResponse = await authAPI.getCurrentUser();
          setCurrentUserId(userResponse.user.id);
        } catch (error) {
          console.error('Error getting current user:', error);
        }
        
        // Check if user is a member
        try {
          const membershipData = await authAPI.checkCommunityMembership(parseInt(communityId));
          setIsMember(membershipData.isMember);
        } catch {
          setIsMember(false);
        }
      } catch (error) {
        console.error('Error loading post data:', error);
        router.push(`/community/${communityId}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [communityId, postId, router]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!post) return;
    
    try {
      await authAPI.voteOnCommunityPost(parseInt(communityId), post.id, voteType);
      // Reload posts to update vote counts and userVote status
      const updatedPosts = await authAPI.getCommunityPosts(parseInt(communityId));
      const updatedPost = updatedPosts.find(p => p.id === post.id);
      if (updatedPost) {
        setPost(updatedPost);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to vote';
      alert(errorMessage);
    }
  };

  const handleEditPost = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditTags(post.tags || []);
    setExistingImageUrls(post.imageUrls || []);
    setEditImages([]);
    setIsEditing(true);
  };

  const handleSavePost = async () => {
    if (!post || !editTitle.trim() || !editContent.trim()) return;

    setIsSubmitting(true);
    try {
      // Use multipart only when new image files are being uploaded.
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

        const updatedPost = await authAPI.updateCommunityPost(parseInt(communityId), post.id, formData);
        setPost(updatedPost);
      } else {
        // Text/tag updates (and existing image retention/removal) via JSON
        const updatedPost = await authAPI.updateCommunityPost(parseInt(communityId), post.id, {
          title: editTitle.trim(),
          content: editContent.trim(),
          tags: editTags,
          existingImageUrls,
        });
        setPost(updatedPost);
      }
      
      // Exit edit mode and reset edit states
      setIsEditing(false);
      setEditImages([]);
      setExistingImageUrls([]);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.deleteCommunityPost(parseInt(communityId), post.id);
      router.push(`/community/${communityId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !editTags.includes(tagInput.trim())) {
      setEditTags([...editTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  const goBackToCommunity = () => {
    router.push(`/community/${communityId}`);
  };

  if (loading) {
    return (
      <Layout>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
        <div className="flex justify-center items-center h-64" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div 
            className="animate-spin rounded-full h-12 w-12 mb-4"
            style={{ 
              border: '3px solid var(--color-surface-dark)',
              borderTopColor: 'var(--color-primary)'
            }}
          ></div>
          <p style={{ color: 'var(--color-tertiary-light)', marginLeft: '1rem' }}>
            Loading post...
          </p>
        </div>
      </Layout>
    );
  }

  if (!post || !community) {
    return (
      <Layout>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
        <div className="flex justify-center items-center h-64" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="text-center">
            <span className="text-4xl mb-4 block">📭</span>
            <div className="text-lg" style={{ color: 'var(--color-tertiary)' }}>Post not found</div>
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
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div 
        className="min-h-screen"
        style={{ background: 'var(--color-neutral-dark)' }}
      >
        <div className="max-w-4xl mx-auto p-6">
          {/* Back Navigation */}
          <div 
            className="mb-6"
            style={{ animation: 'slideDown 0.5s ease-out' }}
          >
            <button
              onClick={goBackToCommunity}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to {community.name}
            </button>
          </div>

          {/* Post Content */}
          <div 
            className="rounded-xl shadow-sm"
            style={{ 
              background: 'var(--color-neutral)',
              border: '1px solid var(--color-surface-dark)',
              animation: 'fadeInUp 0.6s ease-out'
            }}
          >
            <div className="p-8">
              <div className="flex gap-6">
                {/* Vote Buttons */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => handleVote('upvote')}
                    className="p-3 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: post.userVote === 'upvote' ? 'var(--color-surface-light)' : 'var(--color-surface)',
                      border: post.userVote === 'upvote' ? '2px solid var(--color-primary)' : '1px solid var(--color-surface-dark)',
                      color: post.userVote === 'upvote' ? 'var(--color-primary)' : 'var(--color-tertiary-light)',
                    }}
                    disabled={!isMember}
                    title="Upvote"
                    onMouseEnter={(e) => {
                      if (isMember && post.userVote !== 'upvote') {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (post.userVote !== 'upvote') {
                        e.currentTarget.style.borderColor = 'var(--color-surface-dark)';
                        e.currentTarget.style.color = 'var(--color-tertiary-light)';
                      }
                    }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  
                  <span 
                    className="text-xl font-bold py-2"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    {post.upvotes - post.downvotes}
                  </span>
                  
                  <button
                    onClick={() => handleVote('downvote')}
                    className="p-3 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: post.userVote === 'downvote' ? 'var(--color-surface-light)' : 'var(--color-surface)',
                      border: post.userVote === 'downvote' ? '2px solid #ef4444' : '1px solid var(--color-surface-dark)',
                      color: post.userVote === 'downvote' ? '#ef4444' : 'var(--color-tertiary-light)',
                    }}
                    disabled={!isMember}
                    title="Downvote"
                    onMouseEnter={(e) => {
                      if (isMember && post.userVote !== 'downvote') {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.color = '#ef4444';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (post.userVote !== 'downvote') {
                        e.currentTarget.style.borderColor = 'var(--color-surface-dark)';
                        e.currentTarget.style.color = 'var(--color-tertiary-light)';
                      }
                    }}
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Post Content */}
                <div className="flex-1">
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <h2 
                        className="text-2xl font-bold mb-4 flex items-center gap-2"
                        style={{ color: 'var(--color-tertiary)' }}
                      >
                        <span>✏️</span>
                        Edit Post
                      </h2>
                      
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--color-tertiary)' }}
                        >
                          Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
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
                      </div>
                      
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--color-tertiary)' }}
                        >
                          Content
                        </label>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={10}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
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
                      </div>
                      
                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--color-tertiary)' }}
                        >
                          Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Add a tag..."
                            className="flex-1 px-4 py-2 rounded-lg focus:outline-none transition-all duration-200"
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
                            type="button"
                            onClick={addTag}
                            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                            style={{
                              background: 'var(--color-primary)',
                              color: 'white',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--color-secondary)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--color-primary)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {editTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 text-sm rounded-full flex items-center gap-1 font-medium"
                              style={{
                                background: 'var(--color-surface-light)',
                                color: 'var(--color-primary)',
                              }}
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="hover:scale-110 transition-transform"
                                style={{ color: 'var(--color-primary)' }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label 
                          className="block text-sm font-medium mb-1"
                          style={{ color: 'var(--color-tertiary)' }}
                        >
                          Images (optional, max 5)
                        </label>
                        <ArticleImageUpload
                          onImagesChange={setEditImages}
                          onExistingImagesChange={setExistingImageUrls}
                          maxImages={5}
                          initialImages={memoizedInitialImages}
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSavePost}
                          disabled={isSubmitting || !editTitle.trim() || !editContent.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-surface-dark)',
                            color: 'var(--color-tertiary)',
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      {/* Post Header */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-3">
                          <h1 
                            className="text-3xl font-bold"
                            style={{ color: 'var(--color-tertiary)' }}
                          >
                            {post.title}
                          </h1>
                          {currentUserId === (post.authorId || post.userId) && (
                            <div className="flex gap-2">
                              <button
                                onClick={handleEditPost}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:scale-105"
                                style={{
                                  background: 'var(--color-surface-light)',
                                  border: '1px solid var(--color-primary)',
                                  color: 'var(--color-primary)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--color-primary)';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'var(--color-surface-light)';
                                  e.currentTarget.style.color = 'var(--color-primary)';
                                }}
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={handleDeletePost}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 hover:scale-105"
                                style={{
                                  background: 'var(--color-surface)',
                                  border: '1px solid #ef4444',
                                  color: '#ef4444',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#ef4444';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'var(--color-surface)';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <div 
                          className="flex items-center gap-4 text-sm"
                          style={{ color: 'var(--color-tertiary-light)' }}
                        >
                          <span className="flex items-center gap-1">
                            <span>👤</span>
                            {post.userName || `User${post.userId}`}
                          </span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>in {community.name}</span>
                        </div>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {post.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-3 py-1 text-sm rounded-full font-medium"
                                style={{
                                  background: 'var(--color-surface-light)',
                                  color: 'var(--color-primary)',
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Post Body */}
                      <div className="prose prose-gray max-w-none">
                        <div 
                          className="leading-relaxed whitespace-pre-wrap text-lg"
                          style={{ color: 'var(--color-tertiary)' }}
                        >
                          {post.content}
                        </div>
                        
                        {/* Post Images */}
                        {post.imageUrls && post.imageUrls.length > 0 && (
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {post.imageUrls.map((imageUrl, index) => (
                              <div 
                                key={index} 
                                className="relative aspect-video rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105"
                                style={{ background: 'var(--color-surface)' }}
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Post image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Post Actions */}
                  <div 
                    className="mt-8 pt-6"
                    style={{ borderTop: '1px solid var(--color-surface-dark)' }}
                  >
                    <div className="flex items-center gap-6">
                      <BookmarkButton kind="post" id={post.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
