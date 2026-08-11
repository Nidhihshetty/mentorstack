'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI, MentorshipRequest, Connection, MentorshipStats } from '@/lib/admin-api';
import {
    Users,
    Search,
    Filter,
    UserCheck,
    UserPlus,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare,
    TrendingUp,
    Calendar,
    Mail,
    Briefcase,
    MapPin,
    Star,
    Trash2,
    Activity,
    ArrowRight,
    BarChart3
} from 'lucide-react';

type Tab = 'requests' | 'connections';
type RequestFilter = 'all' | 'pending' | 'accepted' | 'rejected';

export default function AdminMentorshipPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('connections');
    const [requestFilter, setRequestFilter] = useState<RequestFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data states
    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [stats, setStats] = useState<MentorshipStats | null>(null);

    useEffect(() => {
        checkAuth();
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'requests') {
            loadRequests();
        }
    }, [requestFilter]);

    const checkAuth = async () => {
        try {
            if (!adminAPI.isAuthenticated()) {
                router.push('/admin/login');
            }
        } catch (error) {
            router.push('/admin/login');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const [statsData, requestsData, connectionsData] = await Promise.all([
                adminAPI.getMentorshipOverview(),
                adminAPI.getMentorshipRequests('all'),
                adminAPI.getMentorshipConnections()
            ]);

            setStats(statsData.stats);
            setRequests(requestsData.requests);
            setConnections(connectionsData.connections);
        } catch (err) {
            console.error('Error loading mentorship data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadRequests = async () => {
        try {
            const data = await adminAPI.getMentorshipRequests(requestFilter);
            setRequests(data.requests);
        } catch (err) {
            console.error('Error loading requests:', err);
        }
    };

    const handleDeleteRequest = async (requestId: number) => {
        if (!confirm('Are you sure you want to delete this mentorship request?')) {
            return;
        }

        try {
            await adminAPI.deleteMentorshipRequest(requestId);
            await loadRequests();
        } catch (err) {
            console.error('Error deleting request:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete request');
        }
    };

    const handleDeleteConnection = async (connectionId: number) => {
        if (!confirm('Are you sure you want to delete this connection? This will also delete the conversation history.')) {
            return;
        }

        try {
            await adminAPI.deleteMentorshipConnection(connectionId);
            await loadData();
        } catch (err) {
            console.error('Error deleting connection:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete connection');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return formatDate(dateString);
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            accepted: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200'
        };

        const icons = {
            pending: <Clock className="w-3 h-3" />,
            accepted: <CheckCircle className="w-3 h-3" />,
            rejected: <XCircle className="w-3 h-3" />
        };

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
                {icons[status as keyof typeof icons]}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const getEngagementBadge = (level: string) => {
        const styles = {
            high: 'bg-green-100 text-green-700 border-green-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-red-100 text-red-700 border-red-200'
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${styles[level as keyof typeof styles]}`}>
                <Activity className="w-3 h-3" />
                {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
        );
    };

    // Filter data based on search
    const filteredRequests = requests.filter(req =>
        req.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.mentor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.mentee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredConnections = connections.filter(conn =>
        conn.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.mentee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.mentor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.mentee.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading mentorship data...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg p-8 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8" />
                        <h1 className="text-3xl font-bold">Mentorship Management</h1>
                    </div>
                    <p className="text-teal-100">Track and manage mentorship requests and active connections</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Connections</p>
                                    <p className="text-3xl font-bold text-black">{stats.connections.total}</p>
                                    <p className="text-xs text-gray-500 mt-1">{stats.connections.active} active conversations</p>
                                </div>
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-teal-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Requests</p>
                                    <p className="text-3xl font-bold text-black">{stats.requests.pending}</p>
                                    <p className="text-xs text-gray-500 mt-1">of {stats.requests.total} total</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Acceptance Rate</p>
                                    <p className="text-3xl font-bold text-black">{stats.requests.acceptanceRate}%</p>
                                    <p className="text-xs text-gray-500 mt-1">{stats.requests.accepted} accepted</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Messages</p>
                                    <p className="text-3xl font-bold text-black">{stats.messages.total}</p>
                                    <p className="text-xs text-gray-500 mt-1">{stats.connections.avgMessagesPerConnection} avg/connection</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Mentors Section */}
                {stats && stats.topMentors && stats.topMentors.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-5 h-5 text-teal-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Top Active Mentors</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {stats.topMentors.map((mentor) => (
                                <div key={mentor.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {mentor.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{mentor.name}</p>
                                        <p className="text-xs text-gray-500">{mentor._count.mentorConnections} connections</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('connections')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'connections'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" />
                                    Connections ({connections.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all ${activeTab === 'requests'
                                        ? 'bg-teal-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Requests ({requests.length})
                                </div>
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>

                    {/* Request Filter (only show on requests tab) */}
                    {activeTab === 'requests' && (
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={requestFilter}
                                onChange={(e) => setRequestFilter(e.target.value as RequestFilter)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                            >
                                <option value="all">All Requests</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <span className="text-sm text-gray-600 ml-2">
                                Showing {filteredRequests.length} of {requests.length} requests
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'connections' ? (
                    /* Connections List */
                    <div className="space-y-4">
                        {filteredConnections.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No connections found</h3>
                                <p className="text-gray-600">
                                    {searchQuery ? 'Try adjusting your search query' : 'No active mentorship connections yet'}
                                </p>
                            </div>
                        ) : (
                            filteredConnections.map((connection) => (
                                <div
                                    key={connection.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                Connected on {formatDate(connection.acceptedAt)}
                                            </span>
                                            {connection.metrics && (
                                                <span className="text-sm text-gray-400">
                                                    • {connection.metrics.daysSinceConnection} days ago
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteConnection(connection.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete connection"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Mentor Side */}
                                        <div className="border-r-0 lg:border-r border-gray-200 pr-0 lg:pr-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {connection.mentor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-semibold text-gray-900">{connection.mentor.name}</h4>
                                                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                                                            MENTOR
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {connection.mentor.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {connection.mentor.jobTitle && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Briefcase className="w-4 h-4" />
                                                    {connection.mentor.jobTitle}
                                                    {connection.mentor.department && ` • ${connection.mentor.department}`}
                                                </div>
                                            )}

                                            {connection.mentor.skills && connection.mentor.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {connection.mentor.skills.slice(0, 3).map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {connection.mentor.skills.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                                            +{connection.mentor.skills.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {connection.mentor.reputation} rep
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {connection.mentor._count.mentorConnections} mentees
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mentee Side */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary-dark rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {connection.mentee.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-semibold text-gray-900">{connection.mentee.name}</h4>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                            MENTEE
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {connection.mentee.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {connection.mentee.jobTitle && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Briefcase className="w-4 h-4" />
                                                    {connection.mentee.jobTitle}
                                                    {connection.mentee.department && ` • ${connection.mentee.department}`}
                                                </div>
                                            )}

                                            {connection.mentee.skills && connection.mentee.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {connection.mentee.skills.slice(0, 3).map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {connection.mentee.skills.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                                            +{connection.mentee.skills.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {connection.mentee.reputation} rep
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {connection.mentee._count.menteeConnections} mentors
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Engagement Metrics */}
                                    {connection.metrics && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                    <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                                    <p className="text-lg font-bold text-blue-900">{connection.metrics.messageCount}</p>
                                                    <p className="text-xs text-blue-600">Messages</p>
                                                </div>
                                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                    <BarChart3 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                                    <p className="text-lg font-bold text-purple-900">{connection.metrics.messagesPerWeek}</p>
                                                    <p className="text-xs text-purple-600">Msgs/Week</p>
                                                </div>
                                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                                    <Activity className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                                    <p className="text-xs font-bold text-green-900 mt-1">
                                                        {getEngagementBadge(connection.metrics.engagementLevel)}
                                                    </p>
                                                    <p className="text-xs text-green-600">Engagement</p>
                                                </div>
                                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                    <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {connection.metrics.lastMessageDate
                                                            ? formatTime(connection.metrics.lastMessageDate)
                                                            : 'No messages'}
                                                    </p>
                                                    <p className="text-xs text-gray-600">Last message</p>
                                                </div>
                                            </div>
                                            {connection.metrics.lastMessage && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        Last message from {connection.metrics.lastMessageSender}:
                                                    </p>
                                                    <p className="text-sm text-gray-700 line-clamp-2">{connection.metrics.lastMessage}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    /* Requests List */
                    <div className="space-y-4">
                        {filteredRequests.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests found</h3>
                                <p className="text-gray-600">
                                    {searchQuery ? 'Try adjusting your search query' : 'No mentorship requests match the current filter'}
                                </p>
                            </div>
                        ) : (
                            filteredRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(request.status)}
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(request.createdAt)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteRequest(request.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete request"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Mentor Side */}
                                        <div className="border-r-0 lg:border-r border-gray-200 pr-0 lg:pr-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {request.mentor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-semibold text-gray-900">{request.mentor.name}</h4>
                                                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                                                            MENTOR
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {request.mentor.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {request.mentor.jobTitle && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Briefcase className="w-4 h-4" />
                                                    {request.mentor.jobTitle}
                                                    {request.mentor.department && ` • ${request.mentor.department}`}
                                                </div>
                                            )}

                                            {request.mentor.skills && request.mentor.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {request.mentor.skills.slice(0, 3).map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {request.mentor.skills.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                                            +{request.mentor.skills.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {request.mentor.reputation} rep
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {request.mentor._count.mentorConnections} mentees
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mentee Side */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary-dark rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {request.mentee.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-semibold text-gray-900">{request.mentee.name}</h4>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                                            MENTEE
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {request.mentee.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {request.mentee.jobTitle && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <Briefcase className="w-4 h-4" />
                                                    {request.mentee.jobTitle}
                                                    {request.mentee.department && ` • ${request.mentee.department}`}
                                                </div>
                                            )}

                                            {request.mentee.skills && request.mentee.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {request.mentee.skills.slice(0, 3).map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                    {request.mentee.skills.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                                            +{request.mentee.skills.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3 h-3" />
                                                    {request.mentee.reputation} rep
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {request.mentee._count.menteeConnections} mentors
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Message */}
                                    {request.requestMessage && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-600 mb-1 font-medium">Request Message:</p>
                                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{request.requestMessage}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
