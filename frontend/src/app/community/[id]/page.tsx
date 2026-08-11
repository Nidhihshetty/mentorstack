"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "../../../components/Layout";
import ArticleImageUpload from "../../../components/ArticleImageUpload";
import { authAPI, Community, CommunityPost } from "@/lib/auth-api";
import { Edit, Trash2, Save, XCircle } from "lucide-react";

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = parseInt(params.id as string);

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    images: [] as File[]
  });
  const [newTag, setNewTag] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isEditingCommunity, setIsEditingCommunity] = useState(false);
  const [editCommunityData, setEditCommunityData] = useState({
    name: "",
    description: "",
    skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!communityId) return;
      
      try {
        const [communityData, postsData] = await Promise.all([
          authAPI.getCommunity(communityId),
          authAPI.getCommunityPosts(communityId)
        ]);

        setCommunity(communityData);
        setPosts(postsData);
        
        // Get current user ID
        try {
          const userResponse = await authAPI.getCurrentUser();
          setCurrentUserId(userResponse.user.id);
        } catch (error) {
          console.error('Error getting current user:', error);
        }
        
        // Check if user is a member
        try {
          const membershipData = await authAPI.checkCommunityMembership(communityId);
          setIsMember(membershipData.isMember);
        } catch {
          console.log('Not authenticated or error checking membership');
          setIsMember(false);
        }
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [communityId]);

  const loadCommunityData = async () => {
    try {
      const [communityData, postsData] = await Promise.all([
        authAPI.getCommunity(communityId),
        authAPI.getCommunityPosts(communityId)
      ]);

      setCommunity(communityData);
      setPosts(postsData);
      
      // Check if user is a member
      try {
        const membershipData = await authAPI.checkCommunityMembership(communityId);
        setIsMember(membershipData.isMember);
      } catch {
        setIsMember(false);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    try {
      await authAPI.joinCommunity(communityId);
      setIsMember(true);
      // Reload community data to update member count
      loadCommunityData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join community';
      alert(errorMessage);
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      await authAPI.leaveCommunity(communityId);
      setIsMember(false);
      // Reload community data to update member count
      loadCommunityData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave community';
      alert(errorMessage);
    }
  };

  const handleCreatePost = async () => {
    try {
      if (!newPost.title.trim() || !newPost.content.trim()) {
        alert('Title and content are required');
        return;
      }

      // Use FormData only if there are images, otherwise use JSON
      if (newPost.images.length > 0) {
        const formData = new FormData();
        formData.append('title', newPost.title.trim());
        formData.append('content', newPost.content.trim());
        formData.append('tags', JSON.stringify(newPost.tags));

        // Add images
        newPost.images.forEach((image) => {
          formData.append('images', image);
        });

        await authAPI.createCommunityPost(communityId, formData);
      } else {
        // No images, send as JSON
        await authAPI.createCommunityPost(communityId, {
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          tags: newPost.tags
        });
      }

      setShowCreatePost(false);
      setNewPost({ title: "", content: "", tags: [], images: [] });
      setNewTag("");
      // Reload posts
      const updatedPosts = await authAPI.getCommunityPosts(communityId);
      setPosts(updatedPosts);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      alert(errorMessage);
    }
  };

  const handleVote = async (postId: number, voteType: 'upvote' | 'downvote') => {
    try {
      await authAPI.voteOnCommunityPost(communityId, postId, voteType);
      // Reload posts to update vote counts
      const updatedPosts = await authAPI.getCommunityPosts(communityId);
      setPosts(updatedPosts);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to vote';
      alert(errorMessage);
    }
  };

  const handleEditCommunity = () => {
    if (!community) return;
    setEditCommunityData({
      name: community.name,
      description: community.description || "",
      skills: community.skills || []
    });
    setIsEditingCommunity(true);
  };

  const handleSaveCommunity = async () => {
    if (!community || !editCommunityData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await authAPI.updateCommunity(community.id, editCommunityData);
      await loadCommunityData();
      setIsEditingCommunity(false);
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to update community. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;
    
    if (!confirm(`Are you sure you want to delete "${community.name}"? This will delete all posts and cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.deleteCommunity(community.id);
      router.push('/community');
    } catch (error) {
      console.error('Error deleting community:', error);
      alert('Failed to delete community. Please try again.');
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !editCommunityData.skills.includes(skillInput.trim())) {
      setEditCommunityData({
        ...editCommunityData,
        skills: [...editCommunityData.skills, skillInput.trim()]
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditCommunityData({
      ...editCommunityData,
      skills: editCommunityData.skills.filter(s => s !== skillToRemove)
    });
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
            Loading community...
          </p>
        </div>
      </Layout>
    );
  }

  if (!community) {
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
            <span className="text-4xl mb-4 block">🏘️</span>
            <div className="text-lg" style={{ color: 'var(--color-tertiary)' }}>Community not found</div>
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
        <div className="max-w-7xl mx-auto p-6">
          {/* Community Header */}
          <div 
            className="rounded-xl shadow-sm p-8 mb-6"
            style={{ 
              background: 'var(--color-neutral)',
              border: '1px solid var(--color-surface-dark)',
              animation: 'slideDown 0.5s ease-out'
            }}
          >
            {isEditingCommunity ? (
              /* Edit Mode */
              <div className="space-y-4">
                <h2 
                  className="text-2xl font-bold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--color-tertiary)' }}
                >
                  <span>✏️</span>
                  Edit Community
                </h2>
                
                <div>
                  <label 
                    className="block text-sm font-medium mb-1"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={editCommunityData.name}
                    onChange={(e) => setEditCommunityData({...editCommunityData, name: e.target.value})}
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
                    Description
                  </label>
                  <textarea
                    value={editCommunityData.description}
                    onChange={(e) => setEditCommunityData({...editCommunityData, description: e.target.value})}
                    rows={3}
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
                    Skills
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      placeholder="Add a skill..."
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
                      onClick={addSkill}
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
                    {editCommunityData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 text-sm rounded-full flex items-center gap-1 font-medium"
                        style={{
                          background: 'var(--color-surface-light)',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:scale-110 transition-transform"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCommunity}
                    disabled={isSubmitting || !editCommunityData.name.trim()}
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
                    onClick={() => setIsEditingCommunity(false)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
              <div className="flex items-start gap-6">
                {/* Community Icon */}
                <div 
                  className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                  }}
                >
                  <span className="text-white text-3xl font-bold">
                    {community.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Community Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-3">
                    <h1 
                      className="text-2xl sm:text-3xl font-bold"
                      style={{ color: 'var(--color-tertiary)' }}
                    >
                      {community.name}
                    </h1>
                    {currentUserId === community.createdById && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={handleEditCommunity}
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
                          onClick={handleDeleteCommunity}
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
                  <p 
                    className="mb-4"
                    style={{ color: 'var(--color-tertiary-light)' }}
                  >
                    {community.description}
                  </p>
                  
                  {/* Skills */}
                  {community.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {community.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 text-sm rounded-full font-medium"
                          style={{
                            background: 'var(--color-surface-light)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div 
                    className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm mb-4"
                    style={{ color: 'var(--color-tertiary-light)' }}
                  >
                    <span className="flex items-center gap-1">
                      <span>👥</span> {community._count.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📝</span> {community._count.posts} posts
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📅</span> {new Date(community.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {isMember ? (
                      <>
                        <button
                          onClick={() => router.push(`/community/${communityId}/discussions`)}
                          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                          style={{
                            background: 'var(--color-secondary)',
                            color: 'white',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          Discussions
                        </button>
                        <button
                          onClick={() => setShowCreatePost(true)}
                          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                          Create Post
                        </button>
                        <button
                          onClick={handleLeaveCommunity}
                          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                          Leave Community
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleJoinCommunity}
                        className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                        ✨ Join Community
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Posts Section */}
          <div 
            className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            style={{ animation: 'fadeInUp 0.7s ease-out' }}
          >
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div 
                className="rounded-xl shadow-sm"
                style={{ 
                  background: 'var(--color-neutral)',
                  border: '1px solid var(--color-surface-dark)'
                }}
              >
                {/* Posts Header */}
                <div 
                  className="p-6"
                  style={{ borderBottom: '1px solid var(--color-surface-dark)' }}
                >
                  <h2 
                    className="text-xl font-semibold flex items-center gap-2"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    <span>📋</span>
                    Recent Posts
                  </h2>
                </div>

                {/* Posts List */}
                <div style={{ borderTop: '1px solid var(--color-surface-dark)' }}>
                  {posts.length > 0 ? (
                    posts.map((post, index) => (
                      <div 
                        key={post.id} 
                        className="p-6 hover:bg-opacity-50 transition-all duration-200"
                        style={{ 
                          borderBottom: index < posts.length - 1 ? '1px solid var(--color-surface-dark)' : 'none',
                          animation: `fadeInUp ${0.8 + index * 0.1}s ease-out`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-surface)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div className="flex gap-4">
                          {/* Vote Buttons */}
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => handleVote(post.id, 'upvote')}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                background: post.userVote === 'upvote' ? 'var(--color-surface-light)' : 'var(--color-surface)',
                                border: post.userVote === 'upvote' ? '2px solid var(--color-primary)' : '1px solid var(--color-surface-dark)',
                                color: post.userVote === 'upvote' ? 'var(--color-primary)' : 'var(--color-tertiary-light)',
                              }}
                              disabled={!isMember}
                              title="Upvote"
                              aria-label="Upvote post"
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
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <span 
                              className="text-sm font-medium"
                              style={{ color: 'var(--color-tertiary)' }}
                            >
                              {post.upvotes - post.downvotes}
                            </span>
                            <button
                              onClick={() => handleVote(post.id, 'downvote')}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                background: post.userVote === 'downvote' ? 'var(--color-surface-light)' : 'var(--color-surface)',
                                border: post.userVote === 'downvote' ? '2px solid #ef4444' : '1px solid var(--color-surface-dark)',
                                color: post.userVote === 'downvote' ? '#ef4444' : 'var(--color-tertiary-light)',
                              }}
                              disabled={!isMember}
                              title="Downvote"
                              aria-label="Downvote post"
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
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Post Content */}
                          <div 
                            className="flex-1 cursor-pointer" 
                            onClick={() => router.push(`/community/${communityId}/post/${post.id}`)}
                          >
                            <h3 
                              className="text-lg font-semibold mb-2 transition-colors duration-200"
                              style={{ color: 'var(--color-tertiary)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--color-primary)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--color-tertiary)';
                              }}
                            >
                              {post.title}
                            </h3>
                            <p 
                              className="mb-3 line-clamp-3"
                              style={{ color: 'var(--color-tertiary-light)' }}
                            >
                              {post.content}
                            </p>
                            
                            {/* Post Images */}
                            {post.imageUrls && post.imageUrls.length > 0 && (
                              <div className="mb-3 flex gap-2 overflow-x-auto">
                                {post.imageUrls.slice(0, 3).map((imageUrl, index) => (
                                  <div 
                                    key={index} 
                                    className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105"
                                    style={{ background: 'var(--color-surface)' }}
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {post.imageUrls.length > 3 && (
                                  <div 
                                    className="w-24 h-24 flex-shrink-0 rounded-lg flex items-center justify-center text-sm font-medium"
                                    style={{
                                      background: 'var(--color-surface)',
                                      color: 'var(--color-tertiary-light)'
                                    }}
                                  >
                                    +{post.imageUrls.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {post.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 text-xs rounded-full font-medium"
                                    style={{
                                      background: 'var(--color-surface-light)',
                                      color: 'var(--color-primary)'
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div 
                              className="text-sm"
                              style={{ color: 'var(--color-tertiary-light)' }}
                            >
                              📅 {new Date(post.createdAt).toLocaleDateString()} • 👤 {post.userName || `User${post.userId}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div 
                      className="p-12 text-center"
                      style={{ animation: 'scaleIn 0.5s ease-out' }}
                    >
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ 
                          background: 'var(--color-surface)',
                          animation: 'float 3s ease-in-out infinite'
                        }}
                      >
                        <span className="text-4xl">📝</span>
                      </div>
                      <h3 
                        className="text-xl font-semibold mb-2"
                        style={{ color: 'var(--color-tertiary)' }}
                      >
                        No posts yet
                      </h3>
                      <p 
                        className="mb-6"
                        style={{ color: 'var(--color-tertiary-light)' }}
                      >
                        Be the first to start a discussion!
                      </p>
                      {isMember && (
                        <button
                          onClick={() => setShowCreatePost(true)}
                          className="px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:scale-105"
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
                          ✨ Create First Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div 
                className="rounded-xl shadow-sm p-6"
                style={{ 
                  background: 'var(--color-neutral)',
                  border: '1px solid var(--color-surface-dark)',
                  animation: 'fadeInUp 0.8s ease-out'
                }}
              >
                <h3 
                  className="text-lg font-semibold mb-4 flex items-center gap-2"
                  style={{ color: 'var(--color-tertiary)' }}
                >
                  <span>ℹ️</span>
                  Community Info
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-tertiary-light)' }}
                    >
                      👥 Members
                    </label>
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {community._count.members}
                    </p>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-tertiary-light)' }}
                    >
                      📝 Posts
                    </label>
                    <p 
                      className="text-2xl font-bold"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {community._count.posts}
                    </p>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-sm font-medium mb-1"
                      style={{ color: 'var(--color-tertiary-light)' }}
                    >
                      📅 Created
                    </label>
                    <p style={{ color: 'var(--color-tertiary)' }}>
                      {new Date(community.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div 
            className="rounded-xl max-w-2xl w-full p-6"
            style={{ 
              background: 'var(--color-neutral)',
              animation: 'scaleIn 0.3s ease-out'
            }}
          >
            <h3 
              className="text-xl font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-tertiary)' }}
            >
              <span>✨</span>
              Create New Post
            </h3>
            
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-tertiary-light)' }}
                >
                  📝 Title
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-dark)',
                    color: 'var(--color-tertiary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-surface-dark)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter post title"
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-tertiary-light)' }}
                >
                  💬 Content
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg transition-all"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-dark)',
                    color: 'var(--color-tertiary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-surface-dark)';
                    e.target.style.boxShadow = 'none';
                  }}
                  rows={6}
                  placeholder="Write your post content here..."
                />
              </div>

              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-tertiary-light)' }}
                >
                  🏷️ Tags <span style={{ color: 'var(--color-tertiary-light)', fontSize: '0.875rem' }}>(Optional)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTag.trim() && !newPost.tags.includes(newTag.trim())) {
                          setNewPost({...newPost, tags: [...newPost.tags, newTag.trim()]});
                          setNewTag("");
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-surface-dark)',
                      color: 'var(--color-tertiary)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-surface-dark)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !newPost.tags.includes(newTag.trim())) {
                        setNewPost({...newPost, tags: [...newPost.tags, newTag.trim()]});
                        setNewTag("");
                      }
                    }}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{ background: 'var(--color-primary)', color: 'white' }}
                  >
                    Add
                  </button>
                </div>
                {newPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newPost.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                        style={{
                          background: 'var(--color-surface-light)',
                          color: 'var(--color-primary)'
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setNewPost({...newPost, tags: newPost.tags.filter((_, i) => i !== index)})}
                          className="hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-tertiary-light)' }}
                >
                  🖼️ Images <span style={{ color: 'var(--color-tertiary-light)', fontSize: '0.875rem' }}>(Optional)</span>
                </label>
                <ArticleImageUpload
                  onImagesChange={(images) => setNewPost({...newPost, images})}
                  maxImages={5}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setNewTag("");
                }}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-tertiary)'
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                ✨ Create Post
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
