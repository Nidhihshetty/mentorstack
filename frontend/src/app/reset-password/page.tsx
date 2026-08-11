"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/lib/auth-api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.resetPassword(token, password);
      setMessage(response.message);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-secondary-dark mb-2">Reset Password</h1>
        <p className="text-secondary-light mb-6">
          Set a new password for your account.
        </p>

        {!token && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Invalid or missing reset token. Request a new password reset link.
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
              {message}
            </div>
          )}

          <div>
            <label className="block mb-2 font-medium text-primary-dark">New password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-primary-dark">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-secondary transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Updating..." : "Reset password"}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-600 space-y-2">
          <p>
            Need a new reset link?{" "}
            <Link href="/forgot-password" className="text-primary font-medium hover:underline">
              Forgot password
            </Link>
          </p>
          <p>
            Back to{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center text-slate-600">
            Loading reset form...
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
