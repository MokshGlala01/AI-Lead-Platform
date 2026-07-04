import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/analytics/summary - Get aggregated dashboard metrics
export async function GET(req: NextRequest) {
  try {
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('category, status, source, course_interest')
      .limit(5000);

    if (error || !leads) {
      console.error('Error querying analytics data:', error);
      return NextResponse.json({ error: 'Failed to retrieve analytics data.' }, { status: 500 });
    }

    const total = leads.length;
    let hot = 0;
    let warm = 0;
    let cold = 0;
    let qualified = 0;
    let enrolled = 0;

    const sourceBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    const courseBreakdown: Record<string, number> = {};

    leads.forEach((lead: any) => {
      // Category counts
      const cat = lead.category;
      if (cat === 'Hot') hot++;
      else if (cat === 'Warm') warm++;
      else if (cat === 'Cold') cold++;

      // Status counts
      const status = lead.status;
      if (status === 'Qualified') qualified++;
      else if (status === 'Enrolled') enrolled++;

      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

      // Source breakdown
      const src = lead.source || 'Website';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;

      // Course breakdown
      const course = lead.course_interest || 'Unspecified';
      courseBreakdown[course] = (courseBreakdown[course] || 0) + 1;
    });

    const conversionRate = total > 0 ? ((enrolled / total) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      total,
      hot,
      warm,
      cold,
      qualified,
      enrolled,
      conversionRate,
      sourceBreakdown,
      statusBreakdown,
      courseBreakdown
    });
  } catch (err: any) {
    console.error('Error in GET /api/analytics/summary:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
