import { NextResponse } from 'next/server';

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

// Local Expert System fallback in case of API failures/timeouts
const getLocalResponse = (message: string): string => {
  const query = message.toLowerCase().trim();
  
  if (query.includes('fee') || query.includes('cost') || query.includes('charge') || query.includes('price')) {
    return `Here are the tuition fees at **CampusFlow**:\n\n` +
      `- **BTech** (Computer Science/IT): **$3,000 / year**\n` +
      `- **MBA** (Finance/Marketing/HR): **$4,005 / year**\n` +
      `- **BCA / BBA**: **$2,000 / year**\n` +
      `- **MCA**: **$2,500 / year**\n\n` +
      `We also offer up to **50% merit-based scholarships** on tuition!`;
  }
  
  if (query.includes('scholarship') || query.includes('discount') || query.includes('merit')) {
    return `**CampusFlow Merit Scholarships**:\n\n` +
      `We provide up to **50% discount on tuition fees** for students who score **90 or above** in their automated AI qualification evaluation. ` +
      `Check your Student Dashboard to view your score!`;
  }
  
  if (query.includes('course') || query.includes('program') || query.includes('major') || query.includes('study')) {
    return `We offer high-placement professional degrees:\n\n` +
      `- **BTech** (CS, IT, Electronics)\n` +
      `- **MBA** (Finance, Marketing, HR)\n` +
      `- **BCA / BBA**\n` +
      `- **MCA**\n\n` +
      `All courses feature 100% placement assistance and 1-on-1 industry mentoring.`;
  }
  
  if (query.includes('placement') || query.includes('job') || query.includes('recruit') || query.includes('salary')) {
    return `**Placement & Careers**:\n\n` +
      `We provide **100% placement assistance** with top-tier technology and business corporations. ` +
      `Our curriculum is project-centric, meaning you construct a portfolio of real applications under the guidance of active industry mentors.`;
  }

  if (query.includes('eligibility') || query.includes('eligible') || query.includes('require')) {
    return `**Eligibility Criteria**:\n\n` +
      `- **BTech**: 12th completed with Science/Mathematics.\n` +
      `- **MBA**: Graduation in any stream.\n` +
      `- **BCA / BBA**: 12th completed in any stream.\n` +
      `- **MCA**: BCA or BSc Graduation.`;
  }

  return `Thanks for asking! I'm here to help you with CampusFlow admissions. ` +
    `You can ask me about our **courses**, **tuition fees**, **merit scholarships**, or **placement assistance**!`;
};

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const lastMessageText = messages[messages.length - 1]?.text || '';

    // Tier 1: Try OpenRouter (reliable production API key in .env)
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const aiModel = process.env.AI_MODEL || 'openai/gpt-4o-mini';
    
    if (openRouterKey && !openRouterKey.includes('your-openrouter-key')) {
      try {
        const formattedHistory = messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: aiModel,
            max_tokens: 250,
            messages: [
              { role: 'system', content: systemInstruction },
              ...formattedHistory
            ]
          }),
          signal: AbortSignal.timeout(6000) // 6 second timeout
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply: reply.trim() });
          }
        }
      } catch (err: any) {
        console.warn('OpenRouter Chat call failed, attempting Gemini:', err.message || err);
      }
    }

    // Tier 2: Try Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiContents = messages.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: { maxOutputTokens: 250, temperature: 0.6 }
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply: reply.trim() });
          }
        }
      } catch (err: any) {
        console.warn('Gemini Chat call failed, attempting local fallback:', err.message || err);
      }
    }

    // Tier 3: Local Expert System Fallback (Guaranteed to return in 0ms, no API key required)
    console.info('Using local expert system response for chatbot.');
    const reply = getLocalResponse(lastMessageText);
    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error('Chat API Error:', err);
    // Even in global catch, return local fallback instead of breaking UI
    const lastMsg = messages?.[messages.length - 1]?.text || '';
    return NextResponse.json({ reply: getLocalResponse(lastMsg) });
  }
}
