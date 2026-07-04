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
