import { Router } from "express";
import { prisma } from "../lib/prisma";
import { generateWithGemini } from "../lib/gemini";

const router = Router();

// Find similar questions using AI semantic matching
router.post("/", async (req: any, res: any) => {
  try {
    const { questionText } = (req.body as { questionText?: string }) || {};
    
    if (!questionText || questionText.trim().length < 10) {
      return res.json({ similarQuestions: [] });
    }

    // Get all recent questions from database (last 500)
    const recentQuestions = await prisma.question.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          }
        },
        answers: {
          select: {
            id: true
          }
        }
      }
    });

    if (recentQuestions.length === 0) {
      return res.json({ similarQuestions: [] });
    }

    // Use AI to find semantically similar questions
    const questionsForAI = recentQuestions.map((q, idx) => ({
      idx,
      id: q.id,
      title: q.title,
      preview: q.body.substring(0, 200)
    }));

    const prompt = `You are a duplicate question detector. Your job is to find questions that are asking about THE SAME THING, even if worded differently.

User's Question:
"""
${questionText}
"""

Existing Questions:
${questionsForAI.map(q => `[${q.idx}] ${q.title}\n${q.preview}...`).join('\n\n')}

CRITICAL RULES FOR MATCHING:
1. Focus on the CORE TOPIC and INTENT, not exact wording
2. "implement", "integrate", "add", "use", "setup" = ALL MEAN THE SAME THING
3. "React" question matches other "React" questions regardless of verbs used
4. "authentication", "auth", "login", "sign in" = SAME TOPIC
5. Match questions about the same technology/concept even with different phrasing
6. Be GENEROUS with matching - it's better to show too many than miss obvious duplicates

Examples of what SHOULD match:
- "How to implement React?" ↔ "How to integrate React in my project?" ✅ SAME TOPIC
- "JWT authentication tutorial" ↔ "How to setup JWT auth?" ✅ SAME TOPIC
- "Connect React to backend" ↔ "Integrate frontend with Express" ✅ SAME TOPIC

Return ONLY a JSON array of idx values of similar questions (top 5 max), ordered by relevance.
Return empty array [] ONLY if the topics are completely unrelated.

JSON array of idx values:`;

    try {
      const responseText = await generateWithGemini(prompt);
      
      // Extract JSON array
      const cleanedResponse = responseText.trim()
        .split(/```json\s*/g).join('')
        .split(/```\s*/g).join('');
      
      const jsonMatch = /\[[\s\S]*?\]/.exec(cleanedResponse);
      
      if (!jsonMatch) {
        console.log("No similar questions found by AI");
        return res.json({ similarQuestions: [] });
      }

      const similarIndices = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(similarIndices)) {
        return res.json({ similarQuestions: [] });
      }

      // Map indices back to actual questions
      const similarQuestions = similarIndices
        .filter(idx => typeof idx === 'number' && idx >= 0 && idx < questionsForAI.length)
        .slice(0, 5) // Max 5 suggestions
        .map(idx => {
          const q = recentQuestions[idx];
          return {
            id: q.id,
            title: q.title,
            body: q.body.substring(0, 200) + (q.body.length > 200 ? '...' : ''),
            authorName: q.author.name,
            answerCount: q.answers.length,
            createdAt: q.createdAt
          };
        });

      return res.json({ similarQuestions });

    } catch (aiError: any) {
      // Fallback to simple keyword matching if AI fails
      console.warn('AI similar questions failed, using keyword fallback:', aiError.message);
      
      const keywords = questionText.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 10);
      
      const keywordMatches = recentQuestions
        .map(q => {
          const titleLower = q.title.toLowerCase();
          const bodyLower = q.body.toLowerCase();
          const matchCount = keywords.filter(kw => 
            titleLower.includes(kw) || bodyLower.includes(kw)
          ).length;
          return { question: q, matchCount };
        })
        .filter(m => m.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 5)
        .map(m => ({
          id: m.question.id,
          title: m.question.title,
          body: m.question.body.substring(0, 200) + (m.question.body.length > 200 ? '...' : ''),
          authorName: m.question.author.name,
          answerCount: m.question.answers.length,
          createdAt: m.question.createdAt
        }));

      return res.json({ similarQuestions: keywordMatches, fallback: true });
    }

  } catch (error) {
    console.error("Similar questions error:", error);
    return res.status(500).json({ 
      similarQuestions: [],
      error: "Similar questions service temporarily unavailable" 
    });
  }
});

export default router;
