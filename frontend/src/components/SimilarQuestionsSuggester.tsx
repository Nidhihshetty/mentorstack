'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface SimilarQuestion {
    id: number;
    title: string;
    body: string;
    authorName: string;
    answerCount: number;
    createdAt: string;
}

interface SimilarQuestionsSuggesterProps {
    questionText: string;
    onQuestionClick?: (questionId: number) => void;
    className?: string;
}

export default function SimilarQuestionsSuggester({ 
    questionText, 
    onQuestionClick,
    className = '' 
}: SimilarQuestionsSuggesterProps) {
    const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const router = useRouter();

    // Debounced search for similar questions
    const searchSimilar = useCallback(async (text: string) => {
        if (!text || text.trim().length < 10) {
            setSimilarQuestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/similar-questions`, {
                questionText: text
            });

            const questions = Array.isArray(response.data?.similarQuestions) 
                ? response.data.similarQuestions 
                : [];

            setSimilarQuestions(questions);
        } catch (error) {
            console.error('Error fetching similar questions:', error);
            setSimilarQuestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce the search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchSimilar(questionText);
        }, 1000); // Wait 1 second after user stops typing

        return () => clearTimeout(timeoutId);
    }, [questionText, searchSimilar]);

    const handleQuestionClick = (questionId: number) => {
        if (onQuestionClick) {
            onQuestionClick(questionId);
        } else {
            router.push(`/questions/${questionId}`);
        }
    };

    if (similarQuestions.length === 0 && !isLoading) {
        return null;
    }

    return (
        <div className={`bg-primary-100 border border-primary animate-fade-in rounded-lg p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-black">
                        {isLoading ? 'Finding similar questions...' : 'Similar questions found'}
                    </h3>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-black hover:text-black transition-colors"
                >
                    <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-black">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Checking for duplicates...
                </div>
            )}

            {/* Similar Questions List */}
            {isExpanded && !isLoading && similarQuestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-black mb-3">
                        Your question might already have an answer. Check these similar questions first:
                    </p>
                    {similarQuestions.map((q) => (
                        <div
                            key={q.id}
                            onClick={() => handleQuestionClick(q.id)}
                            className="bg-white border border-primary rounded-lg p-3 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-3">
                                <div className=" bg-red-50 flex-shrink-0 mt-1">
                                    <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold">
                                        {q.answerCount}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                        {q.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                        {q.body}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>by {q.authorName}</span>
                                        <span>•</span>
                                        <span>{q.answerCount} {q.answerCount === 1 ? 'answer' : 'answers'}</span>
                                        <span>•</span>
                                        <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <svg 
                                        className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
