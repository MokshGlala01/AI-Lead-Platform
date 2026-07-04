export interface AILead {
  name: string;
  city?: string | null;
  courseInterest?: string | null;
  qualification?: string | null;
}

export async function generateMessage(lead: AILead, channel: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const aiModel = process.env.AI_MODEL || 'openai/gpt-4o-mini';

  let prompt = '';
  if (channel === 'whatsapp') {
    prompt = `You are an admission counselor at EFOS Education.
Write a warm, personal WhatsApp message for a student.
Student Name: ${lead.name}
City: ${lead.city || 'your city'}
Interested in: ${lead.courseInterest || 'our programs'}
Qualification: ${lead.qualification || 'your education'}
EFOS offers: 100% placement assistance, industry mentors, practical projects, certifications.
Rules: Under 80 words. Friendly tone. 1-2 emojis max. End with one clear call-to-action.
Do not use generic language or placeholders. Make it feel like a real counselor wrote it.`;
  } else if (channel === 'email') {
    prompt = `You are an admission counselor at EFOS Education.
Write a professional email for EFOS admissions to the student.
Student Name: ${lead.name}
City: ${lead.city || 'your city'}
Interested in: ${lead.courseInterest || 'our programs'}
Qualification: ${lead.qualification || 'your education'}
EFOS offers: 100% placement assistance, industry mentors, practical projects, certifications.
Output format — first line: 'Subject: [subject line here]', then a blank line, then the email body.
Max 150 words. Warm but professional. Highlight 2 EFOS benefits relevant to their course.`;
  } else if (channel === 'sms') {
    prompt = `Write an SMS message. Max 50 words. Very concise.
Student Name: ${lead.name}
Interested in: ${lead.courseInterest || 'our programs'}
Start with the student's first name. End with: 'Reply YES to know more.'`;
  } else {
    throw new Error(`Unsupported message channel: ${channel}`);
  }

  const fallbacks: Record<string, string> = {
    whatsapp: `Hi ${lead.name}! I noticed you're interested in our ${lead.courseInterest || 'programs'} at EFOS. We offer 100% placement assistance, industry mentors, and hands-on projects to get you career-ready. When is a good time to connect for a quick 5-minute guidance call?`,
    email: `Subject: Career Opportunities in ${lead.courseInterest || 'Education'} with EFOS\n\nDear ${lead.name},\n\nThank you for your interest in EFOS Education. We noticed you are looking to enroll in our ${lead.courseInterest || 'advanced'} program.\n\nAt EFOS, we provide industry-recognized certifications and 100% placement assistance to set you up for success. We would love to discuss how we can help you achieve your career goals.\n\nReply to this email or let us know if you're available for a phone call this week.\n\nWarm regards,\nAdmissions Team\nEFOS Education`,
    sms: `Hi ${lead.name}, thanks for your interest in EFOS ${lead.courseInterest || 'courses'}. Get 100% placement assistance & hands-on training. Reply YES to know more.`
  };

  if (!apiKey || apiKey.includes('your-openrouter-key')) {
    console.warn(`No OpenRouter API key found. Returning fallback template for ${channel}.`);
    return fallbacks[channel];
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiModel,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API response status: ${response.status}`);
    }

    const data = await response.json();
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.warn('Unexpected OpenRouter response format. Using fallback template.');
      return fallbacks[channel];
    }
  } catch (error: any) {
    console.error(`OpenRouter API call failed for channel ${channel}:`, error.message);
    return fallbacks[channel];
  }
}
