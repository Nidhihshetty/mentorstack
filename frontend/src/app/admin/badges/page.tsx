"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI } from "@/lib/admin-api";
import { Award, Plus, Search, ToggleLeft, ToggleRight, Upload, Pencil, XCircle, CheckCircle2, LayoutGrid, ListFilter, ChevronDown, Medal, Trophy, Power, Shield, Star } from "lucide-react";

// Add custom animations
const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  @keyframes tilt {
    0%, 100% { transform: rotate(-1deg); }
    50% { transform: rotate(1deg); }
  }
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-tilt { animation: tilt 10s ease-in-out infinite; }
  .delay-300 { animation-delay: 300ms; }
  .delay-500 { animation-delay: 500ms; }
  .delay-700 { animation-delay: 700ms; }
  .delay-1000 { animation-delay: 1000ms; }
  .bg-grid-white { background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); }
`;

interface BadgeForm {
  id?: number;
  name: string;
  description: string;
  reputationThreshold: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BadgeForm | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'grid' | 'table'>("grid");
  const [statusFilter, setStatusFilter] = useState<'all'|'active'|'inactive'>("all");
  const [sortBy, setSortBy] = useState<'threshold'|'name'|'awarded'>("threshold");
  const [sortDir, setSortDir] = useState<'asc'|'desc'>("asc");
  const skeletonKeys = ['a','b','c','d','e','f'];

  const filteredSorted = useMemo(() => {
    let arr = badges.slice();
    // filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(b => b.name.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q));
    }
    // filter by status
    if (statusFilter !== 'all') {
      arr = arr.filter(b => statusFilter === 'active' ? b.isActive : !b.isActive);
    }
    // sort
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'threshold') cmp = (a.reputationThreshold ?? 0) - (b.reputationThreshold ?? 0);
      else if (sortBy === 'name') cmp = String(a.name).localeCompare(String(b.name));
      else cmp = (a.awardedCount ?? 0) - (b.awardedCount ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [badges, search, statusFilter, sortBy, sortDir]);

  const openCreate = () => {
    setEditing({ name: "", description: "", reputationThreshold: 0, imageUrl: null, isActive: true });
    setShowModal(true);
  };

  const openEdit = (badge: any) => {
    setEditing({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      reputationThreshold: badge.reputationThreshold,
      imageUrl: badge.imageUrl,
      isActive: badge.isActive,
    });
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAPI.getBadges();
      setBadges(res.badges);
    } catch (e: any) {
      setError(e.message || "Failed to load badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onUploadIcon = async (file: File) => {
    const { imageUrl } = await adminAPI.uploadBadgeIcon(file);
    setEditing(prev => prev ? { ...prev, imageUrl } : prev);
  };

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await adminAPI.updateBadge(editing.id, {
          name: editing.name,
          description: editing.description,
          reputationThreshold: Number(editing.reputationThreshold) || 0,
          imageUrl: editing.imageUrl || null,
          isActive: editing.isActive,
        });
      } else {
        await adminAPI.createBadge({
          name: editing.name,
          description: editing.description,
          reputationThreshold: Number(editing.reputationThreshold) || 0,
          imageUrl: editing.imageUrl || null,
          isActive: editing.isActive,
        });
      }
      await load();
      resetModal();
    } catch (e: any) {
      alert(e.message || "Failed to save badge");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (badge: any) => {
    try {
      await adminAPI.toggleBadgeActive(badge.id);
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to toggle");
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/50 relative overflow-hidden">
        {/* Ambient floating orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500" />

        <div className="relative z-10 space-y-8 p-6">
          {/* Simplified Hero Section - Matching User Management Style */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-xl">
            <div className="relative px-8 py-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Award className="w-10 h-10 text-white" />
                <h1 className="text-3xl font-black tracking-tight">Badges Command Center</h1>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative">
                  {/* Layered total circle matching provided style */}
                  <div className="w-24 h-24 rounded-full bg-teal-700/60 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-teal-600/60 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-teal-500/70 flex flex-col items-center justify-center text-white">
                        <span className="text-xs font-medium tracking-wide">Total</span>
                        <span className="text-3xl font-extrabold leading-none">{badges.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full ring-2 ring-teal-400/30" />
                </div>
                <button
                  onClick={openCreate}
                  className="px-6 py-3 rounded-xl bg-white text-teal-700 font-bold shadow-lg hover:bg-teal-50 transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Badge
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Active Badges */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Active Badges</p>
                  <p className="text-3xl font-bold text-gray-900">{badges.filter(b => b.isActive).length}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Award className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <span>of {badges.length} total</span>
                <span className="ml-auto font-medium text-emerald-600">
                  {badges.length > 0 ? Math.round((badges.filter(b => b.isActive).length / badges.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Awarded</p>
                  <p className="text-3xl font-bold text-gray-900">{badges.reduce((acc, b) => acc + (b.awardedCount || 0), 0)}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <span>across all users</span>
              </div>
            </div>

            {/* Inactive Badges */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Inactive</p>
                  <p className="text-3xl font-bold text-gray-900">{badges.filter(b => !b.isActive).length}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-gray-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs text-gray-500">
                <span>not visible to users</span>
              </div>
            </div>
          </div>

          {/* Premium Control Panel */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-xl p-6">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
              {/* Search Bar with Icon Animation */}
              <div className="relative flex-1 group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-gray-200 group-hover:border-teal-400 transition-all duration-300 shadow-sm group-hover:shadow-md">
                  <Search className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search badges by name, description..."
                    className="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Glassmorphism Filter Pills */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="inline-flex p-1.5 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-lg backdrop-blur-sm">
                  {(['all','active','inactive'] as const).map(k => (
                    <button
                      key={k}
                      onClick={() => setStatusFilter(k)}
                      className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                        statusFilter === k
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/50 scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {k === 'all' && '✨ '}
                      {k === 'active' && '✅ '}
                      {k === 'inactive' && '⏸️ '}
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Sort Controls */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-lg backdrop-blur-sm">
                  <span className="text-sm font-medium text-gray-600">📊 Sort:</span>
                  <select
                    className="text-sm font-semibold bg-transparent outline-none cursor-pointer text-gray-900"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="threshold">Threshold</option>
                    <option value="name">Name</option>
                    <option value="awarded">Awarded</option>
                  </select>
                  <button
                    onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="ml-1 text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {sortDir === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* View Toggle */}
                <div className="inline-flex p-1.5 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 shadow-lg backdrop-blur-sm">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      view === 'grid'
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setView('table')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      view === 'table'
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <ListFilter className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        {/* Content */}
        {loading ? (
          // Premium Skeletons
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {skeletonKeys.map((k) => (
              <div key={k} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition"></div>
                <div className="relative rounded-2xl bg-white p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-full bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-100 rounded" />
                    <div className="h-8 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 to-pink-400 rounded-2xl blur opacity-50"></div>
            <div className="relative p-10 text-center bg-white rounded-2xl border-2 border-red-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center border-4 border-white shadow-lg">
                  <Award className="w-12 h-12 text-teal-600" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No badges found</h3>
              <p className="text-gray-600 mb-6">
                {search || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search criteria' 
                  : 'Start building your gamification system by creating your first badge'}
              </p>
              <button
                onClick={openCreate}
                className="relative group/btn overflow-hidden px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold shadow-xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-700 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Badge
                </div>
              </button>
            </div>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSorted.map((badge) => (
              <div key={badge.id} className="group relative">
                {/* Glow effect on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-500 group-hover:duration-200"></div>
                
                <div className="relative rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-teal-200">
                  {/* Gradient shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Shimmer animation */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                  <div className="relative p-6">
                    {/* Badge Icon & Status */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition"></div>
                        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-white flex items-center justify-center overflow-hidden shadow-lg">
                          {badge.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-cover" />
                          ) : (
                            <Award className="w-8 h-8 text-teal-600" />
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-full border-2 border-white font-bold shadow-md ${
                          badge.isActive 
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {badge.isActive ? '✓' : '○'}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate mb-1 group-hover:text-teal-700 transition-colors">
                          {badge.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-200 text-sm font-semibold">
                        <Medal className="w-4 h-4" />
                        <span>{badge.reputationThreshold}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200 text-sm font-semibold">
                        <Trophy className="w-4 h-4" />
                        <span>{badge.awardedCount ?? 0} awarded</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(badge)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                          badge.isActive
                            ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 hover:from-red-100 hover:to-pink-100 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20'
                            : 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                        {badge.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => openEdit(badge)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border rounded-xl shadow overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold text-gray-500">
              <div className="col-span-5">Badge</div>
              <div className="col-span-2">Threshold</div>
              <div className="col-span-2">Awarded</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredSorted.map(badge => (
                <div key={badge.id} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 border flex items-center justify-center overflow-hidden">
                      {badge.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-cover" />
                      ) : (
                        <Award className="w-5 h-5 text-teal-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{badge.name}</span>
                        {badge.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{badge.description}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-900">{badge.reputationThreshold}</div>
                  <div className="col-span-2 text-gray-900">{badge.awardedCount ?? 0}</div>
                  <div className="col-span-3 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => toggleActive(badge)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition border-2 ${badge.isActive
                        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-sm'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm'}`}
                    >
                      {badge.isActive ? <Power className="w-4 h-4 text-red-600" /> : <ToggleLeft className="w-4 h-4 text-emerald-600" />} {badge.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => openEdit(badge)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow hover:from-emerald-600 hover:to-teal-700 transition">
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Ambient gradient backdrop (matches Articles modals) */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-900/85 to-cyan-900/90 backdrop-blur-sm" />
            {/* Glassy modal container */}
            <div className="relative w-full max-w-2xl rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-white/92 to-white/82 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-emerald-200/60 bg-white/20 backdrop-blur-md">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                    <Award className="w-4 h-4" />
                  </span>
                  {editing.id ? 'Edit Badge' : 'Create Badge'}
                </h2>
              </div>
              <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div />
                <button onClick={resetModal} className="p-2 rounded-lg hover:bg-white/60">
                  <XCircle className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label htmlFor="badge-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input id="badge-name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="e.g., Helpful Hero" />
                  </div>
                  <div>
                    <label htmlFor="badge-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="badge-description" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="Describe how to earn this badge" />
                  </div>
                  <div>
                    <label htmlFor="badge-threshold" className="block text-sm font-medium text-gray-700 mb-1">Reputation Threshold</label>
                    <input id="badge-threshold" type="number" value={editing.reputationThreshold} onChange={e => setEditing({ ...editing, reputationThreshold: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500" placeholder="0" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Active</span>
                    <button type="button" role="switch" aria-checked={editing.isActive} onClick={() => setEditing({ ...editing, isActive: !editing.isActive })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${editing.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${editing.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="space-y-3 md:sticky md:top-4">
                  <span className="block text-sm font-medium text-gray-700">Badge Icon</span>
                  <label className="rounded-xl border-2 border-dashed bg-gradient-to-br from-teal-50 to-emerald-50 aspect-square flex items-center justify-center overflow-hidden cursor-pointer hover:border-teal-300">
                    {editing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editing.imageUrl} alt="badge preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-teal-600">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs">Click to upload</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        try { await onUploadIcon(f); } catch (err: any) { alert(err.message || 'Upload failed'); }
                      }
                    }} />
                  </label>
                  <p className="text-xs text-gray-500">PNG/SVG, Clear Image recommended.</p>
                  {editing.imageUrl && (
                    <button onClick={() => setEditing({ ...editing, imageUrl: null })} className="text-xs text-gray-500 underline">Remove image</button>
                  )}
                  {/* Live preview removed by request */}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button onClick={resetModal} className="px-4 py-2.5 rounded-lg font-semibold border-2 border-slate-300 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-400 transition">Cancel</button>
                <button onClick={onSave} disabled={saving} className="px-4 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-600 shadow-md hover:from-teal-600 hover:to-emerald-700 transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Badge'}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
        </div>
      </div>
    </AdminLayout>
    </>
  );
}
