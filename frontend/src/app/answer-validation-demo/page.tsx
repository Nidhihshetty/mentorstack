"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, Loader2, Lightbulb, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface ValidationResult {
  addresses_question: "yes" | "partial" | "no";
  relevance_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_elements: string[];
  suggestions: string[];
  verdict: "excellent" | "good" | "needs_improvement" | "off_topic";
  summary: string;
}

export default function AnswerValidationDemo() {
  const [question, setQuestion] = useState(
    "How do I connect Node.js to PostgreSQL database?"
  );
  const [answer, setAnswer] = useState(
    "You can use the 'pg' library. First, install it with npm install pg. Then create a connection pool and query the database."
  );
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    if (!question.trim() || !answer.trim()) {
      setError("Please provide both question and answer");
      return;
    }

    setLoading(true);
    setError("");
    setValidation(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/validate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const data = await response.json();
      setValidation(data);
    } catch (err) {
      console.error(err);
      setError("Failed to validate answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "needs_improvement":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "off_topic":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "excellent":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "good":
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
      case "needs_improvement":
        return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case "off_topic":
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getAddressesQuestionBadge = (status: string) => {
    switch (status) {
      case "yes":
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✓ Addresses Question</span>;
      case "partial":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">⚠ Partially Addresses</span>;
      case "no":
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">✗ Off Topic</span>;
      default:
        return null;
    }
  };

  // Predefined test cases
  const testCases = [
    {
      name: "Good Answer",
      question: "How do I connect Node.js to PostgreSQL?",
      answer: "You can use the 'pg' library. Install it with npm install pg, then create a connection pool using new Pool() with your database credentials. Here's an example: const pool = new Pool({ host: 'localhost', database: 'mydb', user: 'user', password: 'pass' }). Use pool.query() to execute SQL queries.",
    },
    {
      name: "Off-Topic Answer",
      question: "How do I connect Node.js to PostgreSQL?",
      answer: "I prefer using MongoDB for my projects because it's more flexible and easier to set up.",
    },
    {
      name: "Incomplete Answer",
      question: "How do I handle authentication in Express.js?",
      answer: "Use JWT tokens.",
    },
    {
      name: "Excellent Answer",
      question: "What's the difference between let and var in JavaScript?",
      answer: "The main differences are: 1) Scope - var is function-scoped while let is block-scoped. 2) Hoisting - var declarations are hoisted and initialized with undefined, let declarations are hoisted but not initialized (temporal dead zone). 3) Re-declaration - var allows re-declaration in the same scope, let doesn't. Example: In a for loop, var i would be accessible outside the loop, but let i would not be.",
    },
  ];

  const loadTestCase = (testCase: typeof testCases[0]) => {
    setQuestion(testCase.question);
    setAnswer(testCase.answer);
    setValidation(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🎯 AI Answer Validation Demo
          </h1>
          <p className="text-lg text-gray-600">
            Check if answers actually address the question using AI
          </p>
        </div>

        {/* Test Cases */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Test Cases:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {testCases.map((testCase, idx) => (
              <button
                key={idx}
                onClick={() => loadTestCase(testCase)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
              >
                {testCase.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter the original question..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Answer to Validate
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
              placeholder="Enter the answer to validate..."
            />
          </div>

          <button
            onClick={handleValidate}
            disabled={loading || !question.trim() || !answer.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Answer...
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                Validate Answer
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Validation Results */}
        {validation && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-fadeIn">
            {/* Verdict Header */}
            <div className={`rounded-xl border-2 p-6 mb-6 ${getVerdictColor(validation.verdict)}`}>
              <div className="flex items-center gap-4 mb-3">
                {getVerdictIcon(validation.verdict)}
                <div>
                  <h2 className="text-2xl font-bold capitalize">
                    {validation.verdict.replace("_", " ")}
                  </h2>
                  <p className="text-sm opacity-90 mt-1">{validation.summary}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4">
                {getAddressesQuestionBadge(validation.addresses_question)}
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Relevance Score: {validation.relevance_score}/10
                  </span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mt-4">
                <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${validation.relevance_score * 10}%`,
                      backgroundColor: validation.relevance_score >= 7 ? '#10b981' : validation.relevance_score >= 5 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              {validation.strengths.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-900">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {validation.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {validation.weaknesses.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Weaknesses</h3>
                  </div>
                  <ul className="space-y-2">
                    {validation.weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-orange-800 flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">⚠</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Elements */}
              {validation.missing_elements.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Missing Elements</h3>
                  </div>
                  <ul className="space-y-2">
                    {validation.missing_elements.map((element, idx) => (
                      <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">○</span>
                        <span>{element}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {validation.suggestions.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Suggestions</h3>
                  </div>
                  <ul className="space-y-2">
                    {validation.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-purple-800 flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">💡</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
