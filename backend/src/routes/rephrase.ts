import express, { Router } from "express";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

const router: Router = express.Router();

function isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError !== undefined;
}

interface RephraseRequestBody {
    text: string;
}

interface GeminiApiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{
                text?: string;
            }>;
        };
    }>;
}

router.post("/", async (req: any, res: any) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }

    try {
        const prompt = `Please rephrase the following text in a clear and concise way, maintaining its original meaning: "${text}"
        and while responding just return the rephrased text.`;

        const response = await axios.post<GeminiApiResponse>(
            // Changed the model name to gemini-2.5-flash-lite
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const rephrasedText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No rephrased text available.";

        res.json({ rephrasedText });
    } catch (error: unknown) {
        if (isAxiosError(error)) {
            console.error("Error calling Gemini API:", error.response?.data || error.message);
            return res.status(500).json({ error: "Failed to rephrase text" });
        } else {
            console.error("An unexpected error occurred:", error);
            return res.status(500).json({ error: "An unexpected error occurred" });
        }
    }
});

export default router;
