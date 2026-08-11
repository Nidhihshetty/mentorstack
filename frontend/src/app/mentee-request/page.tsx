// pages/requests.tsx or app/requests/page.tsx
"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { Search, MessageSquare, User, Menu } from 'lucide-react';
import Layout from "../../components/Layout";
import { authAPI } from "@/lib/auth-api";

interface RequestCard {
    id: string;
    menteeId: number;
    name: string;
    email: string;
    avatar?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    skills: string[];
    status: 'Pending' | 'Accepted' | 'Rejected';
    fullMessage: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const RequestsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Accepted' | 'Rejected'>('All');
    const [searchText, setSearchText] = useState('');
    const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());
    const [rejectingRequests, setRejectingRequests] = useState<Set<string>>(new Set());
    const [requests, setRequests] = useState<RequestCard[]>([]);
    const [loading, setLoading] = useState(true);

    // New state for modal
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

    // Fetch requests on component mount
    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await authAPI.getAllMentorshipRequests();
            setRequests(response.requests);
        } catch (error) {
            console.error('Error fetching requests:', error);
            alert('Failed to load mentorship requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (requestId: string) => {
        setLoadingRequests(prev => new Set(prev).add(requestId));

        try {
            const response = await authAPI.acceptMentorshipRequest(requestId);
            
            // Update local state to reflect the acceptance
            setRequests(prevRequests =>
                prevRequests.map(request =>
                    request.id === requestId
                        ? { ...request, status: 'Accepted' as const }
                        : request
                )
            );
            
            if (response.data.reputation?.applied) {
                alert(`Request accepted successfully! (+${response.data.reputation.appliedPoints} reputation, total ${response.data.reputation.currentReputation})`);
            } else {
                alert(`Request accepted successfully! You can now chat with ${response.data.mentee.name}.`);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Failed to accept request. Please try again.');
        } finally {
            setLoadingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        setRejectingRequests(prev => new Set(prev).add(requestId));

        try {
            const response = await authAPI.rejectMentorshipRequest(requestId);

            // Update local state to reflect the rejection
            setRequests(prevRequests =>
                prevRequests.map(request =>
                    request.id === requestId
                        ? { ...request, status: 'Rejected' as const }
                        : request
                )
            );

            alert('Request rejected successfully!');
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request. Please try again.');
        } finally {
            setRejectingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const filteredRequests = useMemo(() => {
        let filtered = requests;
        if (activeTab !== 'All') {
            filtered = filtered.filter(request => request.status === activeTab);
        }
        if (searchText.trim()) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter(request =>
                request.name.toLowerCase().includes(searchLower) ||
                request.fullMessage.toLowerCase().includes(searchLower)
            );
        }
        return filtered;
    }, [activeTab, searchText, requests]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'New':
                return 'bg-blue-100 text-blue-700';
            case 'Accepted':
                return 'bg-green-100 text-green-700';
            case 'Rejected':
                return 'bg-red-100 text-red-700';
            case 'Pending':
            default:
                return 'bg-orange-100 text-orange-700';
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-neutral-dark flex">
                <div className="flex-1 min-w-0">
                    <main className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-tertiary)' }}>
                                Requests
                            </h1>
                            <div className="text-sm" style={{ color: 'var(--color-tertiary-light)' }}>
                                {requests.length} requests
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                            {(['All', 'Pending', 'Accepted', 'Rejected'] as const).map((tab) => (
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
                                    {tab} ({tab === 'All' ? requests.length : requests.filter(r => r.status === tab).length})
                                </button>
                            ))}
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                                <p className="mt-4" style={{ color: 'var(--color-tertiary-light)' }}>Loading requests...</p>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <p className="text-lg" style={{ color: 'var(--color-tertiary-light)' }}>
                                    {searchText ? 'No requests match your search.' : `No ${activeTab !== 'All' ? activeTab.toLowerCase() : ''} requests found.`}
                                </p>
                            </div>
                        ) : (
                            /* Request Cards Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="rounded-xl shadow-sm border transition-all duration-200 hover:shadow-lg hover:scale-105 p-6"
                                    style={{
                                        backgroundColor: 'var(--color-neutral)',
                                        borderColor: 'var(--color-surface-dark)'
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: 'var(--color-surface)' }}
                                            >
                                                <User size={20} style={{ color: 'var(--color-primary)' }} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold" style={{ color: 'var(--color-tertiary)' }}>
                                                    {request.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <span
                                            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}
                                        >
                                            {request.status}
                                        </span>
                                    </div>

                                    {/* Message Preview */}
                                    <div
                                        onClick={() => setSelectedMessage(request.fullMessage)}
                                        className="rounded-lg p-3 mb-3 cursor-pointer"
                                        style={{ backgroundColor: 'var(--color-surface-light)', minHeight: '80px', maxHeight: '80px', overflow: 'hidden' }}
                                    >
                                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-secondary)' }}>
                                            Message
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
                                            {request.fullMessage}
                                        </p>
                                    </div>

                                    <div className='flex flex-row justify-between items-center'>
                                        <div>
                                            {request.status === 'Accepted' ? (
                                                <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                                    ✓ Accepted
                                                </span>
                                            ) : request.status === 'Rejected' ? (
                                                <span className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
                                                    ✗ Rejected
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAcceptRequest(request.id)}
                                                    disabled={loadingRequests.has(request.id) || rejectingRequests.has(request.id)}
                                                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                                >
                                                    {loadingRequests.has(request.id) ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            <span>Accepting...</span>
                                                        </div>
                                                    ) : (
                                                        'Accept'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            {request.status === 'Accepted' || request.status === 'Rejected' ? null : (
                                                <button
                                                    onClick={() => handleRejectRequest(request.id)}
                                                    disabled={loadingRequests.has(request.id) || rejectingRequests.has(request.id)}
                                                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                                                    style={{ 
                                                        backgroundColor: '#ef4444',
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                >
                                                    {rejectingRequests.has(request.id) ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            <span>Rejecting...</span>
                                                        </div>
                                                    ) : (
                                                        'Reject'
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Full Message Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/10 bg-opacity- z-50">
                    <div
                        className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full"
                        style={{ backgroundColor: 'var(--color-neutral)' }}
                    >
                        <h2
                            className="text-lg font-semibold mb-3"
                            style={{ color: 'var(--color-secondary)' }}
                        >
                            Full Message
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
        </Layout>
    );
};

export default RequestsPage;
