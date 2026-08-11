"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { authAPI, User, Question } from "@/lib/auth-api";
import gsap from "gsap";

export default function MenteeHomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Newest");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && cardsRef.current) {
      gsap.from(cardsRef.current.children, {
        opacity: 0,
        y: 30,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out"
      });
    }
  }, [loading, filteredQuestions]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user
        const userData = await authAPI.getCurrentUser();
        setUser(userData.user);

        // Allow both mentees and mentors to access questions page
        if (userData.user.role !== 'mentee' && userData.user.role !== 'mentor') {
          router.push('/home');
          return;
        }

        // Load questions from API
        const questionsData = await authAPI.getQuestions();
        setQuestions(questionsData);
        setFilteredQuestions(questionsData);

      } catch (error) {
        console.error('Error loading data:', error);
        // Redirect to login if unauthorized
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Filter and search logic
  useEffect(() => {
    let result = [...questions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.title.toLowerCase().includes(query) ||
          q.description?.toLowerCase().includes(query) ||
          q.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply active filter
    switch (activeFilter) {
      case "Newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "Unanswered":
        result = result.filter((q) => (q.answerCount || 0) === 0);
        break;
      default:
        break;
    }

    setFilteredQuestions(result);
  }, [questions, activeFilter, searchQuery]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Feed */}
      <section className="flex flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Questions Feed */}
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">
            Welcome to{" "}
            <span className="text-[var(--color-primary-dark)]">
              MentorStack
            </span>
            , {user?.name || (user?.role === 'mentor' ? 'Mentor' : 'Mentee')}
          </h2>

          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 text-sm sm:text-base rounded-lg border border-[var(--color-neutral-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-neutral)]"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              {["Newest", "Unanswered"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    tab === activeFilter
                      ? "bg-[var(--color-primary)] text-white shadow"
                      : "bg-[var(--color-neutral)] text-[var(--color-tertiary)] border border-[var(--color-neutral-dark)] hover:bg-[var(--color-neutral-dark)]"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <Link href="/ask-question">
                <button className="ml-auto bg-[var(--color-primary-dark)] text-[var(--color-neutral)] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg font-medium shadow-lg hover:bg-[var(--color-primary)] transition">
                  Ask Question
                </button>
              </Link>
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">
                {searchQuery ? "No questions found matching your search" : "No questions available"}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredQuestions.map((question) => (
            <div key={question.id} className="bg-[var(--color-neutral)] p-3 sm:p-4 md:p-6 rounded-xl shadow-md mb-4 sm:mb-6 hover:shadow-lg transition">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {/* Question Content */}
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-tertiary-light)] mb-2">
                    @{question.authorName}
                  </div>
                  <h3 
                    className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-[var(--color-tertiary)] hover:text-[var(--color-primary)] transition cursor-pointer"
                    onClick={() => router.push(`/questions/${question.id}`)}
                  >
                    {question.title}
                  </h3>
                  {question.description && (
                    <p className="text-[var(--color-tertiary-light)] text-sm leading-relaxed mb-3">
                      {question.description}
                    </p>
                  )}
                  <div className="flex gap-2 mb-3">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-medium bg-[var(--color-primary)] text-[var(--color-neutral)] rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-tertiary-light)]">
                    <span>{question.answerCount || 0} Answers</span>
                    <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      </section>
    </Layout>
  );
}
