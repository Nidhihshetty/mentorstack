"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRole = "mentor" | "mentee";

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      // Navigate to signup with role parameter
      router.push(`/signup?role=${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <span className="text-xl sm:text-2xl font-extrabold text-white">MS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
            Welcome to MentorStack
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose your role to get started. You can always change this later in your profile settings.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Mentee Card */}
          <div
            onClick={() => handleRoleSelect("mentee")}
            className={`p-8 rounded-2xl border-3 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              selectedRole === "mentee"
                ? "border-emerald-500 bg-emerald-50 shadow-xl"
                : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg"
            }`}
          >
            <div className="text-center">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
                selectedRole === "mentee"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}>
                🎓
              </div>
              
              {/* Title */}
              <h3 className={`text-2xl font-bold mb-4 ${
                selectedRole === "mentee" ? "text-emerald-700" : "text-slate-700"
              }`}>
                I want to Learn
              </h3>
              
              {/* Role Badge */}
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
                selectedRole === "mentee"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}>
                Mentee
              </div>
              
              {/* Description */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                I'm looking for guidance, advice, and support to grow in my career or personal development journey.
              </p>
              
              {/* Features */}
              <ul className="text-left space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Ask questions to experienced mentors
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Get personalized career guidance
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Join learning communities
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Track your progress and achievements
                </li>
              </ul>
            </div>
          </div>

          {/* Mentor Card */}
          <div
            onClick={() => handleRoleSelect("mentor")}
            className={`p-8 rounded-2xl border-3 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              selectedRole === "mentor"
                ? "border-blue-500 bg-blue-50 shadow-xl"
                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg"
            }`}
          >
            <div className="text-center">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
                selectedRole === "mentor"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}>
                🎯
              </div>
              
              {/* Title */}
              <h3 className={`text-2xl font-bold mb-4 ${
                selectedRole === "mentor" ? "text-blue-700" : "text-slate-700"
              }`}>
                I want to Mentor
              </h3>
              
              {/* Role Badge */}
              <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${
                selectedRole === "mentor"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}>
                Mentor
              </div>
              
              {/* Description */}
              <p className="text-slate-600 mb-6 leading-relaxed">
                I have experience and knowledge to share, and I want to help others grow and succeed in their journey.
              </p>
              
              {/* Features */}
              <ul className="text-left space-y-3 text-slate-600">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Share your expertise and experience
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Guide aspiring professionals
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Create educational content
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Build your reputation and network
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              selectedRole
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Continue as {selectedRole === "mentor" ? "Mentor" : selectedRole === "mentee" ? "Mentee" : "..."}
          </button>
          
          {/* Back to Login */}
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-slate-500 hover:text-slate-700 font-medium"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
