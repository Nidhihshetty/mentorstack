"use client";
import React, { useState } from "react";
import Layout from "../../components/Layout";
import SpellingChecker from "../../components/SpellingChecker";

export default function SpellingCheckDemo() {
  const [title, setTitle] = useState("React componant example");
  const [description, setDescription] = useState("This is a short descrption with a typo.");
  const [notes, setNotes] = useState("I have tried to fix the bug but couldnt find the cause.");

  return (
    <Layout>
      <div className="container mx-auto p-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Spelling Checker Demo</h1>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Title</label>
          <SpellingChecker value={title} onChange={setTitle} rows={1} />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Description</label>
          <SpellingChecker value={description} onChange={setDescription} rows={4} />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Notes</label>
          <SpellingChecker value={notes} onChange={setNotes} rows={4} />
        </div>

        <div className="mt-8 bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Current values</h3>
          <pre className="text-sm">{JSON.stringify({ title, description, notes }, null, 2)}</pre>
        </div>
      </div>
    </Layout>
  );
}
