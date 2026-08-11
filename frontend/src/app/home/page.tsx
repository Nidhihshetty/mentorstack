"use client";

import { useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (featuresRef.current) {
      gsap.from(featuresRef.current.children, {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%"
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out"
      });
    }

    if (statsRef.current) {
      const stats = statsRef.current.querySelectorAll('.stat-item');
      gsap.from(stats, {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%"
        },
        scale: 0.5,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "back.out(1.7)"
      });
    }
  }, []);

  return (
    <Layout>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-neutral-dark)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section with fade-in animation */}
          <div className="text-center mb-12 sm:mb-16 animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-slideDown" style={{ color: 'var(--color-tertiary)' }}>
              About <span style={{ color: 'var(--color-primary)' }}>MentorStack</span>
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed animate-slideUp" style={{ color: 'var(--color-tertiary-light)' }}>
              Connecting aspiring developers with experienced mentors to accelerate learning, 
              share knowledge, and build meaningful professional relationships in the tech community.
            </p>
          </div>

          {/* Mission Section with slide-in animation */}
          <div 
            className="rounded-2xl shadow-sm border p-8 mb-12 animate-slideIn hover:shadow-lg transition-all duration-300"
            style={{
              backgroundColor: 'var(--color-neutral)',
              borderColor: 'var(--color-surface-dark)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="animate-slideInLeft">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--color-tertiary)' }}>Our Mission</h2>
                <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--color-tertiary-light)' }}>
                  We believe that learning is most effective when it&apos;s collaborative and guided. 
                  MentorStack bridges the gap between experienced developers and those just starting 
                  their journey, creating a supportive ecosystem where knowledge flows freely.
                </p>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--color-tertiary-light)' }}>
                  Our platform empowers mentees to ask questions, seek guidance, and connect with 
                  mentors who can provide personalized advice based on real-world experience.
                </p>
              </div>
              <div 
                className="bg-gradient-to-br rounded-2xl p-8 text-white animate-slideInRight hover:scale-105 transition-transform duration-300"
                style={{
                  backgroundImage: 'linear-gradient(to bottom right, var(--color-primary), #3b82f6)'
                }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-bounce">🚀</div>
                  <h3 className="text-2xl font-bold mb-4">Accelerate Your Growth</h3>
                  <p className="opacity-90">
                    Join thousands of developers who are learning, growing, and succeeding together.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid with stagger animation */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 animate-fadeIn" style={{ color: 'var(--color-tertiary)' }}>What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Q&A Platform */}
              <div 
                className="rounded-xl shadow-sm border p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  animationDelay: '0.1s'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Q&A Platform</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Ask technical questions and get detailed answers from experienced developers 
                  who&apos;ve faced similar challenges.
                </p>
              </div>

              {/* Mentorship Matching */}
              <div 
                className="rounded-xl shadow-sm border p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  animationDelay: '0.2s'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Mentorship Matching</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Connect with mentors who specialize in your areas of interest and can guide 
                  your learning journey.
                </p>
              </div>

              {/* Community Building */}
              <div 
                className="rounded-xl shadow-sm border p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  animationDelay: '0.3s'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Community Building</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Join specialized communities based on technologies, frameworks, and career paths 
                  that interest you.
                </p>
              </div>

              {/* Knowledge Sharing */}
              <div 
                className="rounded-xl shadow-sm border p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  animationDelay: '0.4s'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Knowledge Sharing</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Share your expertise through articles, tutorials, and by answering questions 
                  from fellow developers.
                </p>
              </div>

              {/* Career Guidance */}
              <div 
                className="rounded-xl shadow-sm border p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  animationDelay: '0.5s'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Career Guidance</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Get advice on career paths, interview preparation, and professional development 
                  from industry veterans.
                </p>
              </div>

              {/* Skill Development */}
              <div 
                className="rounded-xl shadow-sm border p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 animate-fadeInUp"
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  borderColor: 'var(--color-surface-dark)',
                  animationDelay: '0.6s'
                }}
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <svg className="w-6 h-6" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Skill Development</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  Access curated learning resources, coding challenges, and project ideas to 
                  enhance your technical skills.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Section with pulse animation */}
          <div 
            className="bg-gradient-to-r rounded-2xl p-8 mb-16 text-white animate-fadeIn hover:shadow-2xl transition-shadow duration-300"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--color-primary), #3b82f6)'
            }}
          >
            <h2 className="text-3xl font-bold text-center mb-12">Our Growing Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div className="animate-fadeInUp hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.1s' }}>
                <div className="text-4xl font-bold mb-2 animate-pulse">10K+</div>
                <div className="opacity-90">Active Developers</div>
              </div>
              <div className="animate-fadeInUp hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
                <div className="text-4xl font-bold mb-2 animate-pulse">50K+</div>
                <div className="opacity-90">Questions Answered</div>
              </div>
              <div className="animate-fadeInUp hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
                <div className="text-4xl font-bold mb-2 animate-pulse">5K+</div>
                <div className="opacity-90">Mentorship Connections</div>
              </div>
              <div className="animate-fadeInUp hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.4s' }}>
                <div className="text-4xl font-bold mb-2 animate-pulse">100+</div>
                <div className="opacity-90">Communities</div>
              </div>
            </div>
          </div>

          {/* Values Section with float animation */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 animate-fadeIn" style={{ color: 'var(--color-tertiary)' }}>Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center animate-fadeInUp hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.1s' }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float shadow-lg"
                  style={{ backgroundColor: 'var(--color-surface-light)' }}
                >
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Collaboration</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  We believe in the power of working together and learning from each other&apos;s experiences.
                </p>
              </div>
              <div className="text-center animate-fadeInUp hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--color-surface-light)',
                    animationDelay: '0.3s'
                  }}
                >
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Innovation</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  We encourage creative thinking and innovative solutions to complex problems.
                </p>
              </div>
              <div className="text-center animate-fadeInUp hover:scale-105 transition-transform duration-300" style={{ animationDelay: '0.3s' }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-float shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--color-surface-light)',
                    animationDelay: '0.6s'
                  }}
                >
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-tertiary)' }}>Growth</h3>
                <p style={{ color: 'var(--color-tertiary-light)' }}>
                  We foster an environment where continuous learning and personal development thrive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
