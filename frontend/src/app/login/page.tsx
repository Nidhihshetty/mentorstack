"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authAPI } from "@/lib/auth-api";
import gsap from "gsap";

export default function LoginPage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current.children, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      });
    }
  }, []);

  const handleSignupClick = () => {
    router.push('/role-selection');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authAPI.login({ email, password });
      // Login successful, redirect to home page for all users
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 p-4">
      <div ref={containerRef} className="flex flex-col md:flex-row w-full max-w-5xl min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Section - Form */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-dark mb-2">
            {tab === "login" ? "Welcome back" : "Create Account"}
          </h1>
          <p className="text-secondary-light mb-10">
            {tab === "login"
              ? "Please sign in to your account"
              : "Join MentorStack today"}
          </p>

          {/* Tabs */}
          <div className="flex mb-8 bg-slate-50 rounded-xl p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                tab === "login"
                  ? "bg-white text-secondary-dark shadow"
                  : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                tab === "signup"
                  ? "bg-white text-secondary-dark shadow"
                  : "text-slate-500"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          {tab === "login" ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block mb-2 font-medium text-primary-dark">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-primary-dark">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  required
                />
                <Link
                  href="/forgot-password"
                  className="text-primary text-sm font-medium float-right mt-2 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-4 bg-gradient-to-r bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border-2 border-slate-100">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Ready to get started?</h3>
                <p className="text-slate-600 mb-6">
                  Choose your role to create a personalized experience tailored just for you.
                </p>
                <button
                  onClick={handleSignupClick}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  Choose Your Role & Sign Up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Branding */}
        <div className="flex-1 bg-gradient-to-br bg-surface flex flex-col items-center justify-center relative p-6 sm:p-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br bg-primary rounded-2xl shadow-xl flex items-center justify-center mb-6">
            <span className="text-3xl sm:text-4xl font-extrabold text-neutral">MS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mb-2">MentorStack</h2>
          <p className="text-sm sm:text-base text-emerald-700 font-medium text-center">
            Empowering growth through mentorship
          </p>
          <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 opacity-10" />
        </div>
      </div>
    </div>
  );
}
