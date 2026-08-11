"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminAPI } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await adminAPI.login(email, password);
      // Login successful, redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700">
      <div className="flex w-full max-w-5xl min-h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Section - Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-secondary-dark mb-2">
            Admin Portal
          </h1>
          <p className="text-secondary-light mb-10">
            Please sign in to access admin dashboard
          </p>

          {/* Form */}
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
                placeholder="Enter your admin email"
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Admin Sign in"}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-xs text-yellow-700 text-center font-medium">
              🔒 This portal is restricted to authorized administrators only. All access attempts are logged.
            </p>
          </div>
        </div>

        {/* Right Section - Branding */}
        <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center relative">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl shadow-xl flex items-center justify-center mb-6">
            <span className="text-4xl font-extrabold text-white">🛡️</span>
          </div>
          <h2 className="text-3xl font-extrabold text-emerald-800 mb-2">Admin Dashboard</h2>
          <p className="text-emerald-700 font-medium">
            MentorStack Administration
          </p>
          {/* <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 opacity-10" /> */}
        </div>
      </div>
    </div>
  );
}
