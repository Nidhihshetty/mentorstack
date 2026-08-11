'use client';

import React, { useState } from 'react';
import SimilarQuestionsSuggester from '@/components/SimilarQuestionsSuggester';

export default function SimilarQuestionsDemo() {
    const [questionText, setQuestionText] = useState('');

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Similar Questions Suggester Demo
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Type a question and see similar questions from the database appear automatically.
                        This helps reduce duplicate questions!
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Question
                            </label>
                            <textarea
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="e.g., How do I implement JWT authentication in Node.js?"
                                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                {questionText.length < 10 
                                    ? `Type at least ${10 - questionText.length} more characters to see suggestions`
                                    : '✓ Searching for similar questions...'
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Similar Questions Display */}
                <SimilarQuestionsSuggester questionText={questionText} />

                {/* Example Questions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                    <h3 className="font-semibold text-blue-900 mb-3">Try these example questions:</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setQuestionText('How do I implement JWT authentication in Node.js with Express?')}
                            className="block w-full text-left p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                            How do I implement JWT authentication in Node.js with Express?
                        </button>
                        <button
                            onClick={() => setQuestionText('What is the best way to connect React frontend to Express backend?')}
                            className="block w-full text-left p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                            What is the best way to connect React frontend to Express backend?
                        </button>
                        <button
                            onClick={() => setQuestionText('How can I use Prisma ORM with PostgreSQL database?')}
                            className="block w-full text-left p-3 bg-white hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                            How can I use Prisma ORM with PostgreSQL database?
                        </button>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">How it works:</h3>
                    <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">1.</span>
                            <span>AI analyzes your question semantically (not just keywords)</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">2.</span>
                            <span>Searches through recent 500 questions in database</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">3.</span>
                            <span>Shows top 5 most similar questions with answer counts</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-blue-600 mr-2">4.</span>
                            <span>Falls back to keyword matching if AI quota exceeded</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
