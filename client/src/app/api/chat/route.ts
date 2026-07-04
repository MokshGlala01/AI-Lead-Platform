import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured.' }, { status: 500 });
    }

    // Format chat history for Gemini API
    // Gemini expects an array of: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const geminiContents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `You are CampusFlow AI, the official virtual admissions assistant for CampusFlow Education.
CampusFlow is a next-generation AI-powered student counseling and enrollment platform.

We offer the following undergraduate and postgraduate courses:
- BTech (Computer Science, IT, Electronics) - Tuition: $3,000/year. Eligibility: 12th completed with Science/Math.
- MBA (Finance, Marketing, HR) - Tuition: $4,000/year. Eligibility: Graduate in any stream.
- BCA / BBA (Bachelors in Computer Applications / Business Administration) - Tuition: $2,000/year. Eligibility: 12th completed in any stream.
- MCA (Masters in Computer Applications) - Tuition: $2,500/year. Eligibility: BCA/BSc Graduate.

Key CampusFlow Platform Benefits:
1. 100% Placement Assistance with leading tech and business corporations.
2. Mentorship directly from active industry experts.
3. Practical, project-centric curriculum (hands-on portfolio projects).
4. Merit-based Scholarships: Up to 50% discount on tuition fees for applicants scoring 90+ on their automated AI qualification evaluation.

Rules for your answers:
- Keep answers encouraging, professional, and under 120 words.
- Use formatting (bullet points, bold text) for readability.
- If asked about a student's specific score, ask them to check their Student Dashboard.
- Never make up information. If you don't know the answer, politely ask them to connect with their assigned CampusFlow coordinator.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API call failed:', errorText);
      return NextResponse.json({ error: 'Failed to generate response from Gemini API.' }, { status: 502 });
    }

    const resData = await response.json();
    const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that query. Please try again.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
