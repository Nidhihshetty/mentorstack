import { Router } from "express";
import { generateWithGemini } from "../lib/gemini";

const router = Router();

interface SpellSuggestion {
  word: string;
  offset: number;
  length: number;
  message: string;
  suggestions: string[];
}

const parseGeminiSuggestions = (responseText: string): SpellSuggestion[] => {
  const cleanedResponse = responseText
    .trim()
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "");

  const jsonMatch = /\[[\s\S]*\]/.exec(cleanedResponse);
  if (!jsonMatch) return [];

  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((item: any) => {
    return (
      typeof item?.word === "string" &&
      typeof item?.offset === "number" &&
      typeof item?.length === "number" &&
      Array.isArray(item?.suggestions)
    );
  });
};

const checkWithLanguageTool = async (text: string): Promise<SpellSuggestion[]> => {
  const body = new URLSearchParams({
    text,
    language: "en-US",
    enabledOnly: "false",
  });

  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`LanguageTool request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    matches?: Array<{
      offset?: number;
      length?: number;
      message?: string;
      replacements?: Array<{ value?: string }>;
    }>;
  };

  const matches = Array.isArray(data?.matches) ? data.matches : [];

  return matches
    .map((match) => {
      const offset = typeof match.offset === "number" ? match.offset : -1;
      const length = typeof match.length === "number" ? match.length : 0;
      const word =
        offset >= 0 && length > 0
          ? text.slice(offset, offset + length)
          : "";

      const suggestions = Array.isArray(match.replacements)
        ? match.replacements
            .map((item) => item?.value)
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .slice(0, 6)
        : [];

      return {
        word,
        offset,
        length,
        message: match.message || "Spelling suggestion",
        suggestions,
      };
    })
    .filter((item) => item.word.length > 0 && item.offset >= 0 && item.length > 0 && item.suggestions.length > 0);
};

router.post("/", async (req: any, res: any) => {
  try {
    const { text } = (req.body as { text?: string }) || {};
    
    if (!text || text.trim().length === 0) {
      return res.json({ suggestions: [] });
    }

    // Improved prompt - check EACH word individually
    const prompt = `You are a professional spelling checker. Check EACH WORD SEPARATELY for spelling errors AND capitalization.

CRITICAL RULES:
1. Check ONLY ONE WORD at a time - never group multiple words together
2. Return ONLY the EXACT misspelled word (not its neighbors)
3. The "offset" is the character position (0-based) where the misspelled word starts
4. The "length" is ONLY the length of the misspelled word (no spaces)
5. Check for BOTH spelling errors AND capitalization errors (e.g., "i" should be "I")
6. Do NOT flag: proper nouns, technical terms, code keywords, abbreviations, correctly spelled words
7. Do NOT flag grammar errors - ONLY spelling and capitalization
8. NEVER suggest the same word as a correction - if a word is correct, don't flag it!
9. Suggestions must be DIFFERENT from the original word (different spelling or capitalization)

Return ONLY valid JSON (no markdown, no explanations):
[
  {
    "word": "the single misspelled word",
    "offset": position where this word starts,
    "length": length of this word only,
    "message": "Spelling error" or "Capitalization error",
    "suggestions": ["correction1", "correction2", "correction3"]
  }
]

EXAMPLES:

Text: "i hate myself issue for not being"
CORRECT: [{"word":"i","offset":0,"length":1,"message":"Capitalization error","suggestions":["I"]}]  ✅ Lowercase "i" should be "I"
WRONG: [{"word":"hate","suggestions":["heat"]}]  ❌ "hate" is correctly spelled, don't flag it!

Text: "it was a short decripion"
WRONG: [{"word":"short decripion",...}]  ❌ Never group words!
CORRECT: [{"word":"decripion","offset":15,"length":9,"message":"Spelling error","suggestions":["description"]}]  ✅ Only the typo

Text: "The quik brown foxs"
CORRECT: [{"word":"quik","offset":4,"length":4,"message":"Spelling error","suggestions":["quick"]},{"word":"foxs","offset":15,"length":4,"message":"Spelling error","suggestions":["fox","foxes"]}]  ✅ Each word separately

Text: "The issue was clear"
WRONG: [{"word":"issue","suggestions":["issue"]}]  ❌ Never suggest the same word!
CORRECT: []  ✅ No errors if all words are correct

Return empty array [] if no errors.

Text to check:
"""
${text}
"""

JSON array:`;

    try {
      if (process.env.GEMINI_API_KEY) {
        const responseText = await generateWithGemini(prompt);
        const geminiSuggestions = parseGeminiSuggestions(responseText);
        return res.json({ suggestions: geminiSuggestions });
      }
    } catch (geminiError) {
      console.error("Gemini spellcheck failed, falling back to LanguageTool:", geminiError);
    }

    try {
      const fallbackSuggestions = await checkWithLanguageTool(text);
      return res.json({ suggestions: fallbackSuggestions });
    } catch (fallbackError) {
      console.error("LanguageTool fallback failed:", fallbackError);
      return res.json({ suggestions: [] });
    }

  } catch (error) {
    console.error("Spellcheck error:", error);
    return res.json({ suggestions: [] });
  }
});

export default router;
