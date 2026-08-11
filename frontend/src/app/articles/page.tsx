'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Article as APIArticle, authAPI, Tag } from '@/lib/auth-api';
import Layout from '@/components/Layout';
import gsap from 'gsap';
import { Eye, X, Plus } from 'lucide-react';

function ArticlesPageContent() {
  const [articles, setArticles] = useState<APIArticle[]>([]);
  const [categories, setCategories] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userVotes, setUserVotes] = useState<Record<number, 'upvote' | 'downvote' | null>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const articlesGridRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && articlesGridRef.current) {
      gsap.from(articlesGridRef.current.children, {
        opacity: 0,
        scale: 0.95,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [loading, articles]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [articlesResponse, categoriesData] = await Promise.all([
          authAPI.getArticles(1, 10, selectedCategory === 'All' ? undefined : selectedCategory),
          authAPI.getPopularTags()
        ]);
        setArticles(articlesResponse.articles);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Check if there's a category in URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [selectedCategory, searchParams]);

  const fetchArticles = async (category?: string) => {
    try {
      const response = await authAPI.getArticles(1, 10, category);
      setArticles(response.articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const handleVote = async (articleId: number, voteType: 'upvote' | 'downvote') => {
    try {
      await authAPI.voteOnArticle(articleId, voteType);

      // Update user vote state
      const currentVote = userVotes[articleId];
      const newVote = currentVote === voteType ? null : voteType;
      setUserVotes(prev => ({ ...prev, [articleId]: newVote }));

      // Refresh articles to get updated vote counts
      fetchArticles(selectedCategory === 'All' ? undefined : selectedCategory);
    } catch (error) {
      console.error('Error voting on article:', error);
    }
  };

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      await fetchArticles(category === 'All' ? undefined : category);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    // Filter by category
    const categoryMatch = selectedCategory === 'All' || (
      article.tags && article.tags.some(tag =>
        tag.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    );

    // Filter by search query
    const searchMatch = searchQuery === '' || (
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return categoryMatch && searchMatch;
  });

  const getCategoryFromTitle = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('react') || titleLower.includes('javascript') || titleLower.includes('frontend')) return 'Frontend';
    if (titleLower.includes('node') || titleLower.includes('api') || titleLower.includes('database')) return 'Backend';
    if (titleLower.includes('ai') || titleLower.includes('machine learning')) return 'AI';
    return 'Web Development';
  };

  const getArticleImage = (article: APIArticle) => {
    // Use Cloudinary image if it exists
    if (article.imageUrls && article.imageUrls.length > 0) {
      return article.imageUrls[0];
    }

    // Fallback to placeholder images for variety
    const images = [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Programming
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Code
      'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Data
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Charts
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Web design
    ];
    return images[article.id % images.length];
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: 'var(--color-tertiary)' }}>Articles</h1>
            <Link href="/create-article">
              <button
                className="px-4 sm:px-6 py-2 sm:py-3 flex flex-row justify-center items-center gap-1 rounded-lg transition-colors font-medium text-sm sm:text-base text-white hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {/* <Plus className="w-4 h-4 text-black drop-shadow-lg" />*/} Create a Post
              </button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{ color: 'var(--color-tertiary-light)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search articles by title, content, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border rounded-lg leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  color: 'var(--color-tertiary)'
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCategoryChange('All')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedCategory === 'All' ? 'shadow-md' : 'hover:bg-opacity-10'
                  }`}
                style={{
                  backgroundColor: selectedCategory === 'All' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: selectedCategory === 'All' ? 'var(--color-neutral)' : 'var(--color-secondary)'
                }}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedCategory === category.name ? 'shadow-md' : 'hover:bg-opacity-10'
                    }`}
                  style={{
                    backgroundColor: selectedCategory === category.name ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: selectedCategory === category.name ? 'var(--color-neutral)' : 'var(--color-secondary)'
                  }}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid gap-6">
            {filteredArticles.map(article => (
              <Link 
                key={article.id}
                href={`/article/${article.id}`}
                className="rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border block"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)'
                }}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs" style={{ color: 'var(--color-tertiary-light)' }}>
                        📅 {new Date(article.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 leading-tight" style={{ color: 'var(--color-tertiary)' }}>
                      {article.title}
                    </h2>

                    <p className="mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-tertiary-light)' }}>
                      {article.content.replace(/[#*`]/g, '').substring(0, 180)}...
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: 'var(--color-surface-light)',
                            color: 'var(--color-secondary)'
                          }}
                        >
                          {getCategoryFromTitle(article.title)}
                        </span>
                        <span
                          className="px-3 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-neutral)'
                          }}
                        >
                          By {article.authorName}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Vote Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVote(article.id, 'upvote');
                            }}
                            className={`p-2 rounded-lg transition-colors ${userVotes[article.id] === 'upvote'
                                ? 'border-2'
                                : ''
                              }`}
                            style={{
                              color: userVotes[article.id] === 'upvote' ? '#7c3aed' : 'var(--color-tertiary-light)',
                              backgroundColor: userVotes[article.id] === 'upvote' ? '#f3e8ff' : 'transparent',
                              borderColor: userVotes[article.id] === 'upvote' ? '#c4b5fd' : 'transparent'
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVote(article.id, 'downvote');
                            }}
                            className={`p-2 rounded-lg transition-colors ${userVotes[article.id] === 'downvote'
                                ? 'border-2'
                                : ''
                              }`}
                            style={{
                              color: userVotes[article.id] === 'downvote' ? '#dc2626' : 'var(--color-tertiary-light)',
                              backgroundColor: userVotes[article.id] === 'downvote' ? '#fee2e2' : 'transparent',
                              borderColor: userVotes[article.id] === 'downvote' ? '#fca5a5' : 'transparent'
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
                    </div>
                  </div>

                  {/* Image with Preview */}
                  <div
                    className="w-full sm:w-48 h-40 sm:h-40 bg-gradient-to-br from-teal-100 to-emerald-100 flex-shrink-0 relative group"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const imageUrl = getArticleImage(article);
                      if (imageUrl) setPreviewImage(imageUrl);
                    }}
                  >
                    <Image
                      src={getArticleImage(article)}
                      alt={article.title}
                      width={192}
                      height={160}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center cursor-pointer">
                      <div className="transform scale-0 group-hover:scale-100 transition-transform duration-200">
                        <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                        <p className="text-white text-xs font-semibold mt-1 text-center">Preview</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-16">
              <div className="text-xl font-medium" style={{ color: 'var(--color-tertiary)' }}>📄 No articles found</div>
              <p className="mt-2" style={{ color: 'var(--color-tertiary-light)' }}>Try adjusting your search or filter criteria</p>
            </div>
          )}
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

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        </div>
      </Layout>
    }>
      <ArticlesPageContent />
    </Suspense>
  );
}