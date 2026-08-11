"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI } from "@/lib/admin-api";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Shield,
  Sparkles,
  Target,
  Zap,
  RotateCcw,
  ChevronDown,
  Crown,
  Star,
} from "lucide-react";

interface UserLite {
  id: number;
  name: string;
  email: string;
  reputation: number;
  role?: string;
  avatarUrl?: string;
}

interface ReputationEntry {
  id: number;
  points: number;
  action: string;
  description?: string;
  createdAt: string;
  entityType?: string;
  entityId?: number;
}

const formatAction = (action: string): string => {
  return action
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const formatRelativeTime = (isoDate: string): string => {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

export default function AdminReputationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserLite[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLite | null>(null);
  const [history, setHistory] = useState<ReputationEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  // Adjustment form
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");

  // Filters
  const [roleFilter, setRoleFilter] = useState<"all" | "mentor" | "mentee">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"reputation" | "name">("reputation");

  useEffect(() => {
    const token = localStorage.getItem("adminAuthToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    loadUsers();
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [users, roleFilter, sortBy, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      const allUsers = (res.users || [])
        .filter((u: any) => u.role !== "admin")
        .map((u: any) => ({
          id: u.id,
          name: u.name || "Unknown",
          email: u.email || "",
          reputation: u.reputation || 0,
          role: u.role,
          avatarUrl: u.avatarUrl,
        }));
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      if (sortBy === "reputation") return b.reputation - a.reputation;
      return a.name.localeCompare(b.name);
    });
    setFilteredUsers(filtered);
  };

  const handleSelectUser = async (user: UserLite) => {
    setSelectedUser(user);
    setHistory([]);
    setHistoryPage(1);
    setHasMoreHistory(false);
    setAdjustPoints(0);
    setAdjustReason("");
    await loadHistory(user.id, 1);
  };

  const loadHistory = async (userId: number, page: number) => {
    setLoading(true);
    try {
      const res = await adminAPI.getReputationHistory(userId, page, 20);
      const entries = res.items || [];
      if (page === 1) {
        setHistory(entries);
      } else {
        setHistory((prev) => [...prev, ...entries]);
      }
      setHasMoreHistory(entries.length === 20);
      setHistoryPage(page);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (selectedUser && !loading) {
      loadHistory(selectedUser.id, historyPage + 1);
    }
  };

  const handleQuickAdjust = (delta: number) => {
    setAdjustPoints((prev) => prev + delta);
  };

  const handleApplyAdjustment = async () => {
    if (!selectedUser || adjustPoints === 0) return;
    if (!adjustReason.trim()) {
      alert("Please provide a reason for this adjustment.");
      return;
    }
    setAdjusting(true);
    try {
      await adminAPI.adjustReputation({
        userId: selectedUser.id,
        points: adjustPoints,
        reason: adjustReason,
      });
      alert(
        `Successfully ${adjustPoints > 0 ? "added" : "removed"} ${Math.abs(adjustPoints)} reputation points.`
      );
      setAdjustPoints(0);
      setAdjustReason("");
      await loadHistory(selectedUser.id, 1);
      const updatedUser = {
        ...selectedUser,
        reputation: selectedUser.reputation + adjustPoints,
      };
      setSelectedUser(updatedUser);
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
    } catch (err) {
      console.error("Failed to adjust reputation:", err);
      alert("Failed to apply adjustment. Please try again.");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/40 p-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white p-8 mb-8 shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight">
                  Reputation Command Center
                </h1>
                <p className="text-white/90 text-sm mt-1">
                  Search, audit, and fine-tune user reputation with precision
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Live Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Full Audit Trail</span>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left Panel: User Search & List */}
          <div className="xl:col-span-2 space-y-4">
            {/* Search & Filters Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/60">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Find Users
                </h2>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition outline-none bg-white/50"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Role
                  </label>
                  <div className="flex gap-2">
                    {(["all", "mentor", "mentee"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          roleFilter === r
                            ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Sort
                  </label>
                  <div className="flex gap-2">
                    {(["reputation", "name"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                          sortBy === s
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User List */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/60 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    {filteredUsers.length} Users
                  </h3>
                </div>
                <div className="text-xs text-gray-500">
                  Click to view details
                </div>
              </div>
              <div className="space-y-2">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-teal-500 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-lg scale-[1.02]"
                          : "border-transparent bg-white/60 hover:bg-white hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg ring-4 ring-white/50">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Star className="w-2.5 h-2.5 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 truncate">
                              {u.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {u.email}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <span className="font-bold text-amber-900">
                              {u.reputation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && !loading && (
                  <div className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Selected User Details */}
          <div className="xl:col-span-3 space-y-6">
            {!selectedUser ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 shadow-xl border border-white/60 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                  <Target className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Select a User
                </h3>
                <p className="text-gray-500">
                  Choose a user from the list to view their reputation history
                  and make adjustments
                </p>
              </div>
            ) : (
              <>
                {/* User Profile Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/30 backdrop-blur-xl rounded-2xl p-6 shadow-xl border-2 border-white/60">
                  <div className="relative z-10">
                    <div className="flex items-start gap-5">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-3xl ring-4 ring-white shadow-lg">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-md">
                          <Award className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black text-gray-900">
                            {selectedUser.name}
                          </h2>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                            {selectedUser.role?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">
                          {selectedUser.email}
                        </p>
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white font-bold text-lg shadow-lg ring-2 ring-white">
                          <Crown className="w-5 h-5" />
                          <span>{selectedUser.reputation} REP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 bg-teal-300/20 rounded-full blur-3xl" />
                </div>

                {/* Adjustment Panel */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/60">
                  <div className="flex items-center gap-2 mb-5">
                    <Zap className="w-5 h-5 text-teal-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Adjust Reputation
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuickAdjust(-10)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-200 text-red-700 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowDownCircle className="w-5 h-5" />
                        -10
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(-5)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-200 text-orange-700 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowDownCircle className="w-5 h-5" />
                        -5
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(5)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-200 text-emerald-700 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowUpCircle className="w-5 h-5" />
                        +5
                      </button>
                      <button
                        onClick={() => handleQuickAdjust(10)}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-100 to-emerald-100 border-2 border-teal-200 text-teal-700 font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <ArrowUpCircle className="w-5 h-5" />
                        +10
                      </button>
                      <button
                        onClick={() => setAdjustPoints(0)}
                        className="px-4 py-3 rounded-xl bg-gray-100 border-2 border-gray-200 text-gray-700 font-semibold hover:shadow-lg transition"
                        title="Reset"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          value={adjustPoints}
                          onChange={(e) =>
                            setAdjustPoints(Number(e.target.value))
                          }
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition outline-none font-semibold text-center text-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Preview
                        </label>
                        <div
                          className={`w-full px-4 py-3 rounded-xl border-2 font-bold text-center text-lg ${
                            adjustPoints > 0
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : adjustPoints < 0
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-gray-50 border-gray-200 text-gray-500"
                          }`}
                        >
                          {selectedUser.reputation + adjustPoints}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reason (required)
                      </label>
                      <textarea
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="e.g., Exceptional mentorship, spam penalty..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 transition outline-none resize-none"
                      />
                    </div>
                    <button
                      onClick={handleApplyAdjustment}
                      disabled={adjusting || adjustPoints === 0}
                      className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {adjusting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Apply Adjustment
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Reputation History Timeline */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/60">
                  <div className="flex items-center gap-2 mb-5">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      Reputation History
                    </h3>
                  </div>
                  {history.length === 0 && !loading ? (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No history yet</p>
                    </div>
                  ) : (
                    <div className="relative pl-8 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 via-emerald-400 to-transparent z-0 pointer-events-none" />
                      {history.map((h) => {
                        const isPositive = h.points > 0;
                        return (
                          <div key={h.id} className="relative z-10">
                            <div
                              className={`absolute left-3 top-1.5 w-3 h-3 rounded-full -translate-x-1/2 ring-4 ring-white shadow-md ${
                                isPositive
                                  ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                                  : "bg-gradient-to-br from-rose-400 to-red-500"
                              }`}
                            />
                            <div className="pl-2 group">
                              <div className="p-4 rounded-xl bg-white/60 border-2 border-gray-100 hover:border-teal-200 hover:shadow-lg transition">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                      {isPositive ? (
                                        <ArrowUpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                      ) : (
                                        <ArrowDownCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                      )}
                                      <span className="truncate">
                                        {formatAction(h.action)}
                                      </span>
                                    </div>
                                    {h.description && (
                                      <p className="text-sm text-gray-600 mb-2">
                                        {h.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatRelativeTime(h.createdAt)}
                                      </span>
                                      {h.entityType &&
                                        h.entityType !== "NONE" && (
                                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {h.entityType} #{h.entityId}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                  <div
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm shadow-md ${
                                      isPositive
                                        ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200"
                                        : "bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200"
                                    }`}
                                  >
                                    {isPositive ? (
                                      <TrendingUp className="w-4 h-4" />
                                    ) : (
                                      <TrendingDown className="w-4 h-4" />
                                    )}
                                    {isPositive ? "+" : ""}
                                    {h.points}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {hasMoreHistory && (
                        <button
                          onClick={handleLoadMore}
                          disabled={loading}
                          className="w-full mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-5 h-5" />
                              Load More
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}