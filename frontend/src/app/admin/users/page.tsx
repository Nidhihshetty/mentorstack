'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminAPI } from '@/lib/admin-api';
import {
    Users,
    Search,
    Edit,
    UserX,
    Mail,
    Briefcase,
    MapPin,
    Star,
    Award,
    MessageSquare,
    FileText,
    BookOpen,
    Calendar,
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    Shield
} from 'lucide-react';

// User data interface
interface UserData {
    id: number;
    name: string;
    email: string;
    role: 'mentor' | 'mentee' | 'admin';
    reputation: number;
    avatarUrl?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    bio?: string | null;
    skills?: string[];
    location?: string | null;
    createdAt: string;
    _count: {
        questions: number;
        answers: number;
        articles: number;
        mentorConnections: number;
        menteeConnections: number;
        communityPosts: number;
    };
}

type User = UserData;

export default function AdminUsersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'mentors' | 'mentees' | 'admins'>('mentors');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Real data states
    const [mentors, setMentors] = useState<User[]>([]);
    const [mentees, setMentees] = useState<User[]>([]);
    const [admins, setAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuth();
        loadUsers();
    }, []);

    const checkAuth = async () => {
        try {
            if (!adminAPI.isAuthenticated()) {
                router.push('/admin/login');
            }
        } catch (error) {
            router.push('/admin/login');
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch all three user types in parallel
            const [mentorsData, menteesData, adminsData] = await Promise.all([
                adminAPI.getUsers(1, 100, 'mentor'),
                adminAPI.getUsers(1, 100, 'mentee'),
                adminAPI.getUsers(1, 100, 'admin')
            ]);

            setMentors(mentorsData.users || []);
            setMentees(menteesData.users || []);
            setAdmins(adminsData.users || []);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const users = activeTab === 'mentors'
        ? mentors
        : activeTab === 'mentees'
            ? mentees
            : admins;

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.skills && user.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const handleViewUser = (user: User) => {
        setSelectedUser(user);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDeactivateUser = async (user: User) => {
        if (confirm(`Are you sure you want to deactivate ${user.name}? This action cannot be undone.`)) {
            try {
                await adminAPI.deleteUser(user.id);
                alert(`User ${user.name} has been deactivated successfully`);
                // Reload users after deletion
                await loadUsers();
            } catch (error) {
                console.error('Error deactivating user:', error);
                alert(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;

        try {
            // Get form values
            const nameInput = document.querySelector<HTMLInputElement>('input[placeholder="Full Name"]');
            const emailInput = document.querySelector<HTMLInputElement>('input[placeholder="Email"]');
            const jobTitleInput = document.querySelector<HTMLInputElement>('input[placeholder="Job Title"]');
            const departmentInput = document.querySelector<HTMLInputElement>('input[placeholder="Department"]');
            const locationInput = document.querySelector<HTMLInputElement>('input[placeholder="Location"]');
            const bioInput = document.querySelector<HTMLTextAreaElement>('textarea[placeholder="User bio..."]');
            const skillsInput = document.querySelector<HTMLInputElement>('input[placeholder="Skills (comma-separated)"]');

            const updateData: any = {};
            if (nameInput?.value) updateData.name = nameInput.value;
            if (emailInput?.value) updateData.email = emailInput.value;
            if (jobTitleInput?.value) updateData.jobTitle = jobTitleInput.value;
            if (departmentInput?.value) updateData.department = departmentInput.value;
            if (locationInput?.value) updateData.location = locationInput.value;
            if (bioInput?.value) updateData.bio = bioInput.value;
            if (skillsInput?.value) {
                updateData.skills = skillsInput.value.split(',').map(s => s.trim()).filter(s => s);
            }

            await adminAPI.updateUser(selectedUser.id, updateData);
            alert('User updated successfully!');

            // Reload users
            await loadUsers();
            handleCloseModal();
        } catch (error) {
            console.error('Error updating user:', error);
            alert(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setIsEditing(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Loading state
    if (loading) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-500 mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading users...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-xl mb-4">Error loading users</div>
                        <div className="text-gray-600 mb-4">{error}</div>
                        <button
                            onClick={loadUsers}
                            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition"
                        >
                            Retry
                        </button>
                    </div>
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
                                User Management
                            </h1>
                            <p className="text-sm text-teal-100/90">Manage and moderate all platform users</p>
                        </div>
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center">
                                    <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-xs text-teal-100">Total</p>
                                            <p className="text-3xl font-extrabold">{mentors.length + mentees.length + admins.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div>
                    {/* Tabs and Search */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
                        <div className="p-6">
                            {/* Tabs */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <button
                                    onClick={() => setActiveTab('mentors')}
                                    className={`py-3 px-6 rounded-lg font-semibold transition ${activeTab === 'mentors'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Award className="w-5 h-5" />
                                        <span>Mentors ({mentors.length})</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('mentees')}
                                    className={`py-3 px-6 rounded-lg font-semibold transition ${activeTab === 'mentees'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Users className="w-5 h-5" />
                                        <span>Mentees ({mentees.length})</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('admins')}
                                    className={`py-3 px-6 rounded-lg font-semibold transition ${activeTab === 'admins'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Admins ({admins.length})</span>
                                    </div>
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, job title, or skills..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards - Only for Mentors and Mentees */}
                    {activeTab !== 'admins' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">
                                            Active {activeTab === 'mentors' ? 'Mentors' : 'Mentees'}
                                        </p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">{filteredUsers.length}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-100 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Total Questions</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {filteredUsers.reduce((sum, u) => sum + u._count.questions, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <MessageSquare className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Total Answers</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {filteredUsers.reduce((sum, u) => sum + u._count.answers, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600">Total Reputation</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {filteredUsers.reduce((sum, u) => sum + u.reputation, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <Star className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Simple Cards */}
                    {activeTab === 'admins' && filteredUsers.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredUsers.map((admin) => (
                                <div key={admin.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0">
                                            {getInitials(admin.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-slate-800 mb-1 truncate">{admin.name}</h3>
                                            <div className="flex items-center gap-2 text-slate-600 mb-2">
                                                <Mail className="w-4 h-4 flex-shrink-0" />
                                                <span className="text-sm truncate">{admin.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1">
                                                    <Shield className="w-3 h-3" />
                                                    Administrator
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                                                <Calendar className="w-3 h-3" />
                                                <span>Joined {formatDate(admin.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Users Grid - Only for Mentors and Mentees */}
                    {activeTab !== 'admins' && (
                        <div className="space-y-4">
                            {filteredUsers.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-16">
                                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 font-medium">No users found</p>
                                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
                                        <div className="flex gap-8">
                                            {/* User Info Section */}
                                            <div className="flex-1 space-y-6">
                                                {/* Profile Header */}
                                                <div className="flex items-start gap-5">
                                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{user.name}</h3>
                                                        <div className="flex items-center gap-2 text-slate-600 mb-3">
                                                            <Mail className="w-4 h-4" />
                                                            <span className="text-sm">{user.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.role === 'mentor'
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : user.role === 'mentee'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                                <span className="font-bold text-slate-800">{user.reputation}</span>
                                                                <span className="text-sm text-slate-500">reputation</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Professional Info */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-slate-50 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                                            <Briefcase className="w-4 h-4" />
                                                            <span className="text-xs font-medium uppercase">Job Title</span>
                                                        </div>
                                                        <p className="font-semibold text-slate-800">{user.jobTitle}</p>
                                                        <p className="text-sm text-slate-500 mt-1">{user.department}</p>
                                                    </div>
                                                    <div className="bg-slate-50 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span className="text-xs font-medium uppercase">Location</span>
                                                        </div>
                                                        <p className="font-semibold text-slate-800">{user.location}</p>
                                                    </div>
                                                </div>

                                                {/* Skills */}
                                                <div>
                                                    <p className="text-xs font-medium uppercase text-slate-500 mb-3">Skills</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.skills && user.skills.length > 0 ? (
                                                            user.skills.map((skill, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm rounded-lg font-medium"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-slate-400">No skills listed</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Activity Stats */}
                                                <div className="grid grid-cols-4 gap-3">
                                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                        <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-blue-700">{user._count.questions}</p>
                                                        <p className="text-xs text-blue-600">Questions</p>
                                                    </div>
                                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                                        <FileText className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-green-700">{user._count.answers}</p>
                                                        <p className="text-xs text-green-600">Answers</p>
                                                    </div>
                                                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                                                        <BookOpen className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-purple-700">{user._count.articles}</p>
                                                        <p className="text-xs text-purple-600">Articles</p>
                                                    </div>
                                                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                                                        <Users className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-orange-700">{user._count.communityPosts}</p>
                                                        <p className="text-xs text-orange-600">Posts</p>
                                                    </div>
                                                </div>

                                                {/* Joined Date */}
                                                <div className="flex items-center gap-2 text-sm text-slate-500 pt-2 border-t border-slate-200">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Member since {formatDate(user.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Actions Column */}
                                            <div className="flex flex-col gap-3 min-w-[140px]">
                                                <p className="text-xs font-medium uppercase text-slate-500 mb-1">Actions</p>
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-semibold shadow-sm hover:shadow-md"
                                                >
                                                    View Profile
                                                </button>
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="w-full px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit User
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivateUser(user)}
                                                    className="w-full px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                    Deactivate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Empty State for Admins */}
                    {activeTab === 'admins' && filteredUsers.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-16">
                            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">No administrators found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>

                {/* User Detail/Edit Modal */}
                {showModal && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Ambient gradient backdrop to match content page */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-slate-900/85 to-cyan-900/90 backdrop-blur-sm" />
                        {/* Gradient border frame */}
                        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-[1px] bg-gradient-to-br from-emerald-300/60 via-cyan-300/50 to-emerald-300/60 shadow-[0_30px_80px_-20px_rgba(6,182,212,0.45)]">
                            <div className="rounded-2xl bg-gradient-to-br from-white/92 to-white/82 backdrop-blur-xl border border-emerald-300/60">
                            {/* Modal Header */}
                            <div className="px-8 pt-6 pb-5 border-b border-emerald-200/60 flex items-center justify-between">
                                <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-white flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <Edit className="w-6 h-6 text-emerald-600" />
                                            Edit User Profile
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-6 h-6 text-emerald-600" />
                                            User Profile
                                        </>
                                    )}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="rounded-lg p-2 text-emerald-600 hover:text-emerald-700"
                                    aria-label="Close user modal"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="px-8 py-6 space-y-6">
                                {/* Profile Header */}
                                <div className="flex items-start gap-6 pb-6 border-b border-slate-200">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                        {getInitials(selectedUser.name)}
                                    </div>
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    defaultValue={selectedUser.name}
                                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                                    placeholder="Full Name"
                                                />
                                                <input
                                                    type="email"
                                                    defaultValue={selectedUser.email}
                                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                                    placeholder="Email"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-2xl font-bold text-slate-800">{selectedUser.name}</h3>
                                                <p className="text-slate-600 flex items-center gap-2 mt-1">
                                                    <Mail className="w-4 h-4" />
                                                    {selectedUser.email}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedUser.role === 'mentor'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : selectedUser.role === 'mentee'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                                                        <Star className="w-5 h-5 fill-yellow-500" />
                                                        {selectedUser.reputation} Rep
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Professional Info */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <Briefcase className="w-5 h-5 text-emerald-600" />
                                        Professional Information
                                    </h4>
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                defaultValue={selectedUser.jobTitle || ''}
                                                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                                placeholder="Job Title"
                                            />
                                            <input
                                                type="text"
                                                defaultValue={selectedUser.department || ''}
                                                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                                placeholder="Department"
                                            />
                                            <input
                                                type="text"
                                                defaultValue={selectedUser.location || ''}
                                                className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                                placeholder="Location"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 rounded-lg p-4">
                                                <p className="text-sm text-slate-500 mb-1">Job Title</p>
                                                <p className="font-semibold text-slate-800">{selectedUser.jobTitle || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-4">
                                                <p className="text-sm text-slate-500 mb-1">Department</p>
                                                <p className="font-semibold text-slate-800">{selectedUser.department || 'N/A'}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg p-4 col-span-2">
                                                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    Location
                                                </p>
                                                <p className="font-semibold text-slate-800">{selectedUser.location || 'N/A'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Bio */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-3">Bio</h4>
                                    {isEditing ? (
                                        <textarea
                                            defaultValue={selectedUser.bio || ''}
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 min-h-[100px]"
                                            placeholder="User bio..."
                                        />
                                    ) : (
                                        <p className="text-slate-600 bg-slate-50 rounded-lg p-4">
                                            {selectedUser.bio || 'No bio provided'}
                                        </p>
                                    )}
                                </div>

                                {/* Skills */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-3">Skills</h4>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            defaultValue={selectedUser.skills ? selectedUser.skills.join(', ') : ''}
                                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                            placeholder="Skills (comma-separated)"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUser.skills && selectedUser.skills.length > 0 ? (
                                                selectedUser.skills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium text-sm"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400">No skills listed</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Activity Stats */}
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-3">Activity Statistics</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                                            <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-blue-700">{selectedUser._count.questions}</p>
                                            <p className="text-sm text-blue-600">Questions</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4 text-center">
                                            <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-green-700">{selectedUser._count.answers}</p>
                                            <p className="text-sm text-green-600">Answers</p>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                                            <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-purple-700">{selectedUser._count.articles}</p>
                                            <p className="text-sm text-purple-600">Articles</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                                            <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-orange-700">{selectedUser._count.communityPosts}</p>
                                            <p className="text-sm text-orange-600">Posts</p>
                                        </div>
                                        <div className="bg-pink-50 rounded-lg p-4 text-center">
                                            <Award className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-pink-700">
                                                {selectedUser._count.mentorConnections + selectedUser._count.menteeConnections}
                                            </p>
                                            <p className="text-sm text-pink-600">Connections</p>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                            <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-yellow-700">{selectedUser.reputation}</p>
                                            <p className="text-sm text-yellow-600">Reputation</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Member Since */}
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Member since {formatDate(selectedUser.createdAt)}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-emerald-200/60">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 bg-white/75 border border-emerald-300/60 text-emerald-700 rounded-lg font-medium text-sm hover:bg-emerald-50/80 transition"
                                >
                                    Close
                                </button>
                                {isEditing && (
                                    <button
                                        onClick={handleSaveUser}
                                        className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-[0_8px_24px_-8px_rgba(6,182,212,0.4)]"
                                    >
                                        Save Changes
                                    </button>
                                )}
                            </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
