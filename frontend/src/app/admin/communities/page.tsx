"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminAPI, Community } from "@/lib/admin-api";
import {
  Users,
  Search,
  Trash2,
  Eye,
  MessageSquare,
  Hash,
  Star
} from "lucide-react";

// Simple metric chip used in community cards
function MetricChip({ label, value, icon }: Readonly<{ label: string; value: string | number | React.ReactNode; icon?: React.ReactNode }>) {
  return (
    <div className="rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1">
        {icon}{label}
      </div>
      <div className="mt-0.5 text-slate-800 font-medium text-sm truncate" title={typeof value === 'string' || typeof value === 'number' ? String(value) : label}>
        {value ?? 0}
      </div>
    </div>
  );
}

export default function CommunitiesAdminPage() {
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCommunitiesCount, setTotalCommunitiesCount] = useState<number>(0);
  const [selectedSkill, setSelectedSkill] = useState<string>('All');

  useEffect(() => {
    loadCommunities();
  }, [currentPage, searchTerm]);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getCommunities(currentPage, 20);
      setCommunities(response.communities);
      setTotalPages(response.pagination.totalPages);
      setTotalCommunitiesCount(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async (communityId: number) => {
    if (!confirm("Delete this community? This cannot be undone.")) return;
    try {
      await adminAPI.deleteCommunity(communityId);
      await loadCommunities();
    } catch (err) {
      console.error("Failed to delete community:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(community => selectedSkill === 'All' ? true : (Array.isArray((community as any).skills) && (community as any).skills.includes(selectedSkill)));

  const uniqueSkills: string[] = Array.from(new Set(
    communities.flatMap(c => (c as any).skills || [])
  ));

  // Aggregated stats from the currently loaded page (data-driven, no hardcoding)
  const stats = {
    totalCommunities: totalCommunitiesCount || communities.length,
    totalMembersOnPage: communities.reduce((sum, c) => sum + (c._count?.members ?? 0), 0),
    totalPostsOnPage: communities.reduce((sum, c) => sum + (c._count?.posts ?? 0), 0),
    avgMembersPerCommunity: communities.length > 0 ? Math.round(communities.reduce((sum, c) => sum + (c._count?.members ?? 0), 0) / communities.length) : 0,
  };

  const goToCommunity = (community: Community) => {
    router.push(`/admin/communities/${community.id}`);
  };

  if (loading && communities.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                <Users className="w-8 h-8" />
                Communities Management
              </h1>
              <p className="text-sm text-teal-100/90">Manage and moderate all platform communities</p>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-teal-100">Total</p>
                      <p className="text-3xl font-extrabold">{stats.totalCommunities}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <StatTile label="Total Communities" value={stats.totalCommunities} color="emerald" icon={<Users className="w-5 h-5" />} />
          <StatTile label="Total Members" value={stats.totalMembersOnPage} color="green" icon={<Users className="w-5 h-5" />} />
          <StatTile label="Total Posts" value={stats.totalPostsOnPage} color="blue" icon={<MessageSquare className="w-5 h-5" />} />
          <StatTile label="Avg Members/Community" value={stats.avgMembersPerCommunity} color="purple" icon={<Users className="w-5 h-5" />} />
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search communities by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            {/* Filter chips */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Filter by skill:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSkill('All')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border ${selectedSkill === 'All' ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  All
                </button>
                {uniqueSkills.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSkill(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${selectedSkill === s ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                    title={s}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommunities.map((community) => (
            <div key={community.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={community.name}>{community.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">{community.description}</p>
                </div>
                <div className="flex flex-col items-end text-[11px] text-slate-500">
                  <span className="font-medium">{formatDate(community.createdAt)}</span>
                  <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">ID {community.id}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <MetricChip label="Members" value={community._count.members} icon={<Users className="w-3.5 h-3.5" />} />
                <MetricChip label="Posts" value={community._count.posts} icon={<MessageSquare className="w-3.5 h-3.5" />} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1" title={community.createdBy?.name || 'Unknown'}>
                  <Star className="w-3.5 h-3.5 text-yellow-500" /> {community.createdBy?.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-slate-500" /> {(community as any).skills ? (community as any).skills.length : 0} skills</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  onClick={() => goToCommunity(community)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
                >
                  <Eye className="w-4 h-4" /> Details
                </button>
                <button
                  onClick={() => handleDeleteCommunity(community.id)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCommunities.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No communities found</h3>
            <p className="text-gray-500">
              {searchTerm ? "Try adjusting your search criteria" : "No communities have been created yet"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg border text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
              .map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium ${page === currentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-white hover:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg border text-sm font-medium bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatTile({ label, value, color = 'emerald', icon }: Readonly<{ label: string; value: number | string; color?: 'emerald'|'green'|'blue'|'purple'; icon?: React.ReactNode }>) {
  const palette: Record<string, { ring: string; text: string; bg: string }> = {
    emerald: { ring: 'ring-emerald-100', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    green:   { ring: 'ring-green-100',   text: 'text-green-600',   bg: 'bg-green-50' },
    blue:    { ring: 'ring-blue-100',    text: 'text-blue-600',    bg: 'bg-blue-50' },
    purple:  { ring: 'ring-purple-100',  text: 'text-purple-600',  bg: 'bg-purple-50' },
  };
  const c = palette[color] || palette.emerald;
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition`}> 
      <div className={`shrink-0 h-10 w-10 ${c.bg} ${c.text} ${c.ring} ring-4 rounded-lg flex items-center justify-center`}>{icon ?? <span className="font-bold">{String(label).charAt(0)}</span>}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
