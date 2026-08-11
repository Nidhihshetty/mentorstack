"use client";

import { useState } from "react";

export default function TagsRecommendationPage() {
    const [question, setQuestion] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleRecommend = async () => {
        setLoading(true);
        setTags([]);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rectags`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question, content }),
            });

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();
            setTags(data.tags || []);
        } catch (err) {
            console.error("Error fetching tags:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
                <h1 className="text-2xl font-bold mb-4">Tags Recommendation</h1>

                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter question..."
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                    rows={2}
                />

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter content..."
                    className="w-full p-2 border border-gray-300 rounded mb-3"
                    rows={4}
                />

                <button
                    onClick={handleRecommend}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Recommending..." : "Get Tags"}
                </button>

                {tags.length > 0 && (
                    <div className="mt-4">
                        <h2 className="font-semibold mb-2">Recommended Tags:</h2>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, idx) => (
                                <span
                                    key={idx}
                                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}