"use client";

import React, { useEffect, useState } from "react";
import { checkSpelling } from "@/utils/spellingcheck";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function SpellCheckPage() {
    const [text, setText] = useState("I am extremly eager to lern new things.");
    const [corrections, setCorrections] = useState<
        { word: string; indexStart: number; indexEnd: number; suggestions: string[] }[]
    >([]);

    const [loading, setLoading] = useState(false);

    const handleSpellCheck = async () => {
        setLoading(true);
        const result = await checkSpelling(text);
        setCorrections(result);
        setLoading(false);
    };

    const replaceWord = (start: number, end: number, suggestion: string) => {
        setText((prev) => prev.slice(0, start) + suggestion + prev.slice(end));
        // re-check spelling after replacement
        setTimeout(handleSpellCheck, 200);
    };

    // Re-run check when text changes slightly (optional live mode)
    useEffect(() => {
        const delay = setTimeout(handleSpellCheck, 500);
        return () => clearTimeout(delay);
    }, [text]);

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-xl font-bold mb-3">Offline Spell Checker</h1>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full p-3 border rounded-md focus:outline-none"
            />

            {loading && <p className="text-sm text-gray-500 mt-2">Checking...</p>}

            <div className="mt-4 text-lg leading-relaxed">
                {text.split(/\b/).map((segment, idx) => {
                    const correction = corrections.find(
                        (c) => c.word.toLowerCase() === segment.toLowerCase()
                    );
                    if (!correction) return <span key={idx}>{segment}</span>;

                    return (
                        <Popover key={idx}>
                            <PopoverTrigger asChild>
                                <span className="underline decoration-red-500 decoration-2 cursor-pointer">
                                    {segment}
                                </span>
                            </PopoverTrigger>
                            <PopoverContent className="p-2">
                                <div className="flex flex-col gap-1">
                                    {correction.suggestions.length > 0 ? (
                                        correction.suggestions.map((sugg, i) => (
                                            <Button
                                                key={i}
                                                variant="ghost"
                                                onClick={() =>
                                                    replaceWord(correction.indexStart, correction.indexEnd, sugg)
                                                }
                                                className="justify-start"
                                            >
                                                {sugg}
                                            </Button>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-500">No suggestions</span>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </div>
        </div>
    );
}
