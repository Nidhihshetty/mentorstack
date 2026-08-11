import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        const prompt = `You are a spelling checker. Analyze this text and find spelling errors. Return ONLY a JSON array of errors in this exact format:
[
  {
    "word": "misspelled word",
    "offset": character position where error starts,
    "length": length of the word,
    "message": "brief explanation",
    "suggestions": ["correction1", "correction2", "correction3"]
  }
]

If there are no errors, return an empty array [].

Text to check: "${text}"`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;

        // Extract JSON from response
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Spell check error:', error);
        return NextResponse.json({ suggestions: [] });
    }
}
