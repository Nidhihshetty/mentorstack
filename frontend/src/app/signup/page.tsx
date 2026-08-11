"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "../../lib/auth-api";
import Image from "next/image";
import { Camera, X } from "lucide-react";

type UserRole = "mentor" | "mentee";

interface FormData {
  // Common fields
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  bio: string;
  location: string;
  skills: string[];
  avatar: File | null;
  
  // Role will be set from URL params
  role: UserRole | null;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') as UserRole | null;
  
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    bio: "",
    location: "",
    skills: [],
    avatar: null,
    role: roleParam
  });
  
  const [currentSkill, setCurrentSkill] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!roleParam || !['mentor', 'mentee'].includes(roleParam)) {
      router.push('/role-selection');
    } else {
      setFormData(prev => ({ ...prev, role: roleParam }));
    }
  }, [roleParam, router]);

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'Image must be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, avatar: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear error
      if (errors.avatar) {
        setErrors(prev => ({ ...prev, avatar: '' }));
      }
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: null }));
    setAvatarPreview(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (error) {
      setError(null);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    
    if (!formData.name) newErrors.name = "Name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.bio) newErrors.bio = "Bio is required";
    else if (formData.bio.length < 20) newErrors.bio = "Bio should be at least 20 characters";
    
    if (formData.skills.length === 0) newErrors.skills = "Please add at least one skill";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Split the name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const signupData = {
        email: formData.email,
        password: formData.password,
        role: formData.role as 'mentor' | 'mentee',
        firstName,
        lastName,
        skills: formData.skills,
        bio: formData.bio
      };

      console.log("Submitting signup data:", signupData);
      
      const response = await authAPI.signup(signupData);
      console.log("Signup successful:", response);
      
      // Upload avatar if one was selected
      if (formData.avatar && response.token) {
        try {
          const avatarFormData = new FormData();
          avatarFormData.append('avatar', formData.avatar);

          const avatarResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/upload/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${response.token}`
            },
            body: avatarFormData
          });

          if (!avatarResponse.ok) {
            console.error('Avatar upload failed, but signup was successful');
          } else {
            console.log('Avatar uploaded successfully');
          }
        } catch (avatarError) {
          console.error('Error uploading avatar:', avatarError);
          // Don't fail the whole signup if avatar upload fails
        }
      }
      
      // Redirect to home page on success
      router.push('/home');
    } catch (error) {
      console.error("Signup error:", error);
      setError(error instanceof Error ? error.message : 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleInfo = () => {
    return formData.role === 'mentor' 
      ? { 
          color: 'blue', 
          icon: '🎯', 
          title: 'Mentor Account',
          description: 'Share your expertise and guide others'
        }
      : { 
          color: 'emerald', 
          icon: '🎓', 
          title: 'Mentee Account',
          description: 'Learn and grow with expert guidance'
        };
  };

  if (!formData.role) {
    return <div>Loading...</div>;
  }

  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Section - Progress & Info */}
          <div className={`md:w-1/3 bg-gradient-to-br from-${roleInfo.color}-500 to-${roleInfo.color}-600 p-4 sm:p-6 md:p-8 text-white`}>
            <div className="mb-8">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-2xl mb-4">
                {roleInfo.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2">{roleInfo.title}</h2>
              <p className="text-white text-opacity-90">{roleInfo.description}</p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              <div className={`flex items-center gap-3 ${step >= 1 ? 'text-white' : 'text-white text-opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 1 ? 'bg-white text-' + roleInfo.color + '-500' : 'bg-white bg-opacity-20'
                }`}>
                  1
                </div>
                <span>Account Details</span>
              </div>
              <div className={`flex items-center gap-3 ${step >= 2 ? 'text-white' : 'text-white text-opacity-50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= 2 ? 'bg-white text-' + roleInfo.color + '-500' : 'bg-white bg-opacity-20'
                }`}>
                  2
                </div>
                <span>Profile Information</span>
              </div>
            </div>
          </div>

          {/* Right Section - Form */}
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                {step === 1 ? "Create Your Account" : "Complete Your Profile"}
              </h1>
              <p className="text-slate-600">
                {step === 1 
                  ? "Let's start with your basic account information"
                  : "Tell us more about yourself and your skills"
                }
              </p>
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-6">
              {step === 1 && (
                <>
                  {/* Step 1: Account Details */}
                  <div>
                    <label className="block mb-2 font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:outline-none focus:bg-white transition ${
                        errors.name ? 'border-red-500' : 'border-slate-200 focus:border-' + roleInfo.color + '-500'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-slate-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:outline-none focus:bg-white transition ${
                        errors.email ? 'border-red-500' : 'border-slate-200 focus:border-' + roleInfo.color + '-500'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a password"
                      className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:outline-none focus:bg-white transition ${
                        errors.password ? 'border-red-500' : 'border-slate-200 focus:border-' + roleInfo.color + '-500'
                      }`}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-slate-700">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:outline-none focus:bg-white transition ${
                        errors.confirmPassword ? 'border-red-500' : 'border-slate-200 focus:border-' + roleInfo.color + '-500'
                      }`}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Step 2: Profile Information */}
                  <div>
                    <label className="block mb-2 font-medium text-slate-700">
                      Bio {formData.role === 'mentor' ? '(Tell mentees about your experience)' : '(Tell mentors about your goals)'}
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder={
                        formData.role === 'mentor' 
                          ? "Describe your experience, expertise, and what you can help with..."
                          : "Tell us about your background, what you want to learn, and your goals..."
                      }
                      className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:outline-none focus:bg-white transition resize-none ${
                        errors.bio ? 'border-red-500' : 'border-slate-200 focus:border-' + roleInfo.color + '-500'
                      }`}
                    />
                    {errors.bio && <p className="text-red-500 text-sm mt-1">{errors.bio}</p>}
                  </div>

                  {/* Avatar Upload */}
                  <div>
                    <label className="block mb-2 font-medium text-slate-700">Profile Picture (Optional)</label>
                    <div className="flex items-center gap-6">
                      {/* Avatar Preview */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                          {avatarPreview ? (
                            <Image
                              src={avatarPreview}
                              alt="Avatar preview"
                              width={96}
                              height={96}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-${roleInfo.color}-400 to-${roleInfo.color}-500 text-white text-2xl font-bold`}>
                              {formData.name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={removeAvatar}
                            title="Remove avatar"
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1">
                        <label className={`inline-flex items-center gap-2 px-4 py-3 bg-${roleInfo.color}-500 hover:bg-${roleInfo.color}-600 text-white rounded-lg cursor-pointer transition font-medium`}>
                          <Camera size={20} />
                          {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-slate-500 mt-2">
                          JPG, PNG, GIF or WEBP. Max size 5MB.
                        </p>
                        {errors.avatar && <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-slate-700">Location (Optional)</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., San Francisco, CA"
                      className={`w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-${roleInfo.color}-500 focus:bg-white transition`}
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-slate-700">
                      Skills {formData.role === 'mentor' ? '(Your expertise)' : '(What you want to learn)'}
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill..."
                        className={`flex-1 p-3 rounded-lg border-2 border-slate-200 bg-slate-50 focus:outline-none focus:border-${roleInfo.color}-500 focus:bg-white transition`}
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className={`px-6 py-3 bg-${roleInfo.color}-500 text-white rounded-lg hover:bg-${roleInfo.color}-600 transition font-medium`}
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Skills Display */}
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center gap-2 px-3 py-1 bg-${roleInfo.color}-100 text-${roleInfo.color}-700 rounded-full text-sm`}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
                  </div>
                </>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:border-slate-300 transition"
                  >
                    Back
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 bg-gradient-to-r from-${roleInfo.color}-500 to-${roleInfo.color}-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50`}
                >
                  {isSubmitting ? "Creating Account..." : (step === 1 ? "Next" : "Create Account")}
                </button>
              </div>
            </form>

            {/* Back to Role Selection */}
            <div className="text-center mt-6">
              <button
                onClick={() => router.push('/role-selection')}
                className="text-slate-500 hover:text-slate-700 font-medium"
              >
                ← Change Role
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
