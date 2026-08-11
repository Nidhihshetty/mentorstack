"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authAPI } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl(null);
    setIsLoading(true);

    try {
      const response = await authAPI.requestPasswordReset(email.trim());
      setMessage(response.message);
      if (response.resetUrl) {
        setResetUrl(response.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-secondary-dark mb-2">Forgot Password</h1>
        <p className="text-secondary-light mb-6">
          Enter your account email and we will send you a password reset link.
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm space-y-2">
              <p>{message}</p>
              {resetUrl && (
                <a
                  href={resetUrl}
                  className="text-emerald-700 font-medium underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open reset link
                </a>
              )}
            </div>
          )}

          <div>
            <label className="block mb-2 font-medium text-primary-dark">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Remembered your password?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
