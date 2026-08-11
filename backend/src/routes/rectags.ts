import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i", "if", "in", "is", "it",
    "my", "of", "on", "or", "that", "the", "this", "to", "was", "we", "what", "when", "where", "which", "with", "you",
    "your", "dont", "doesnt", "cant", "wont", "any", "fix", "issue", "error", "option", "work", "works", "failed"
]);

const sanitizeTags = (tags: string[]): string[] => {
    const seen = new Set<string>();
    const cleaned: string[] = [];

    for (const rawTag of tags) {
        const tag = (rawTag || "")
            .toLowerCase()
            .trim()
            .replace(/^#+/, "")
            .replace(/[^a-z0-9+#-\s]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        if (!tag || tag.length < 2 || tag.length > 30 || seen.has(tag)) {
            continue;
        }

        seen.add(tag);
        cleaned.push(tag);

        if (cleaned.length >= 5) {
            break;
        }
    }

    return cleaned;
};

const extractFallbackTags = (question: string, content: string): string[] => {
    const text = `${question || ""} ${content || ""}`.toLowerCase();
    const words = text.match(/[a-z][a-z0-9+#-]{1,24}/g) || [];
    const frequency = new Map<string, number>();

    for (const word of words) {
        const normalized = word.replace(/^-+|-+$/g, "");
        if (!normalized || normalized.length < 3 || STOP_WORDS.has(normalized)) {
            continue;
        }

        frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
    }

    const ranked = [...frequency.entries()]
        .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].localeCompare(b[0]);
        })
        .map(([word]) => word);

    return sanitizeTags(ranked);
};

const parseModelTags = (raw: string): string[] => {
    const trimmed = (raw || "").trim();

    try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return sanitizeTags(parsed.filter((tag) => typeof tag === "string"));
        }
    } catch {
        // Continue to fallback parsing below.
    }

    const jsonMatch = /\[[\s\S]*\]/.exec(trimmed);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                return sanitizeTags(parsed.filter((tag) => typeof tag === "string"));
            }
        } catch {
            // Ignore and use text fallback.
        }
    }

    const fromText = trimmed
        .replace(/```[a-z]*|```/gi, "")
        .replace(/[\[\]"]/g, "")
        .split(/[\n,]/g)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

    return sanitizeTags(fromText);
};

router.post("/", async (req: any, res: any) => {
    try {
        const { question, content } = req.body;

        if (!question && !content) {
            return res.status(400).json({ error: "Question or content is required" });
        }

        const questionText = typeof question === "string" ? question : "";
        const contentText = typeof content === "string" ? content : "";

        const prompt = `
    Based on the following question and content, recommend 5 relevant and valid tags.
    Return only a JSON array of lowercase tag strings.
    Do not include markdown.

    Question: ${questionText}
    Content: ${contentText}
    `;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            const fallbackTags = extractFallbackTags(questionText, contentText);
            return res.json({ tags: fallbackTags });
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const tags = parseModelTags(text);
            if (tags.length > 0) {
                return res.json({ tags });
            }
        } catch (modelError) {
            console.error("Tag generation with Gemini failed, using fallback:", modelError);
        }

        const fallbackTags = extractFallbackTags(questionText, contentText);
        return res.json({ tags: fallbackTags });

    } catch (err) {
        console.error("Error generating tags:", err);
        return res.json({ tags: [] });
    }
});

export default router;
