// app/summarize/page.tsx
"use client";

import { useState } from "react";

function SummarizePage() {
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const addAnswer = () => {
    if (input.trim() !== "") {
      setAnswers([...answers, input.trim()]);
      setInput("");
    }
  };

  const getSummary = async () => {
    if (answers.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) throw new Error("Failed to fetch summary");

      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      setSummary("Error generating summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Summarize Answers</h1>

      {/* Input for adding answers */}
      <div className="flex mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter an answer..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 mr-2"
        />
        <button
          onClick={addAnswer}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* Display list of answers */}
      {answers.length > 0 && (
        <ul className="mb-4 list-disc list-inside">
          {answers.map((ans, idx) => (
            <li key={idx}>{ans}</li>
          ))}
        </ul>
      )}

      {/* Summarize button */}
      <button
        onClick={getSummary}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Summarizing..." : "Get Summary"}
      </button>

      {/* Summary output */}
      {summary && <p className="mt-4 p-4 bg-gray-100 rounded">{summary}</p>}
    </div>
  );
}

export default SummarizePage;
