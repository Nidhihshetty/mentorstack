import { Router } from "express";
import { genAI } from "../lib/gemini";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { answers } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const prompt = `Summarize these answers into concise explanation[100-150 words] highlighting key insights:\n\n${answers.join(
      "\n\n"
    )}
    and i just need the concise summary each explanation should be displayed one by one`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to summarize" });
  }
});

export default router;
