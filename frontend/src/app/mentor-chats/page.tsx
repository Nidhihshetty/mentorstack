"use client";
import React, { useState, useRef } from "react";
import Layout from "../../components/Layout";
import { Paperclip, Smile } from "lucide-react";
import dynamic from "next/dynamic";
type Message = {
    from: string;
    text: string;
    time: string;
    fileUrl?: string; // optional for uploaded files
    emoji?: string;   // optional for emoji reactions
};

// Dynamic import for emoji picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const ChatsPage = () => {
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Sample chats
    const [chats, setChats] = useState<Array<{
        id: number;
        name: string;
        avatar: string;
        lastMessage: string;
        time: string;
        messages: Message[];
    }>>([
        {
            id: 1,
            name: "Nidhish Shettigar",
            avatar: "NS",
            lastMessage: "Hey, let’s connect tomorrow!",
            time: "10:45 AM",
            messages: [
                { from: "mentor", text: "Hi, how can I help you?", time: "10:00 AM", fileUrl: undefined },
                { from: "me", text: "I wanted to know more about Flutter.", time: "10:15 AM", fileUrl: undefined },
                { from: "mentor", text: "Sure! We can discuss that.", time: "10:30 AM", fileUrl: undefined },
            ],
        },
        {
            id: 2,
            name: "Sanidhya K Bhandary",
            avatar: "SB",
            lastMessage: "I'll send you the Selenium docs.",
            time: "10:45 AM",
            messages: [
                { from: "mentor", text: "Hello!", time: "5:00 PM", fileUrl: undefined },
                { from: "me", text: "Can you guide me with testing?", time: "5:10 PM", fileUrl: undefined },
                { from: "mentor", text: "Absolutely, I'll share resources.", time: "5:15 PM", fileUrl: undefined },
            ],
        },
    ]);

    // Send text message
    const handleSend = () => {
        if (!message.trim() || selectedChat === null) return;
        const updatedChats = [...chats];
        const chatIndex = updatedChats.findIndex((c) => c.id === selectedChat);
        updatedChats[chatIndex].messages.push({
            from: "me",
            text: message,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fileUrl: undefined,
        });
        setChats(updatedChats);
        setMessage("");
    };

    // Trigger file picker
    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || selectedChat === null) return;

        const fileUrl = URL.createObjectURL(file); // ✅ local preview

        const updatedChats = [...chats];
        const chatIndex = updatedChats.findIndex((c) => c.id === selectedChat);

        const newMessage: Message = {
            from: "me",
            text: `📎 ${file.name}`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fileUrl,
        };

        updatedChats[chatIndex].messages.push(newMessage);
        setChats(updatedChats);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle emoji click
    const onEmojiClick = (emojiData: any) => {
        setMessage((prev) => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    // Filter chats based on search query
    const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        // If there's a search query, prioritize exact matches and then partial matches
        if (searchQuery) {
            const aExactMatch = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
            const bExactMatch = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());

            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
        }
        return 0; // Keep original order for non-prioritized items
    });

    return (
        <Layout>
            <div className="h-full bg-neutral-dark flex flex-col items-center justify-center p-1">
                <div className="text-3xl font-bold mb-4 text-gray-900 w-full text-left p-4 rounded-t-2xl" style={{ backgroundColor: "var(--color-neutral-dark)" }}>
                    Mentees
                </div>
                <div className="w-full max-w-7xl h-5/6 flex border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                    {/* Chat List */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col" style={{ backgroundColor: "var(--color-neutral)" }}>
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
                                filteredChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat.id)}
                                        className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-200 hover:bg-gray-100 ${
                                            selectedChat === chat.id ? "bg-gray-100" : ""
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
                    <div className="flex-1 flex flex-col" style={{ backgroundColor: "var(--color-neutral)" }}>
                        {selectedChat ? (
                            <>
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold"
                                            style={{ backgroundColor: "var(--color-primary)" }}>
                                            {chats.find((c) => c.id === selectedChat)?.avatar}
                                        </div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {chats.find((c) => c.id === selectedChat)?.name}
                                        </h2>
                                    </div>
                                </div>

                                <div className="text-center text-xs text-gray-500 mt-3">Today</div>

                                {/* Messages */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {chats.find((c) => c.id === selectedChat)?.messages.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                                            <div className="max-w-xs">
                                                <div
                                                    className={`px-4 py-2 rounded-lg text-sm relative ${
                                                        msg.from === "me" ? "text-white" : "text-gray-900"
                                                    }`}
                                                    style={{
                                                        backgroundColor:
                                                            msg.from === "me"
                                                                ? "var(--color-primary)"
                                                                : "var(--color-surface)",
                                                    }}
                                                >
                                                        {msg.fileUrl && typeof msg.fileUrl === "string" && msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)
                                                            ? <img src={msg.fileUrl} alt={msg.text} className="rounded-lg max-h-32 mb-1" />
                                                            : msg.fileUrl && typeof msg.fileUrl === "string"
                                                                ? <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{msg.text}</a>
                                                                : msg.text}
                                                    <span className="block text-[10px] mt-1 opacity-70 text-right">
                                                        {msg.time}
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
};

export default ChatsPage;
