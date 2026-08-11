"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import AdvancedAnalyticsModal from "@/components/admin/AdvancedAnalyticsModal";
import { adminAPI, OverviewStats } from "@/lib/admin-api";
import { 
  Users, 
  MessageSquare, 
  FileText, 
  BookOpen, 
  Eye, 
  Award, 
  Trophy, 
  Crown,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  MessageCircle,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [badges, setBadges] = useState<Array<{id:number;name:string;imageUrl?:string|null;isActive:boolean;reputationThreshold:number;awardedCount?:number;description?:string}>>([]);
  const [reputationSummary, setReputationSummary] = useState<{ total: number; average: number; highest: number; topUser?: string } | null>(null);

  // Modal states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'users' | 'questions' | 'articles' | 'communities' | null;
    data: any;
  }>({ isOpen: false, type: null, data: null });

  // Data states for modals
  const [usersData, setUsersData] = useState<any>(null);
  const [questionsData, setQuestionsData] = useState<any>(null);
  const [articlesData, setArticlesData] = useState<any>(null);
  const [communitiesData, setCommunitiesData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      try {
        const token = localStorage.getItem('adminAuthToken');

        if (!token) {
          console.log('No admin token found, redirecting to login');
          router.push('/admin/login');
          return;
        }

        if (!adminAPI.isAuthenticated()) {
          console.log('Token invalid, redirecting to login');
          router.push('/admin/login');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 50));

        if (!mounted) return;

        // Load stats, badges, and users
        const [data, badgesRes, usersRes] = await Promise.all([
          adminAPI.getOverviewStats(),
          adminAPI.getBadges().catch(() => ({ badges: [] })),
          adminAPI.getUsers(1, 500).catch(() => ({ users: [] }))
        ]);

        if (!mounted) return;

        setStats(data);
        setBadges(badgesRes.badges || []);
        
        // Compute reputation aggregation
        if (usersRes && Array.isArray(usersRes.users)) {
          const totalRep = usersRes.users.reduce((sum: number, u: any) => sum + (u.reputation || 0), 0);
          const highest = usersRes.users.reduce((max: number, u: any) => u.reputation > max ? u.reputation : max, 0);
          const topUserObj = usersRes.users.reduce((best: any, u: any) => (!best || u.reputation > (best.reputation || 0)) ? u : best, null);
          setReputationSummary({
            total: totalRep,
            average: usersRes.users.length ? Math.round(totalRep / usersRes.users.length) : 0,
            highest,
            topUser: topUserObj?.name
          });
        }

        setError("");

      } catch (err) {
        console.error('Dashboard load error:', err);

        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard data";
        setError(errorMessage);

        if (errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
          localStorage.removeItem('adminAuthToken');
          router.push('/admin/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [router]);

  // View button handlers
  const openModal = async (type: 'users' | 'questions' | 'articles' | 'communities') => {
    let data = null;
    
    try {
      switch(type) {
        case 'users':
          if (!usersData) {
            data = await adminAPI.getUsers();
            setUsersData(data);
          } else {
            data = usersData;
          }
          break;
        case 'questions':
          if (!questionsData) {
            data = await adminAPI.getQuestions();
            setQuestionsData(data);
          } else {
            data = questionsData;
          }
          break;
        case 'articles':
          if (!articlesData) {
            data = await adminAPI.getArticles();
            setArticlesData(data);
          } else {
            data = articlesData;
          }
          break;
        case 'communities':
          if (!communitiesData) {
            data = await adminAPI.getCommunities();
            setCommunitiesData(data);
          } else {
            data = communitiesData;
          }
          break;
      }
      
      setModalState({ isOpen: true, type, data });
    } catch (err) {
      console.error(`Failed to load ${type}:`, err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Error loading dashboard</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6 space-y-6">
        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-teal-100/90">Platform analytics & management</p>
            </div>
          </div>
        </div>

        {/* Individual Count Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Users */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Total Users</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats?.users.total || 0}</div>
            <button onClick={() => openModal('users')} className="text-sm text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>

          {/* Mentors */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Mentors</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats?.users.mentors || 0}</div>
            <div className="text-sm text-gray-500">{stats?.users.total ? Math.round((stats.users.mentors || 0) / stats.users.total * 100) : 0}% of users</div>
          </div>

          {/* Mentees */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Mentees</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats?.users.mentees || 0}</div>
            <div className="text-sm text-gray-500">{stats?.users.total ? Math.round((stats.users.mentees || 0) / stats.users.total * 100) : 0}% of users</div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Questions</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats?.content.questions || 0}</div>
            <button onClick={() => openModal('questions')} className="text-sm text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Articles</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats?.content.articles || 0}</div>
            <button onClick={() => openModal('articles')} className="text-sm text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>

          {/* Communities */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-teal-500" />
              <span className="text-sm font-semibold text-gray-700">Communities</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-3">{stats?.content.communities || 0}</div>
            <button onClick={() => openModal('communities')} className="text-sm text-teal-500 hover:text-teal-600 font-medium flex items-center gap-1">
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>
        </div>

        {/* Mentorship Funnel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-teal-600" />
                </div>
                Mentorship Funnel
              </h3>
              <p className="text-sm text-gray-500 mt-1">Request to connection conversion</p>
            </div>
            <div className="text-sm font-semibold text-gray-700">
              Success Rate: <span className="text-teal-600 text-xl font-bold">
                {(() => {
                  const accepted = stats?.mentorship.acceptedRequests || 0;
                  const total = stats?.mentorship.requests || 0;
                  return total ? Math.round((accepted / total) * 100) : 0;
                })()}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Requests */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Total Requests</span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-3">{stats?.mentorship.requests || 0}</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{width: '100%'}} />
              </div>
            </div>

            {/* Accepted */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-gray-900">Accepted</span>
              </div>
              <div className="text-4xl font-bold text-emerald-600 mb-3">{stats?.mentorship.acceptedRequests || 0}</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{width: stats?.mentorship.requests ? `${((stats.mentorship.acceptedRequests || 0) / stats.mentorship.requests) * 100}%` : '0%'}} />
              </div>
            </div>

            {/* Active Connections */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <span className="font-semibold text-gray-900">Connections</span>
              </div>
              <div className="text-4xl font-bold text-teal-600 mb-3">{stats?.mentorship.connections || 0}</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500" style={{width: stats?.mentorship.requests ? `${((stats.mentorship.connections || 0) / stats.mentorship.requests) * 100}%` : '0%'}} />
              </div>
            </div>

            {/* Pending */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-semibold text-gray-900">Pending</span>
              </div>
              <div className="text-4xl font-bold text-amber-600 mb-3">{stats?.mentorship.pendingRequests || 0}</div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{width: stats?.mentorship.requests ? `${((stats.mentorship.pendingRequests || 0) / stats.mentorship.requests) * 100}%` : '0%'}} />
              </div>
            </div>
          </div>
        </div>

        {/* Badges & Reputation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Badges */}
          <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Badges System</h3>
                </div>
                <p className="text-white/90 text-sm">Gamification tracking</p>
              </div>
              <a href="/admin/badges" className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm font-bold transition flex items-center gap-2">
                <span>Manage</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{badges.length}</div>
                <div className="text-xs text-white/80">Total Badges</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{badges.filter(b=>b.isActive).length}</div>
                <div className="text-xs text-white/80">Active</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{badges.reduce((s,b)=> s + (b.awardedCount||0), 0)}</div>
                <div className="text-xs text-white/80">Awarded</div>
              </div>
            </div>
          </div>

          {/* Reputation */}
          <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 rounded-2xl p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">Reputation System</h3>
                </div>
                <p className="text-white/90 text-sm">User ranking & scoring</p>
              </div>
              <a href="/admin/reputation" className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-sm font-bold transition flex items-center gap-2">
                <span>Manage</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{reputationSummary?.total || 0}</div>
                <div className="text-xs text-white/80">Total Points</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{reputationSummary?.average || 0}</div>
                <div className="text-xs text-white/80">Average</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-3xl font-bold mb-1">{reputationSummary?.highest || 0}</div>
                <div className="text-xs text-white/80">Highest</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {modalState.isOpen && modalState.type && (
        <AdvancedAnalyticsModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, type: null, data: null })}
          type={modalState.type}
          data={modalState.data?.[modalState.type] || modalState.data}
          stats={stats}
        />
      )}
    </AdminLayout>
  );
}
