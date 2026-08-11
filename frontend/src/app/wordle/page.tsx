// frontend/src/wordle/page.tsx
"use client";
import { useEffect, useState } from "react";

type LetterStatus = "correct" | "present" | "absent" | "";

export default function WordlePage() {
    const [dailyWord, setDailyWord] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [status, setStatus] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/wordle/daily`)
            .then(res => res.json())
            .then(data => {
                setDailyWord(data.word.toUpperCase());
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch daily word:", err);
                setStatus("Failed to load daily word");
                setLoading(false);
            });
    }, []);

    const checkGuess = (guess: string): LetterStatus[] => {
        const result: LetterStatus[] = [];
        const wordArray = dailyWord.split("");
        const guessArray = guess.split("");
        
        // First pass: mark correct letters
        const wordCounts: { [key: string]: number } = {};
        for (let i = 0; i < 5; i++) {
            if (guessArray[i] === wordArray[i]) {
                result[i] = "correct";
            } else {
                result[i] = ""; // placeholder
                wordCounts[wordArray[i]] = (wordCounts[wordArray[i]] || 0) + 1;
            }
        }
        
        // Second pass: mark present/absent letters
        for (let i = 0; i < 5; i++) {
            if (result[i] === "correct") continue;
            
            if (wordCounts[guessArray[i]] > 0) {
                result[i] = "present";
                wordCounts[guessArray[i]]--;
            } else {
                result[i] = "absent";
            }
        }
        
        return result;
    };

    const handleSubmit = () => {
        if (currentGuess.length !== 5) {
            setStatus("Word must be 5 letters long");
            return;
        }
        
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        
        if (currentGuess === dailyWord) {
            setStatus("🎉 Correct! You solved it.");
        } else if (newGuesses.length >= 6) {
            setStatus(`❌ Game Over! The word was ${dailyWord}`);
        } else {
            setStatus(""); // Clear any previous error messages
        }
        setCurrentGuess("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        } else if (e.key === "Backspace") {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
            setCurrentGuess(prev => prev + e.key.toUpperCase());
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center p-6" onKeyDown={handleKeyPress} tabIndex={0}>
            <h1 className="text-2xl font-bold mb-4">Wordle Daily Challenge</h1>

            {/* Display all 6 rows */}
            {Array.from({ length: 6 }, (_, rowIdx) => {
                const guess = guesses[rowIdx] || "";
                const isCurrentRow = rowIdx === guesses.length && status === "";
                const displayGuess = isCurrentRow ? currentGuess.padEnd(5, " ") : guess.padEnd(5, " ");
                const statuses = guess ? checkGuess(guess) : Array(5).fill("");

                return (
                    <div key={rowIdx} className="flex mb-2">
                        {displayGuess.split("").map((char, i) => (
                            <div
                                key={i}
                                className={`w-12 h-12 flex items-center justify-center border-2 mx-1 text-xl font-bold
                                    ${guess ? (
                                        statuses[i] === "correct" ? "bg-green-500 text-white border-green-500" :
                                        statuses[i] === "present" ? "bg-yellow-400 text-white border-yellow-400" : 
                                        "bg-gray-400 text-white border-gray-400"
                                    ) : isCurrentRow ? "border-gray-600" : "border-gray-300"}`}
                            >
                                {char === " " ? "" : char}
                            </div>
                        ))}
                    </div>
                );
            })}

            {status === "" && guesses.length < 6 && (
                <div className="mt-4">
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 text-lg"
                        disabled={currentGuess.length !== 5}
                    >
                        Submit Guess
                    </button>
                </div>
            )}

            {status && <p className="mt-4 text-lg font-semibold">{status}</p>}
            
            <div className="mt-4 text-sm text-gray-600">
                Guesses: {guesses.length}/6
            </div>
        </div>
    );
}