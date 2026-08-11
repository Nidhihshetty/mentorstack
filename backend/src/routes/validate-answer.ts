import { Router, Request, Response } from "express";
import { genAI } from "../lib/gemini";
import { prisma } from "../lib/prisma";

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/validate-answer
// Body: { question: string, answer: string, answerId: number }
router.post("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, answerId } = req.body;
    const user = (req as any).user;

    if (!question || !answer || !answerId) {
      res.status(400).json({ error: "Question, answer, and answerId are required" });
      return;
    }

    // Verify that the user is the question author
    const answerRecord = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: {
            authorId: true,
            title: true
          }
        }
      }
    });

    if (!answerRecord) {
      res.status(404).json({ error: "Answer not found" });
      return;
    }

    // Check if user is the question author
    if (answerRecord.question.authorId !== user.userId) {
      res.status(403).json({ 
        error: "Only the question author can validate answers",
        message: "You must be the person who asked this question to validate answers"
      });
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a STRICT answer quality evaluator for a mentorship platform. BE CRITICAL and DEMANDING - only truly excellent answers deserve high scores.

QUESTION:
"""
${question}
"""

ANSWER:
"""
${answer}
"""

SCORING CRITERIA (BE STRICT):

**RELEVANCE SCORE 0-10:**
- 0-2: Completely off-topic, irrelevant, or spam
- 3-4: Vaguely related but doesn't answer the question. Generic advice with no specifics.
- 5-6: Partially answers but lacks depth, examples, or actionable steps. Too brief or superficial.
- 7-8: Good answer with specific details, code examples, or clear steps. Actually helps solve the problem.
- 9-10: EXCELLENT - comprehensive, detailed, with working code examples, explanations, best practices, and edge cases covered.

**VERDICT CRITERIA:**
- "off_topic": Wrong topic entirely (e.g., MongoDB answer for PostgreSQL question)
- "needs_improvement": Generic advice, too short (<50 words), no examples, vague suggestions like "just google it" or "start with small projects"
- "good": Has specifics, code snippets, or clear actionable steps. Actually answers the question.
- "excellent": Comprehensive, multiple examples, best practices, error handling, deployment tips, real-world context.

**CRITICAL RULES:**
1. Generic advice like "start small", "practice more", "use Google" = MAX 3/10
2. Answers under 50 words = MAX 4/10 unless it's a simple yes/no question
3. No code examples for programming questions = MAX 5/10
4. Vague suggestions without specifics = MAX 4/10
5. Copy-paste generic motivational text = 1-2/10

Return ONLY valid JSON (no markdown):
{
  "addresses_question": "yes" | "partial" | "no",
  "relevance_score": 0-10,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "missing_elements": ["missing 1", "missing 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "verdict": "excellent" | "good" | "needs_improvement" | "off_topic",
  "summary": "One sentence summary of the evaluation"
}

EXAMPLES:

Question: "How do I connect Node.js to PostgreSQL?"
Answer: "You can use the pg library. Install with npm install pg. Then: const { Pool } = require('pg'); const pool = new Pool({host:'localhost', database:'mydb'}); pool.query('SELECT * FROM users', (err, res) => {...});"
Response: {"addresses_question":"yes","relevance_score":8,"strengths":["Provides library name","Shows installation command","Includes working code example","Covers connection and query"],"weaknesses":["No error handling shown","Missing pool configuration details"],"missing_elements":["Error handling","Connection string format","Pool vs Client explanation"],"suggestions":["Add try-catch or error callbacks","Explain pool configuration options","Show how to handle connection errors"],"verdict":"good","summary":"Solid answer with working code, but lacks error handling and configuration details"}

Question: "How do I deploy a Node.js app to Heroku?"
Answer: "Just use Heroku CLI and follow their documentation."
Response: {"addresses_question":"no","relevance_score":2,"strengths":[],"weaknesses":["No actual steps provided","Just says 'read docs' - not helpful","Too lazy and dismissive","Only 8 words long"],"missing_elements":["Heroku CLI installation steps","Actual deployment commands","Procfile configuration","Environment variables setup","Database setup"],"suggestions":["Provide step-by-step CLI commands","Explain Procfile and package.json requirements","Show how to set environment variables","Include troubleshooting tips"],"verdict":"needs_improvement","summary":"Essentially tells user to 'Google it' - provides zero value"}

Question: "How do I connect Node.js to PostgreSQL?"
Answer: "I love using MongoDB for my projects!"
Response: {"addresses_question":"no","relevance_score":0,"strengths":[],"weaknesses":["Completely off-topic","Talks about MongoDB not PostgreSQL","Doesn't answer the question at all"],"missing_elements":["PostgreSQL connection info","Node.js code","Library recommendations"],"suggestions":["Focus on PostgreSQL as asked","Provide actual connection code","Explain the pg library"],"verdict":"off_topic","summary":"Completely irrelevant - discusses wrong database technology"}

BE STRICT. BE CRITICAL. Only reward truly helpful, detailed answers.

Return ONLY the JSON object.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Extract JSON from potential markdown code blocks
    let jsonText = responseText;
    if (responseText.includes("```")) {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }

    // Parse the JSON response
    const validation = JSON.parse(jsonText);

    // Validate the response structure
    if (
      !validation.addresses_question ||
      typeof validation.relevance_score !== "number" ||
      !validation.verdict
    ) {
      throw new Error("Invalid response structure from AI");
    }

    res.json(validation);
  } catch (error) {
    console.error("Answer validation error:", error);
    res.status(500).json({ 
      error: "Failed to validate answer",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
