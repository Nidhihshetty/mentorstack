"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";
import { authAPI, Community, CommunityCategory } from "@/lib/auth-api";

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    skills: [] as string[]
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [communitiesData, categoriesData] = await Promise.all([
        authAPI.getCommunities(),
        authAPI.getCommunityCategories()
      ]);
      setCommunities(communitiesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await authAPI.searchCommunities(searchQuery);
      setCommunities(searchResults);
    } catch (error) {
      console.error('Error searching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async () => {
    try {
      if (!newCommunity.name.trim()) {
        alert('Community name is required');
        return;
      }

      await authAPI.createCommunity(newCommunity);
      setShowCreateModal(false);
      setNewCommunity({ name: "", description: "", skills: [] });
      setSkillInput("");
      loadData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create community';
      alert(errorMessage);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !newCommunity.skills.includes(skillInput.trim())) {
      setNewCommunity({
        ...newCommunity,
        skills: [...newCommunity.skills, skillInput.trim()]
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setNewCommunity({
      ...newCommunity,
      skills: newCommunity.skills.filter(s => s !== skill)
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
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
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
            Loading communities...
          </p>
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
      <div 
        className="min-h-screen"
        style={{ background: 'var(--color-neutral-dark)' }}
      >
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div 
            className="mb-8 rounded-xl p-6"
            style={{ 
              background: 'var(--color-neutral)',
              border: '1px solid var(--color-surface-dark)',
              animation: 'slideDown 0.5s ease-out'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl" style={{ animation: 'float 3s ease-in-out infinite' }}>
                    👥
                  </span>
                  <h1 
                    className="text-3xl font-bold"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    Communities
                  </h1>
                </div>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Connect with like-minded developers and learn together
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
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
                Create Community
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div 
            className="mb-8 rounded-xl p-6"
            style={{ 
              background: 'var(--color-neutral)',
              border: '1px solid var(--color-surface-dark)',
              animation: 'fadeInUp 0.6s ease-out'
            }}
          >
            <div className="flex gap-4 max-w-2xl">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5" 
                    style={{ color: 'var(--color-tertiary-light)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search communities..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
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
              <button
                onClick={handleSearch}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                🔍 Search
              </button>
            </div>
          </div>

          {/* Categories */}
          <div 
            className="mb-8 rounded-xl p-6"
            style={{ 
              background: 'var(--color-neutral)',
              border: '1px solid var(--color-surface-dark)',
              animation: 'fadeInUp 0.7s ease-out'
            }}
          >
            <h2 
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-tertiary)' }}
            >
              <span>🏷️</span>
              Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 12).map((category, index) => (
                <button
                  key={category.name}
                  onClick={() => setSearchQuery(category.name)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-dark)',
                    color: 'var(--color-tertiary)',
                    animation: `fadeInUp ${0.8 + index * 0.05}s ease-out`
                  }}
                  title={`${category.count} communities have this skill`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface)';
                    e.currentTarget.style.color = 'var(--color-tertiary)';
                    e.currentTarget.style.borderColor = 'var(--color-surface-dark)';
                  }}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community, index) => (
              <div 
                key={community.id} 
                className="rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                style={{ 
                  background: 'var(--color-neutral)',
                  border: '1px solid var(--color-surface-dark)',
                  animation: `fadeInUp ${0.9 + index * 0.1}s ease-out`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-surface-dark)';
                }}
              >
                {/* Community Header */}
                <div className="mb-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                    }}
                  >
                    <span className="text-white text-2xl font-bold">
                      {community.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    {community.name}
                  </h3>
                  <p 
                    className="text-sm line-clamp-3"
                    style={{ color: 'var(--color-tertiary-light)' }}
                  >
                    {community.description}
                  </p>
                </div>

                {/* Skills */}
                {community.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {community.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs rounded-full font-medium"
                          style={{
                            background: 'var(--color-surface-light)',
                            color: 'var(--color-primary)',
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                      {community.skills.length > 3 && (
                        <span 
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            background: 'var(--color-surface)',
                            color: 'var(--color-tertiary-light)',
                          }}
                        >
                          +{community.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div 
                  className="flex items-center justify-between text-sm mb-4 pb-4"
                  style={{ 
                    color: 'var(--color-tertiary-light)',
                    borderBottom: '1px solid var(--color-surface-dark)'
                  }}
                >
                  <span className="flex items-center gap-1">
                    <span>👥</span> {community._count.members} members
                  </span>
                  <span className="flex items-center gap-1">
                    <span>📝</span> {community._count.posts} posts
                  </span>
                </div>

                {/* Action */}
                <Link href={`/community/${community.id}`}>
                  <button 
                    className="w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                    View Community →
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {communities.length === 0 && (
            <div 
              className="text-center py-12"
              style={{ animation: 'scaleIn 0.5s ease-out' }}
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ 
                  background: 'var(--color-surface)',
                  animation: 'float 3s ease-in-out infinite'
                }}
              >
                <span className="text-4xl">🏘️</span>
              </div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--color-tertiary)' }}
              >
                No communities found
              </h3>
              <p 
                className="mb-6"
                style={{ color: 'var(--color-tertiary-light)' }}
              >
                Be the first to create a community!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
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
                ➕ Create Community
              </button>
            </div>
          )}

          {/* Create Community Modal */}
          {showCreateModal && (
            <div 
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              style={{ 
                background: 'rgba(0, 0, 0, 0.7)',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <div 
                className="rounded-xl max-w-md w-full p-6"
                style={{ 
                  background: 'var(--color-neutral)',
                  border: '1px solid var(--color-surface-dark)',
                  animation: 'scaleIn 0.3s ease-out'
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">✨</span>
                  <h3 
                    className="text-xl font-semibold"
                    style={{ color: 'var(--color-tertiary)' }}
                  >
                    Create New Community
                  </h3>
                </div>
              
                <div className="space-y-4">
                  <div>
                    <label 
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-tertiary)' }}
                    >
                      Community Name
                    </label>
                    <input
                      type="text"
                      value={newCommunity.name}
                      onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all duration-200"
                      placeholder="Enter community name"
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
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-tertiary)' }}
                    >
                      Description
                    </label>
                    <textarea
                      value={newCommunity.description}
                      onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all duration-200"
                      rows={3}
                      placeholder="Describe your community"
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
                      className="block text-sm font-medium mb-2"
                      style={{ color: 'var(--color-tertiary)' }}
                    >
                      Skills/Topics
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 px-3 py-2 rounded-lg focus:outline-none transition-all duration-200"
                        placeholder="Add a skill or topic"
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
                        onClick={addSkill}
                        className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newCommunity.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs rounded-full flex items-center gap-1 font-medium"
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
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-surface-dark)',
                      color: 'var(--color-tertiary)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCommunity}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
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
                    ✨ Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
