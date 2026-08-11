'use client'
import React, { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Users, BookOpen, User } from "lucide-react";
import Layout from "../../components/Layout";
import { authAPI } from "@/lib/auth-api";

interface Mentor {
    id: string;
    name: string;
    location: string;
    department: string;
    skills: string[];
    bio?: string;
    avatarUrl?: string;
    jobTitle?: string;
    reputation?: number;
    status?: 'pending' | 'accepted' | 'rejected' | null;
    requestMessage?: string;
    requestDate?: string;
}

const MentorsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Accepted' | 'Rejected'>('All');
    const [searchTerm, setSearchTerm] = useState("");
    const [allMentors, setAllMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [connectingMentor, setConnectingMentor] = useState<Mentor | null>(null);
    const [requestMessage, setRequestMessage] = useState("");

    // Fetch mentors on component mount
    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setLoading(true);
            const mentorsData = await authAPI.getMentorsWithStatus();
            setAllMentors(mentorsData.map((m: any) => ({
                id: m.id.toString(),
                name: m.name,
                location: m.location || 'Not specified',
                department: m.department || 'Not specified',
                skills: m.skills || [],
                bio: m.bio || '',
                avatarUrl: m.avatarUrl,
                jobTitle: m.jobTitle,
                reputation: m.reputation,
                status: m.status,
                requestMessage: m.requestMessage,
                requestDate: m.requestDate
            })));
        } catch (error) {
            console.error('Error fetching mentors:', error);
            alert('Failed to load mentors. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (mentorId: string) => {
        if (!requestMessage.trim()) {
            alert('Please enter a request message');
            return;
        }

        setSendingRequests(prev => new Set(prev).add(mentorId));

        try {
            const result = await authAPI.sendMentorshipRequest(mentorId, requestMessage);

            // Update the mentor's status in the list
            setAllMentors(prev => prev.map(mentor =>
                mentor.id === mentorId
                    ? {
                        ...mentor,
                        status: 'pending',
                        requestMessage: requestMessage,
                        requestDate: new Date().toISOString()
                    }
                    : mentor
            ));

            // Close modal and reset
            setConnectingMentor(null);
            setRequestMessage("");
            if (result.reputation?.applied) {
                alert(`${result.message} (+${result.reputation.appliedPoints} reputation, total ${result.reputation.currentReputation})`);
            } else {
                alert(result.message || 'Request sent successfully!');
            }
        } catch (error: any) {
            console.error('Error sending request:', error);
            alert(error.message || 'Failed to send request. Please try again.');
        } finally {
            setSendingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(mentorId);
                return newSet;
            });
        }
    };

    const handleOpenConnectModal = (mentor: Mentor) => {
        setConnectingMentor(mentor);
        setRequestMessage("");
    };

    const handleCloseConnectModal = () => {
        setConnectingMentor(null);
        setRequestMessage("");
    };

    const handleCancelRequest = async (mentorId: string) => {
        try {
            await authAPI.cancelMentorshipRequest(mentorId);

            // Update the mentor's status in the list
            setAllMentors(prev => prev.map(mentor =>
                mentor.id === mentorId
                    ? { ...mentor, status: null, requestMessage: undefined, requestDate: undefined }
                    : mentor
            ));

            alert('Request cancelled successfully!');
        } catch (error: any) {
            console.error('Error cancelling request:', error);
            alert(error.message || 'Failed to cancel request. Please try again.');
        }
    };

    const filteredData = useMemo(() => {
        let data: Mentor[] = [];

        if (activeTab === 'All') {
            data = allMentors;
        } else {
            data = allMentors.filter(mentor =>
                mentor.status?.toLowerCase() === activeTab.toLowerCase()
            );
        }

        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            data = data.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.department.toLowerCase().includes(searchLower) ||
                item.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
                (item.jobTitle && item.jobTitle.toLowerCase().includes(searchLower))
            );
        }

        return data;
    }, [activeTab, searchTerm, allMentors]);

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'accepted':
                return 'bg-green-100 text-green-700';
            case 'rejected':
                return 'bg-red-100 text-red-700';
            case 'pending':
                return 'bg-orange-100 text-orange-700';
            default:
                return '';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("");
    };

    return (
        <Layout>
            <div className="min-h-screen bg-neutral-dark flex">
                <div className="flex-1 min-w-0">
                    <main className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-tertiary)' }}>
                                Mentors
                            </h1>
                            <div className="text-sm" style={{ color: 'var(--color-tertiary-light)' }}>
                                {loading ? 'Loading...' : `${filteredData.length} ${activeTab === 'All' ? 'mentors' : 'requests'}`}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                            {(['All', 'Pending', 'Accepted', 'Rejected'] as const).map((tab) => {
                                const count = tab === 'All'
                                    ? allMentors.length
                                    : allMentors.filter((m: Mentor) => m.status?.toLowerCase() === tab.toLowerCase()).length;

                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab ? 'shadow-md' : 'hover:bg-opacity-10'
                                            }`}
                                        style={{
                                            backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'var(--color-surface)',
                                            color: activeTab === tab ? 'var(--color-neutral)' : 'var(--color-secondary)',
                                        }}
                                    >
                                        {tab} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:max-w-md mb-6">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5" style={{ color: 'var(--color-tertiary-light)' }} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search mentors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border rounded-lg leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                    backgroundColor: "var(--color-neutral)",
                                    borderColor: 'var(--color-surface-dark)',
                                    color: 'var(--color-tertiary)'
                                }}
                            />
                        </div>

                        {/* Mentors Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredData.map((mentor) => {
                                const hasRequest = 'status' in mentor && mentor.status;
                                const isSending = sendingRequests.has(mentor.id);

                                return (
                                    <div
                                        key={mentor.id}
                                        className="rounded-xl shadow-sm border transition-all duration-200 hover:shadow-lg hover:scale-105 p-6"
                                        style={{
                                            backgroundColor: 'var(--color-neutral)',
                                            borderColor: 'var(--color-surface-dark)'
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold"
                                                    style={{
                                                        backgroundColor: 'var(--color-surface)',
                                                        color: 'var(--color-primary)'
                                                    }}
                                                >
                                                    {getInitials(mentor.name)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold" style={{ color: 'var(--color-tertiary)' }}>
                                                        {mentor.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            {hasRequest && (
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(mentor.status || undefined)}`}>
                                                    {mentor.status}
                                                </span>
                                            )}
                                        </div>

                                        {/* Mentor Details */}
                                        <div
                                            className="rounded-lg p-3 mb-3 space-y-2"
                                            style={{ backgroundColor: 'var(--color-surface-light)' }}
                                        >
                                            <div className="flex items-center" style={{ color: 'var(--color-tertiary-light)' }}>
                                                <MapPin className="h-4 w-4 mr-2" />
                                                <span className="text-sm">{mentor.location}</span>
                                            </div>
                                            <div className="flex items-center" style={{ color: 'var(--color-tertiary-light)' }}>
                                                <Users className="h-4 w-4 mr-2" />
                                                <span className="text-sm">{mentor.department}</span>
                                            </div>
                                            {mentor.jobTitle && (
                                                <div className="flex items-center" style={{ color: 'var(--color-tertiary-light)' }}>
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    <span className="text-sm">{mentor.jobTitle}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {mentor.skills.slice(0, 5).map((skill: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 text-xs font-medium rounded-full"
                                                    style={{
                                                        backgroundColor: 'var(--color-primary)',
                                                        color: 'var(--color-neutral)'
                                                    }}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Request Message (for Pending/Accepted/Rejected tabs) */}
                                        {activeTab !== 'All' && 'requestMessage' in mentor && mentor.requestMessage && (
                                            <div
                                                onClick={() => setSelectedMessage(mentor.requestMessage!)}
                                                className="rounded-lg p-3 mb-3 cursor-pointer"
                                                style={{ backgroundColor: 'var(--color-surface-light)', minHeight: '60px', maxHeight: '60px', overflow: 'hidden' }}
                                            >
                                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                                                    Your Message
                                                </p>
                                                <p
                                                    className="text-sm"
                                                    style={{
                                                        color: 'var(--color-tertiary-light)',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {mentor.requestMessage}
                                                </p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex justify-between items-center">
                                            {!hasRequest ? (
                                                <button
                                                    onClick={() => handleOpenConnectModal(mentor)}
                                                    disabled={isSending}
                                                    className="w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                                >
                                                    Connect
                                                </button>
                                            ) : mentor.status === 'accepted' ? (
                                                <span className="w-full text-center text-sm font-medium text-green-600 bg-green-100 px-3 py-2 rounded-lg">
                                                    ✓ Connected
                                                </span>
                                            ) : mentor.status === 'rejected' ? (
                                                <span className="w-full text-center text-sm font-medium text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                                                    ✗ Request Declined
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-2 rounded-lg">
                                                        ⏱ Pending
                                                    </span>
                                                    <button
                                                        onClick={() => handleCancelRequest(mentor.id)}
                                                        className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90"
                                                        style={{ backgroundColor: '#ef4444' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* No results message */}
                        {filteredData.length === 0 && (
                            <div className="text-center py-12">
                                <div className="text-lg" style={{ color: 'var(--color-tertiary-light)' }}>
                                    {activeTab === 'All'
                                        ? 'No mentors found matching your search.'
                                        : `No ${activeTab.toLowerCase()} requests found.`
                                    }
                                </div>
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-4 px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                                    style={{
                                        backgroundColor: "var(--color-primary)",
                                        color: "var(--color-neutral)",
                                    }}
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Full Message Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/10 bg-opacity-50 z-50">
                    <div
                        className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full"
                        style={{ backgroundColor: 'var(--color-neutral)' }}
                    >
                        <h2
                            className="text-lg font-semibold mb-3"
                            style={{ color: 'var(--color-secondary)' }}
                        >
                            Your Request Message
                        </h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--color-tertiary)' }}>
                            {selectedMessage}
                        </p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-4 py-2 rounded-md text-white font-medium"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect Request Modal */}
            {connectingMentor && (
                <div className="fixed inset-0 flex items-center justify-center bg-opacity-10 z-50 backdrop-blur-xs">
                    <div
                        className="rounded-lg shadow-xl p-6 w-full max-w-md mx-4 bg-white bg-opacity-95 backdrop-blur-md border"
                        style={{ borderColor: 'var(--color-neutral)' }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2
                                className="text-xl font-semibold"
                                style={{ color: 'var(--color-secondary)' }}
                            >
                                Connect with {connectingMentor.name}
                            </h2>
                            <button
                                onClick={handleCloseConnectModal}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Mentor Info */}
                        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-light)' }}>
                            <div className="flex items-center space-x-3 mb-2">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        color: 'var(--color-primary)'
                                    }}
                                >
                                    {getInitials(connectingMentor.name)}
                                </div>
                                <div>
                                    <p className="font-medium" style={{ color: 'var(--color-tertiary)' }}>
                                        {connectingMentor.name}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--color-tertiary-light)' }}>
                                        {connectingMentor.department}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {connectingMentor.skills.slice(0, 3).map((skill: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 text-xs rounded-full"
                                        style={{
                                            backgroundColor: 'var(--color-primary)',
                                            color: 'var(--color-neutral)'
                                        }}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Request Message Input */}
                        <div className="mb-6">
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: 'var(--color-secondary)' }}
                            >
                                Your Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                placeholder="Introduce yourself and explain why you'd like to connect with this mentor..."
                                rows={4}
                                className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                    backgroundColor: 'var(--color-neutral)',
                                    borderColor: 'var(--color-surface-dark)',
                                    color: 'var(--color-tertiary)'
                                }}
                            />
                            <p className="text-xs mt-1" style={{ color: 'var(--color-tertiary-light)' }}>
                                {requestMessage.length}/500 characters
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            <button
                                onClick={handleCloseConnectModal}
                                className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 hover:bg-opacity-10"
                                style={{
                                    borderColor: 'var(--color-surface-dark)',
                                    color: 'var(--color-secondary)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSendRequest(connectingMentor.id)}
                                disabled={!requestMessage.trim() || sendingRequests.has(connectingMentor.id)}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: 'var(--color-primary)' }}
                            >
                                {sendingRequests.has(connectingMentor.id) ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </div>
                                ) : (
                                    'Send Request'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default MentorsPage;
