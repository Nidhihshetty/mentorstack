"use client";

import React, { useState } from "react";

export default function RephrasePage() {
  const [inputText, setInputText] = useState("");
  const [rephrasedText, setRephrasedText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRephrase = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/rephrase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      setRephrasedText(data.rephrasedText);
    } catch (error) {
      console.error(error);
      setRephrasedText("Error while rephrasing");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Rephraser</h1>

      <textarea
        className="w-full p-2 border rounded mb-4"
        rows={4}
        placeholder="Enter text to rephrase"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button
        onClick={handleRephrase}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Rephrasing..." : "Rephrase"}
      </button>

      {rephrasedText && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Rephrased Text:</h2>
          <p>{rephrasedText}</p>
        </div>
      )}
    </div>
  );
}
