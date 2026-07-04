export interface LeadData {
  courseInterest?: string | null;
  qualification?: string | null;
  age?: number | string | null;
  downloadedBrochure?: boolean | string | null;
  websiteVisits?: number | string | null;
}

export function calculateScore(lead: LeadData): { score: number; category: string } {
  let interestScore = 0;
  let educationScore = 0;
  let ageScore = 0;
  let engagementScore = 0;

  // 1. INTEREST SCORE (max 20)
  const course = (lead.courseInterest || '').toLowerCase().trim();
  if (['btech', 'mba', 'bca', 'mca'].includes(course)) {
    interestScore = 20;
  } else if (['diploma', 'bba'].includes(course)) {
    interestScore = 10;
  }

  // 2. EDUCATION SCORE (max 20)
  const qual = (lead.qualification || '').toLowerCase();
  if (qual.includes('12th')) {
    educationScore = 20;
  } else if (qual.includes('graduate')) {
    educationScore = 15;
  } else if (qual.includes('10th')) {
    educationScore = 5;
  }

  // 3. AGE SCORE (max 25)
  const age = Number(lead.age);
  if (!isNaN(age) && lead.age !== null && lead.age !== undefined) {
    if (age >= 16 && age <= 18) {
      ageScore = 25;
    } else if (age >= 19 && age <= 22) {
      ageScore = 15;
    } else if (age >= 23 && age <= 26) {
      ageScore = 5;
    }
  }

  // 4. ENGAGEMENT SCORE (max 35)
  if (lead.downloadedBrochure === true || lead.downloadedBrochure === 'true') {
    engagementScore += 15;
  }
  const visits = Number(lead.websiteVisits);
  if (!isNaN(visits) && visits > 3) {
    engagementScore += 20;
  }

  const rawScore = interestScore + educationScore + ageScore + engagementScore;
  const score = Math.min(100, rawScore);

  let category = 'Cold';
  if (score >= 71) {
    category = 'Hot';
  } else if (score >= 41) {
    category = 'Warm';
  }

  return { score, category };
}

export async function aiScoreLead(lead: any): Promise<{ score: number; category: string; recommendation: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback to static scoring if key is missing
    const { score, category } = calculateScore({
      courseInterest: lead.course_interest || lead.courseInterest,
      qualification: lead.qualification,
      age: lead.age,
      downloadedBrochure: lead.downloaded_brochure || lead.downloadedBrochure,
      websiteVisits: lead.website_visits || lead.websiteVisits
    });
    return {
      score,
      category,
      recommendation: "High quality applicant. Standard coordinator follow-up advised."
    };
  }

  try {
    const courseInterest = lead.course_interest || lead.courseInterest || 'Unspecified';
    const qualification = lead.qualification || 'Unspecified';
    const age = lead.age || 'Unspecified';
    const city = lead.city || 'Unspecified';
    const notes = lead.notes || 'None';

    const systemPrompt = `You are an AI admissions analyzer for CampusFlow. Evaluate the student lead based on these details:
- Name: ${lead.name || 'Student'}
- Course Interest: ${courseInterest}
- Qualification: ${qualification}
- Age: ${age}
- City: ${city}
- Notes: ${notes}

Evaluate criteria:
- Score: Integer from 0 to 100 based on eligibility and interest. Rate applicants interested in core streams (BTech, MBA, BCA, MCA) higher (70-100), and non-standard/unspecified lower.
- Category: "Hot" (score >= 71), "Warm" (score 41-70), or "Cold" (score <= 40).
- Recommendation: Write a highly personalized 1-sentence analysis recommendation for the coordinator. Keep it under 20 words. Example: "High scoring graduate. Excellent profile fit for MBA Finance."

Return ONLY valid JSON. No markdown backticks. Example output format:
{"score": 85, "category": "Hot", "recommendation": "High academic background, good fit for MBA."}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.2
        }
      })
    });

    if (!response.ok) throw new Error('Gemini API call failed');

    const resData = await response.json();
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      score: Number(parsed.score) || 50,
      category: parsed.category || 'Warm',
      recommendation: parsed.recommendation || 'Standard lead follow-up.'
    };
  } catch (error) {
    console.error('AI lead scoring failed, using heuristic fallback:', error);
    const { score, category } = calculateScore({
      courseInterest: lead.course_interest || lead.courseInterest,
      qualification: lead.qualification,
      age: lead.age,
      downloadedBrochure: lead.downloaded_brochure || lead.downloadedBrochure,
      websiteVisits: lead.website_visits || lead.websiteVisits
    });
    return {
      score,
      category,
      recommendation: "Evaluation compiled via heuristic rules. Recommended course advising."
    };
  }
}
