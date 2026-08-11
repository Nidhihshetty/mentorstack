"use client";
import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Layout from "../../components/Layout";
import { Paperclip, Smile } from "lucide-react";
import dynamic from "next/dynamic";
import { useMentorMenteeChat } from "../../lib/useMentorMenteeChat";
import { useSearchParams } from "next/navigation";
type Message = {
    from: string;
    text: string;
    time: string;
    fileUrl?: string; // optional for uploaded files
    emoji?: string;   // optional for emoji reactions
};

// Dynamic import for emoji picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function ChatsPageContent() {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { connections, messages, selectConnection, send, activeConnectionId, refetch, currentUserId } = useMentorMenteeChat();
    const searchParams = useSearchParams();

    // Auto-open connection if provided as query param
    useEffect(() => {
        const cid = searchParams?.get('connectionId');
        if (cid) {
            const id = Number(cid);
            if (!Number.isNaN(id)) selectConnection(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Send text message
    const handleSend = () => {
        if (!message.trim() || !activeConnectionId) return;
        send(message.trim());
        setMessage("");
    };

    // Trigger file picker
    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // File sending not implemented yet for realtime; ignore selection for now
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Handle emoji click
    const onEmojiClick = (emojiData: any) => {
        setMessage((prev) => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Filter chats based on search query
    const filteredChats = useMemo(() => {
        const list = connections.map((c: any) => ({
            id: c.connectionId,
            name: c.counterpart?.name || `Connection ${c.connectionId}`,
            avatar: (c.counterpart?.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase(),
            lastMessage: c.lastMessage?.text || '',
            time: c.lastMessage ? new Date(c.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        }));
        const filtered = list.filter((chat: any) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()));
        // If there's a search query, prioritize exact matches and then partial matches
        filtered.sort((a: any, b: any) => {
            if (searchQuery) {
                const aExactMatch = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
                const bExactMatch = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());
                if (aExactMatch && !bExactMatch) return -1;
                if (!aExactMatch && bExactMatch) return 1;
            }
            return 0;
        });
        return filtered;
    }, [connections, searchQuery]);

    return (
        <Layout>
            <div className="h-full bg-neutral-dark flex flex-col p-2 md:p-4">
                <div className="text-2xl md:text-3xl font-bold mb-2 md:mb-4 text-gray-900 w-full text-left p-2 md:p-4 rounded-t-2xl" style={{ backgroundColor: "var(--color-neutral-dark)" }}>
                    Chats
                </div>
                <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col md:flex-row border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                    {/* Chat List */}
                    <div className={`${activeConnectionId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200 flex-col`} style={{ backgroundColor: "var(--color-neutral)" }}>
                        <div className="p-4 border-b border-gray-200">
                            <input
                                type="text"
                                placeholder="Search chats"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                style={{ backgroundColor: "var(--color-surface)" }}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredChats.length > 0 ? (
                                filteredChats.map((chat: any) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => selectConnection(chat.id)}
                                        className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-200 hover:bg-gray-100 ${
                                            activeConnectionId === chat.id ? "bg-gray-100" : ""
                                        }`}
                                    >
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold mr-3"
                                            style={{ backgroundColor: "var(--color-primary)" }}>
                                            {chat.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {searchQuery ? (
                                                        <span dangerouslySetInnerHTML={{
                                                            __html: chat.name.replace(
                                                                new RegExp(`(${searchQuery})`, 'gi'),
                                                                '<mark class="bg-yellow-200">$1</mark>'
                                                            )
                                                        }} />
                                                    ) : (
                                                        chat.name
                                                    )}
                                                </h3>
                                                <span className="text-xs text-gray-500">{chat.time}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center p-8 text-gray-500">
                                    <div className="text-center">
                                        <p className="text-sm">No chats found</p>
                                        <p className="text-xs mt-1">Try searching with a different name</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Window */}
                    <div className={`${activeConnectionId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`} style={{ backgroundColor: "var(--color-neutral)" }}>
                        {activeConnectionId ? (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between px-2 md:px-4 py-3 border-b border-gray-200">
                                    <button 
                                        onClick={() => selectConnection(0)}
                                        className="md:hidden mr-2 p-2 hover:bg-gray-100 rounded"
                                    >
                                        ←
                                    </button>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold"
                                            style={{ backgroundColor: "var(--color-primary)" }}>
                                            {filteredChats.find((c: any) => c.id === activeConnectionId)?.avatar}
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {filteredChats.find((c: any) => c.id === activeConnectionId)?.name}
                                        </h2>
                                    </div>
                                </div>

                                <div className="text-center text-xs text-gray-500 mt-3">Today</div>

                                {/* Messages */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {messages.map((m: any, index: number) => (
                                        <div key={index} className={`flex ${m.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                                            <div className="max-w-xs">
                                                <div
                                                    className={`px-4 py-2 rounded-lg text-sm relative ${
                                                        m.senderId === currentUserId ? "text-white" : "text-gray-900"
                                                    }`}
                                                    style={{
                                                        backgroundColor:
                                                            m.senderId === currentUserId
                                                                ? "var(--color-primary)"
                                                                : "var(--color-surface)",
                                                    }}
                                                >
                                                    {m.content}
                                                    <span className="block text-[10px] mt-1 opacity-70 text-right">
                                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-gray-200 flex items-center space-x-2 relative">
                                    <button
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                        className="text-gray-500"
                                    >
                                        <Smile size={20} />
                                    </button>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-16 left-4 z-10">
                                            <EmojiPicker onEmojiClick={onEmojiClick} />
                                        </div>
                                    )}
                                    <button onClick={handleFileClick} className="text-gray-500">
                                        <Paperclip size={20} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.jpg,.png,.txt"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Type a message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        style={{ backgroundColor: "var(--color-surface)" }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: "var(--color-primary)" }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                Select a chat to start messaging
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default function ChatsPage() {
    return (
        <Suspense fallback={
            <Layout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-gray-500">Loading chats...</div>
                </div>
            </Layout>
        }>
            <ChatsPageContent />
        </Suspense>
    );
}
