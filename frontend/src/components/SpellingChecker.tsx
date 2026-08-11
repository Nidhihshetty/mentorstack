'use client';

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

interface Suggestion {
    word: string;
    offset: number;
    length: number;
    message: string;
    suggestions: string[];
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    rows?: number;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const SpellingChecker = forwardRef<HTMLTextAreaElement, Props>(({ 
    value, 
    onChange, 
    placeholder = "Start typing...", 
    className = '', 
    rows = 4,
    onKeyDown
}, ref) => {
    const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [isChecking, setIsChecking] = useState(false);
    const [justCorrected, setJustCorrected] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Expose the textarea ref to parent component
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }
        };
    }, []);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node) && 
                textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
                setActiveSuggestion(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get cursor/caret position in pixels
    const getCaretCoordinates = useCallback((textarea: HTMLTextAreaElement, position: number) => {
        const div = document.createElement('div');
        const style = getComputedStyle(textarea);
        
        // Copy all relevant styles
        const stylesToCopy = [
            'font', 'fontSize', 'fontFamily', 'fontWeight', 'wordWrap', 'whiteSpace',
            'lineHeight', 'padding', 'borderLeftWidth', 'borderTopWidth', 'letterSpacing'
        ];
        
        for (const prop of stylesToCopy) {
            div.style[prop as any] = style[prop as any];
        }
        
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.width = `${textarea.clientWidth}px`;
        div.style.height = 'auto';
        div.style.overflow = 'hidden';
        
        const textContent = textarea.value.substring(0, position);
        div.textContent = textContent;
        
        const span = document.createElement('span');
        span.textContent = textarea.value.substring(position) || '.';
        div.appendChild(span);
        
        document.body.appendChild(div);
        
        const rect = textarea.getBoundingClientRect();
        const spanRect = span.getBoundingClientRect();
        const divRect = div.getBoundingClientRect();
        
        const coordinates = {
            top: rect.top + (spanRect.top - divRect.top) - textarea.scrollTop,
            left: rect.left + (spanRect.left - divRect.left) - textarea.scrollLeft
        };
        
        div.remove();
        return coordinates;
    }, []);

    // Check spelling with API
    const checkSpelling = useCallback(async (text: string) => {
        if (!text || text.trim().length < 2) {
            setAllSuggestions([]);
            setActiveSuggestion(null);
            return;
        }

        setIsChecking(true);
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/spellcheck`, { text });
            let suggestions = Array.isArray(response.data?.suggestions) 
                ? response.data.suggestions 
                : [];
            
            // VALIDATION: Filter out multi-word errors and FIX bad offsets (AI mistakes)
            const validatedSuggestions: Suggestion[] = [];
            
            for (const sug of suggestions) {
                const word = sug.word || '';
                
                // Reject if word contains spaces (multiple words grouped together)
                if (word.includes(' ')) {
                    console.warn('🚫 Rejected multi-word error:', word);
                    continue;
                }
                
                // Reject if word is suspiciously long (probably multiple words)
                if (word.length > 30) {
                    console.warn('🚫 Rejected overly long word:', word);
                    continue;
                }
                
                // CRITICAL: Filter out useless suggestions where all corrections are the same as the original word
                if (Array.isArray(sug.suggestions)) {
                    const wordLowerCase = word.toLowerCase().trim();
                    const validCorrections = sug.suggestions.filter((correction: string) => {
                        const correctionLower = (correction || '').toLowerCase().trim();
                        return correctionLower !== wordLowerCase && correctionLower.length > 0;
                    });
                    
                    // If no valid corrections after filtering, skip this suggestion
                    if (validCorrections.length === 0) {
                        console.warn('🚫 Rejected suggestion with no valid corrections:', word);
                        continue;
                    }
                    
                    // Update suggestions with only valid corrections
                    sug.suggestions = validCorrections;
                }
                
                // CRITICAL: Find the ACTUAL position of this word in the text
                const wordLower = word.toLowerCase();
                const actualText = text.substring(sug.offset, sug.offset + sug.length);
                const actualLower = actualText.toLowerCase();
                
                let finalOffset = sug.offset;
                let finalLength = sug.length;
                
                // If the word at the AI's offset doesn't match, search for it
                if (actualLower !== wordLower) {
                    console.warn('⚠️ AI offset mismatch, searching for word:', {
                        aiSays: word,
                        actualTextAtOffset: actualText,
                        aiOffset: sug.offset
                    });
                    
                    // Search for the word in the text (case-insensitive)
                    const escapedWord = word.split('').map((char: string) => {
                        if (/[.*+?^${}()|[\]\\]/.test(char)) {
                            return '\\' + char;
                        }
                        return char;
                    }).join('');
                    
                    const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
                    const match = text.match(wordRegex);
                    
                    if (match && match.index !== undefined) {
                        finalOffset = match.index;
                        finalLength = match[0].length;
                        console.log('✅ Found correct position:', { word, offset: finalOffset, length: finalLength });
                    } else {
                        console.warn('🚫 Could not find word in text, skipping:', word);
                        continue; // Skip this suggestion
                    }
                }
                
                // Add the validated suggestion with corrected offset
                validatedSuggestions.push({
                    ...sug,
                    offset: finalOffset,
                    length: finalLength
                });
            }
            
            setAllSuggestions(validatedSuggestions);
        } catch (error) {
            console.error('Spellcheck error:', error);
            setAllSuggestions([]);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Debounced spellcheck on text change
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        
        // Clear existing timeout
        if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
        }
        
        // Debounce spellcheck
        checkTimeoutRef.current = setTimeout(() => {
            checkSpelling(newValue);
        }, 500);
    };

    // Handle click on textarea - show popup if clicking on misspelled word
    const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart;
        
        // Find if cursor is on or NEAR a misspelled word (more forgiving)
        let matchedSuggestion = null;
        let bestDistance = Infinity;
        
        for (const s of allSuggestions) {
            const wordStart = s.offset;
            const wordEnd = s.offset + s.length;
            
            // Check if cursor is INSIDE the word
            if (cursorPos >= wordStart && cursorPos <= wordEnd) {
                matchedSuggestion = s;
                break; // Direct hit, use this
            }
            
            // Check if cursor is NEAR the word (within 2 characters)
            const distanceToStart = Math.abs(cursorPos - wordStart);
            const distanceToEnd = Math.abs(cursorPos - wordEnd);
            const minDistance = Math.min(distanceToStart, distanceToEnd);
            
            if (minDistance < bestDistance && minDistance <= 2) {
                bestDistance = minDistance;
                matchedSuggestion = s;
            }
        }
        
        if (matchedSuggestion) {
            const coords = getCaretCoordinates(textarea, matchedSuggestion.offset);
            setPopupPosition({
                top: coords.top + 25,
                left: coords.left
            });
            setActiveSuggestion(matchedSuggestion);
        } else {
            setActiveSuggestion(null);
        }
    };

    // Apply correction with smart position handling
    const applyCorrection = (correction: string) => {
        if (!activeSuggestion) return;
        
        // CRITICAL: Find the ACTUAL word in the current text
        // The AI's offsets might be stale if previous corrections were made
        
        const aiWord = activeSuggestion.word.toLowerCase();
        const startPos = activeSuggestion.offset;
        
        // Strategy: Look for the word near the suggested offset
        // This handles cases where previous corrections shifted positions
        
        let actualStart = -1;
        let actualEnd = -1;
        
        // First, try the exact position the AI suggested
        const wordAtOffset = value.substring(startPos, startPos + activeSuggestion.length);
        if (wordAtOffset.toLowerCase() === aiWord) {
            actualStart = startPos;
            actualEnd = startPos + activeSuggestion.length;
        } else {
            // If not found at exact position, search nearby (within 10 chars)
            const searchStart = Math.max(0, startPos - 10);
            const searchEnd = Math.min(value.length, startPos + 20);
            const searchText = value.substring(searchStart, searchEnd);
            
            // Escape special regex characters in the word
            const escapedWord = aiWord.split('').map(char => {
                if (/[.*+?^${}()|[\]\\]/.test(char)) {
                    return '\\' + char;
                }
                return char;
            }).join('');
            
            const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
            const match = searchText.match(wordRegex);
            
            if (match && match.index !== undefined) {
                actualStart = searchStart + match.index;
                actualEnd = actualStart + match[0].length;
            }
        }
        
        // If we couldn't find the word, abort
        if (actualStart === -1) {
            console.error('❌ Could not find word to replace:', aiWord);
            setActiveSuggestion(null);
            return;
        }
        
        const before = value.substring(0, actualStart);
        const after = value.substring(actualEnd);
        const originalWord = value.substring(actualStart, actualEnd);
        
        console.log('🔍 Replacing:', {
            original: originalWord,
            correction: correction,
            position: `${actualStart}-${actualEnd}`,
            aiSuggestedPos: `${startPos}-${startPos + activeSuggestion.length}`,
            match: actualStart === startPos ? 'exact' : 'nearby'
        });
        
        const newValue = before + correction + after;
        
        onChange(newValue);
        setActiveSuggestion(null);
        
        // Show success animation
        setJustCorrected(true);
        setTimeout(() => setJustCorrected(false), 1000);
        
        // Recheck immediately to get fresh offsets
        setTimeout(() => checkSpelling(newValue), 100);
    };

    // Ignore this suggestion
    const ignoreSuggestion = () => {
        if (!activeSuggestion) return;
        
        setAllSuggestions(prev => 
            prev.filter(s => s.offset !== activeSuggestion.offset)
        );
        setActiveSuggestion(null);
    };

    // Render text with underlines for errors
    const renderHighlightedText = () => {
        if (allSuggestions.length === 0) return null;
        
        const parts: React.ReactElement[] = [];
        let lastIndex = 0;
        let partIndex = 0;
        
        for (const sug of allSuggestions) {
            // Use EXACT offsets from AI (no expansion)
            const startPos = sug.offset;
            const endPos = sug.offset + sug.length;
            
            // Text before error
            if (startPos > lastIndex) {
                parts.push(
                    <span key={`text-before-${partIndex}`}>
                        {value.substring(lastIndex, startPos)}
                    </span>
                );
                partIndex++;
            }
            
            // Highlighted error (exact word only)
            parts.push(
                <span
                    key={`error-${startPos}-${sug.word}`}
                    className="relative underline decoration-wavy decoration-red-500 decoration-2 cursor-pointer"
                    style={{ textUnderlineOffset: '3px' }}
                >
                    {value.substring(startPos, endPos)}
                </span>
            );
            partIndex++;
            
            lastIndex = endPos;
        }
        
        // Remaining text
        if (lastIndex < value.length) {
            parts.push(
                <span key="text-end">
                    {value.substring(lastIndex)}
                </span>
            );
        }
        
        return parts;
    };

    return (
        <div className="relative">
            {/* Highlighted overlay */}
            <div className="relative">
                <div
                    className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words p-4 border border-transparent rounded-lg"
                    style={{
                        font: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        color: 'transparent',
                        zIndex: 1
                    }}
                    aria-hidden="true"
                >
                    {renderHighlightedText()}
                </div>
                
                {/* Actual textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleTextChange}
                    onClick={handleTextareaClick}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    className={`relative w-full p-4 border rounded-lg resize-none
                        focus:outline-none
                        transition-all duration-200
                        ${justCorrected ? 'ring-2 ring-green-400 hover:border-primary border-green-400' : 'border-gray-300 focus:border-gray-400'}
                        ${className}`}
                    style={{
                        background: 'transparent',
                        caretColor: 'black',
                        zIndex: 2
                    }}
                    rows={rows}
                    spellCheck={false}
                />
            </div>

            {/* Checking indicator */}
            {isChecking && (
                <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm z-10">
                    <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                    Checking...
                </div>
            )}

            {/* Suggestions count badge */}
            {allSuggestions.length > 0 && !isChecking && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white bg-red-500 px-2 py-1 rounded-full shadow-sm z-10">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {allSuggestions.length} {allSuggestions.length === 1 ? 'error' : 'errors'}
                </div>
            )}

            {/* Correction popup */}
            {activeSuggestion && (
                <div
                    ref={popupRef}
                    className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-3 z-50 min-w-[200px] max-w-[280px]"
                    style={{
                        top: `${popupPosition.top}px`,
                        left: `${popupPosition.left}px`
                    }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2 pb-2 border-b border-gray-200">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-red-600 line-through">
                                    {value.substring(activeSuggestion.offset, activeSuggestion.offset + activeSuggestion.length)}
                                </span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <div className="text-xs text-gray-500">
                                {activeSuggestion.message}
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveSuggestion(null)}
                            className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-1">
                        {activeSuggestion.suggestions.slice(0, 5).map((correction, index) => (
                            <button
                                key={`suggestion-${activeSuggestion.offset}-${index}`}
                                onClick={() => applyCorrection(correction)}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 
                                    text-sm text-gray-700 transition-colors flex items-center justify-between group"
                            >
                                <span className="font-medium">{correction}</span>
                                <svg className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                            onClick={ignoreSuggestion}
                            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Ignore
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

SpellingChecker.displayName = 'SpellingChecker';

export default SpellingChecker;