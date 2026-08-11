"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import SpellingChecker from '../../components/SpellingChecker';
import SimilarQuestionsSuggester from '../../components/SimilarQuestionsSuggester';
import { authAPI } from '@/lib/auth-api';

const QuestionForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rephraseLoading, setRephraseLoading] = useState(false);
  const [rephrasedTitle, setRephrasedTitle] = useState('');
  const [showRephraseSuggestion, setShowRephraseSuggestion] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const router = useRouter();
  const handleSuggestTags = async () => {
    setSuggestLoading(true);
    setSuggestedTags([]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rectags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: title, content: description }),
      });
      const data = await res.json();
      setSuggestedTags(data.tags || []);
    } catch (err) {
      console.error("Error fetching suggested tags:", err);
    } finally {
      setSuggestLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        // Allow both mentors and mentees to ask questions
        if (userData.user.role !== 'mentee' && userData.user.role !== 'mentor') {
          router.push('/home');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const predefinedTags = ['node.js', 'express', 'authentication', 'typescript', 'api', 'react', 'database', 'frontend', 'backend', 'javascript', 'python', 'java', 'css', 'html'];
  const recommendedTags = ['api', 'security', 'jwt'];

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim()) && !predefinedTags.includes(newTag.trim())) {
      setSelectedTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRephraseTitle = async () => {
    if (!title.trim() || title.length < 10) return;

    setRephraseLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rephrase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: title }),
      });

      const data = await response.json();
      setRephrasedTitle(data.rephrasedText);
      setShowRephraseSuggestion(true);
    } catch (error) {
      console.error(error);
      setError('Failed to rephrase title. Please try again.');
    }
    setRephraseLoading(false);
  };

  const acceptRephrasedTitle = () => {
    setTitle(rephrasedTitle);
    setShowRephraseSuggestion(false);
    setRephrasedTitle('');
  };

  const dismissRephraseSuggestion = () => {
    setShowRephraseSuggestion(false);
    setRephrasedTitle('');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return title.trim().length > 10;
      case 2: return description.trim().length >= 20 && expectedOutcome.trim().length >= 20;
      case 3: return selectedTags.length > 0;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Submitting question:', { 
        title, 
        body: `${description}\n\nWhat I've tried:\n${expectedOutcome}`, 
        tags: selectedTags 
      });
      
      // Call the actual API
      const result = await authAPI.submitQuestion(
        title, 
        `${description}\n\nWhat I've tried:\n${expectedOutcome}`, 
        selectedTags
      );
      
      console.log('Question submitted successfully:', result);
      
      // Redirect to mentee home page after successful submission
      router.push('/mentee-home');
    } catch (err) {
      console.error('Failed to submit question:', err);
      setError('Failed to submit question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    "Title",
    "Details",
    "Tags"
  ];

  const stepSubtitles = [
    "Start with a clear, specific title that summarizes your problem",
    "Help others understand your situation with context and what you've tried",
    "Choose tags to help the right experts find your question"
  ];

  return (
    <Layout>
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-6 shadow-primary">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-tertiary mb-3">Ask Your Question</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get help from our community of developers and experts</p>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`progress-dot w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    step <= currentStep ? 'bg-primary active' : 'bg-gray-300'
                  }`}>
                    {step < currentStep ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step}
                  </div>
                  <div className="mt-3 text-center">
                    <div className={`font-semibold ${step <= currentStep ? 'text-primary' : 'text-gray-500'}`}>
                      Step {step}
                    </div>
                    <div className={`text-sm ${step <= currentStep ? 'text-gray-700' : 'text-gray-400'}`}>
                      {stepTitles[step - 1].split(' ').slice(0, 2).join(' ')}
                    </div>
                  </div>
                </div>
                {step < 3 && (
                  <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-500 ${
                    step < currentStep ? 'bg-primary' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="floating-card rounded-3xl p-8 md:p-12 animate-fade-in">
          {/* Step Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-tertiary mb-3">{stepTitles[currentStep - 1]}</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">{stepSubtitles[currentStep - 1]}</p>
          </div>

          {/* Step 1 - Question Title */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <label className="block text-lg font-semibold text-tertiary">
                  What&apos;s your question about?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., How do I implement JWT authentication in Node.js?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field w-full p-4 text-lg rounded-xl focus:outline-none pr-20"
                  />
                  {title.length >= 10 && (
                    <button
                      type="button"
                      onClick={handleRephraseTitle}
                      disabled={rephraseLoading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary-light hover:bg-primary-100 disabled:bg-primary-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      {rephraseLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden sm:inline">Rephrasing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="hidden sm:inline">Rephrase</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Rephrase Suggestion */}
                {showRephraseSuggestion && rephrasedTitle && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">AI Suggestion</h4>
                        <p className="text-blue-800 mb-3 leading-relaxed">{rephrasedTitle}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={acceptRephrasedTitle}
                            className="bg-primary-light hover:bg-primary-100 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Use This Title
                          </button>
                          <button
                            type="button"
                            onClick={dismissRephraseSuggestion}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Keep Original
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className={`${title.length >= 10 ? 'text-primary' : 'text-gray-400'}`}>
                    {title.length >= 10 ? '✓ Good length' : `${10 - title.length} more characters needed`}
                  </span>
                  <span className="text-gray-400">{title.length}/100</span>
                </div>
              </div>

              {/* Similar Questions Suggester */}
              <SimilarQuestionsSuggester 
                questionText={title + ' ' + description}
                className="animate-fade-in"
              />

              {/* Quick Tips */}
              <div className="glassmorphism rounded-2xl p-6">
                <h3 className="font-semibold text-tertiary mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Quick Tips
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Be specific about what you&apos;re trying to achieve
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Include relevant technologies (React, Node.js, etc.)
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Avoid yes/no questions - ask for explanations
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    Use the AI rephrase button to improve your title clarity
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2 - Details */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid md:grid-rows-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-tertiary">
                    Describe your problem
                  </label>
                  <SpellingChecker
                    value={description}
                    onChange={setDescription}
                    placeholder="Explain the context, what you're building, and what specific issue you're facing..."
                    rows={8}
                    className="input-field border-primary hover:border-primary-dark w-full p-4 rounded-xl resize-none focus:outline-none"
                  />
                  <div className={`text-sm ${description.length >= 20 ? 'text-primary' : 'text-gray-400'}`}>
                    {description.length >= 20 ? '✓ Great detail' : `${20 - description.length} more characters needed`}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-tertiary">
                    What have you tried?
                  </label>
                  <SpellingChecker
                    value={expectedOutcome}
                    onChange={setExpectedOutcome}
                    placeholder="Share your attempts, what you expected to happen, and what actually occurred..."
                    rows={8}
                    className="input-field w-full p-4 rounded-xl resize-none focus:outline-none"
                  />
                  <div className={`text-sm ${expectedOutcome.length >= 20 ? 'text-primary' : 'text-gray-400'}`}>
                    {expectedOutcome.length >= 20 ? '✓ Good context' : `${20 - expectedOutcome.length} more characters needed`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Tags */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-fade-in">
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-tertiary">Selected Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-primary-dark transition-colors"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggest Tags Button and AI Suggested Tags */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  disabled={suggestLoading || !title || !description}
                  className="bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors font-medium"
                >
                  {suggestLoading ? "Suggesting..." : "Suggest Tags"}
                </button>
                {suggestedTags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-tertiary mt-4">AI Suggested Tags</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {suggestedTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-primary text-white'
                              : 'bg-white text-primary border border-primary hover:bg-primary hover:text-white'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Popular Tags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-tertiary">Popular Tags</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`tag-button p-3 rounded-xl text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-primary text-white'
                          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1) {
                  router.push('/questions');
                } else {
                  setCurrentStep(prev => Math.max(1, prev - 1));
                }
              }}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? 'text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:text-red-700'
                  : 'text-primary hover:bg-primary hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <div className="flex items-center space-x-3">
              {currentStep < 3 && (
                <span className="text-sm text-gray-500">
                  Step {currentStep} of 3
                </span>
              )}
              <button
                type="button"
                onClick={currentStep === 3 ? handleSubmit : () => setCurrentStep(prev => Math.min(3, prev + 1))}
                disabled={!canProceed() || loading}
                className={`flex items-center px-8 py-3 rounded-xl font-medium transition-all ${
                  canProceed() && !loading
                    ? 'bg-primary text-white hover:bg-primary-dark shadow-primary'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Submitting...' : (currentStep === 3 ? 'Post Question' : 'Continue')}
                {!loading && (
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default QuestionForm;