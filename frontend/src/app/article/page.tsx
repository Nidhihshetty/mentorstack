"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { authAPI, Article, ArticlesResponse } from "../../lib/auth-api";
import Layout from "../../components/Layout";

function ArticlesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<
        ArticlesResponse["pagination"] | null
    >(null);
    const [selectedCategory, setSelectedCategory] = useState(
        searchParams.get("category") || "All"
    );
    const [currentPage, setCurrentPage] = useState(1);

    const categories = [
        "All",
        "Web Development",
        "AI",
        "Cybersecurity",
        "IoT",
        "Frontend",
        "Backend",
        "NLP",
    ];

    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true);
            const category =
                selectedCategory === "All" ? undefined : selectedCategory;
            const response = await authAPI.getArticles(currentPage, 10, category);
            setArticles(response.articles);
            setPagination(response.pagination);
            setError(null);
        } catch (err) {
            console.error("Error fetching articles:", err);
            setError("Failed to load articles");
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, currentPage]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);

        // Update URL
        const url = new URL(window.location.href);
        if (category === "All") {
            url.searchParams.delete("category");
        } else {
            url.searchParams.set("category", category);
        }
        window.history.pushState({}, "", url.toString());
    };

    const handleVote = async (
        articleId: number,
        voteType: "upvote" | "downvote"
    ) => {
        try {
            await authAPI.voteOnArticle(articleId, voteType);
            // Refresh articles to get updated vote counts
            fetchArticles();
        } catch (err) {
            console.error("Error voting on article:", err);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const truncateContent = (content: string, maxLength: number = 150) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + "...";
    };

    return (
        <Layout>
            <div className="min-h-screen bg-[var(--color-neutral-dark)]">
                <div className="max-w-6xl mx-auto p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-tertiary)]">
                            Articles
                        </h1>
                        <button
                            onClick={() => router.push("/create-article")}
                            className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                        >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Create a Post
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                            : "bg-[var(--color-neutral-light)] text-[var(--color-tertiary)] border border-slate-600 hover:bg-slate-700"
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                            <p className="text-[var(--color-tertiary)] mt-4">
                                Loading articles...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--color-tertiary)] mb-2">
                                Failed to load articles
                            </h3>
                            <p className="text-slate-400 mb-4">{error}</p>
                            <button
                                onClick={fetchArticles}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-[var(--color-neutral-light)] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📝</span>
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--color-tertiary)] mb-2">
                                No articles found
                            </h3>
                            <p className="text-slate-400 mb-6">
                                {selectedCategory === "All"
                                    ? "Be the first to create an article!"
                                    : `No articles in ${selectedCategory} category yet.`}
                            </p>
                            <button
                                onClick={() => router.push("/create-post")}
                                className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition"
                            >
                                Create First Article
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {articles.map((article) => (
                                <div
                                    key={article.id}
                                    className="bg-[var(--color-neutral-light)] rounded-lg shadow-sm border border-slate-600 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-6">
                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-center text-sm text-slate-400 mb-2">
                                                <svg
                                                    className="w-4 h-4 mr-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                {formatDate(article.createdAt)}
                                            </div>

                                            <h3 className="text-xl font-semibold text-[var(--color-tertiary)] mb-3 hover:text-emerald-400 cursor-pointer">
                                                {article.title}
                                            </h3>

                                            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                                                {truncateContent(article.content)}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span>by {article.authorName}</span>

                                                    <div className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.476L3 21l1.476-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
                                                            />
                                                        </svg>
                                                        <span>0 Comments</span>
                                                    </div>
                                                </div>

                                                {/* Vote buttons */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleVote(article.id, "upvote")}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm border border-slate-600 rounded-full hover:bg-slate-700 transition-colors text-[var(--color-tertiary)]"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 15l7-7 7 7"
                                                            />
                                                        </svg>
                                                        {article.upvotes}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVote(article.id, "downvote")}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm border border-slate-600 rounded-full hover:bg-slate-700 transition-colors text-[var(--color-tertiary)]"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                        {article.downvotes}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Article Image */}
                                        {article.imageUrls && article.imageUrls.length > 0 && (
                                            <div className="flex-shrink-0">
                                                <Image
                                                    src={article.imageUrls[0]}
                                                    alt={article.title}
                                                    width={200}
                                                    height={150}
                                                    className="w-50 h-38 object-cover rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.max(1, prev - 1))
                                    }
                                    disabled={!pagination.hasPrevPage}
                                    className="px-4 py-2 text-sm border border-slate-600 bg-[var(--color-neutral-light)] text-[var(--color-tertiary)] rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="px-4 py-2 text-sm text-slate-400">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>

                                <button
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="px-4 py-2 text-sm border border-slate-600 bg-[var(--color-neutral-light)] text-[var(--color-tertiary)] rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default function Articles() {
    return (
        <Suspense fallback={
            <Layout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-slate-400">Loading articles...</div>
                </div>
            </Layout>
        }>
            <ArticlesContent />
        </Suspense>
    );
}
