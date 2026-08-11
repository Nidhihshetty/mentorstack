"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "../../lib/auth-api";
import Layout from "../../components/Layout";

interface TagData {
  name: string;
  articleCount: number;
  questionCount: number;
  communityCount: number;
  count: number;
  color: string;
}

export default function Tags() {
  const router = useRouter();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"popular" | "alphabetical" | "newest">("popular");

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const allTags = await authAPI.getAllTags();
      // Map the API response to TagData format
      const mappedTags = allTags.map(tag => ({
        name: tag.name,
        articleCount: tag.articleCount,
        questionCount: tag.questionCount,
        communityCount: tag.communityPostCount, // Backend still uses communityPostCount for now
        count: tag.totalCount,
        color: tag.color
      }));
      setTags(mappedTags);
      setError(null);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tags based on selected option
  const sortedTags = [...filteredTags].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        // Sort by total count (descending)
        return b.count - a.count;
      case "alphabetical":
        // Sort alphabetically by name
        return a.name.localeCompare(b.name);
      case "newest":
        // Sort by name (descending) as a proxy for newest since we don't have creation date
        // In a real implementation, you'd sort by creation timestamp
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const handleTagClick = (tagName: string) => {
    // Navigate to the unified tag detail page
    router.push(`/tags/${encodeURIComponent(tagName)}`);
  };

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
        {/* Header */}
        <div 
          className="shadow-sm"
          style={{ 
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-surface-dark)',
            animation: 'slideDown 0.5s ease-out'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-3xl sm:text-4xl" style={{ animation: 'float 3s ease-in-out infinite' }}>
                  🏷️
                </span>
                <h1 
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: 'var(--color-tertiary)' }}
                >
                  Explore Topics
                </h1>
              </div>
              <p 
                className="text-lg max-w-2xl mx-auto"
                style={{ color: 'var(--color-tertiary-light)' }}
              >
                Discover articles, questions, and community discussions organized by topics and skills
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div 
            className="rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: 'var(--color-neutral)',
              border: '1px solid var(--color-surface-dark)',
              animation: 'fadeInUp 0.6s ease-out'
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-lg">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg 
                      className="h-5 w-5 transition-colors duration-200" 
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
                    placeholder="Search topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 rounded-lg leading-5 focus:outline-none transition-all duration-200"
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
              </div>
              
              <div className="flex items-center gap-4">
                <span 
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ 
                    color: 'var(--color-primary)',
                    background: 'var(--color-surface-light)'
                  }}
                >
                  📊 {filteredTags.length} topics
                </span>
                <select 
                  title="Sort topics"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "popular" | "alphabetical" | "newest")}
                  className="rounded-lg px-4 py-2 text-sm focus:outline-none transition-all duration-200 cursor-pointer"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-dark)',
                    color: 'var(--color-tertiary)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-surface-dark)';
                  }}
                >
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {loading ? (
            <div 
              className="text-center py-12"
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
              <div 
                className="animate-spin rounded-full h-12 w-12 mx-auto mb-4"
                style={{ 
                  border: '3px solid var(--color-surface-dark)',
                  borderTopColor: 'var(--color-primary)'
                }}
              ></div>
              <p style={{ color: 'var(--color-tertiary-light)' }}>
                Loading topics...
              </p>
            </div>
          ) : error ? (
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
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--color-tertiary)' }}
              >
                Failed to load topics
              </h3>
              <p 
                className="mb-4"
                style={{ color: 'var(--color-tertiary-light)' }}
              >
                {error}
              </p>
              <button 
                onClick={fetchTags}
                className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
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
                🔄 Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedTags.map((tag, index) => (
                <div
                  key={index}
                  onClick={() => handleTagClick(tag.name)}
                  className={`${tag.color} rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group relative overflow-hidden`}
                  style={{ 
                    animation: `fadeInUp ${0.5 + index * 0.05}s ease-out`,
                    border: '1px solid var(--color-surface-dark)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-surface-dark)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                    }}
                  ></div>
                  
                  <div className="text-center relative z-10">
                    <div className="mb-3 text-2xl group-hover:scale-110 transition-transform duration-300">
                      🏷️
                    </div>
                    <h3 
                      className="font-bold mb-3 text-lg transition-colors duration-200"
                      style={{ color: 'var(--color-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-tertiary)';
                      }}
                    >
                      {tag.name}
                    </h3>
                    
                    {/* Total count badge */}
                    <div 
                      className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                      style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                      }}
                    >
                      {tag.count} {tag.count === 1 ? 'item' : 'items'}
                    </div>
                    
                    {/* Breakdown */}
                    <div 
                      className="text-xs space-y-1"
                      style={{ color: 'var(--color-tertiary-light)' }}
                    >
                      {tag.questionCount > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <span>❓</span>
                          <span>{tag.questionCount} question{tag.questionCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {tag.articleCount > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <span>📄</span>
                          <span>{tag.articleCount} article{tag.articleCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {tag.communityCount > 0 && (
                        <div className="flex items-center justify-center gap-1">
                          <span>👥</span>
                          <span>{tag.communityCount} post{tag.communityCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div 
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredTags.length === 0 && (
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
                <span className="text-4xl">🔍</span>
              </div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--color-tertiary)' }}
              >
                No topics found
              </h3>
              <p style={{ color: 'var(--color-tertiary-light)' }}>
                Try adjusting your search terms
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
