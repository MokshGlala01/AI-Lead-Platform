import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/analytics/daily - Get daily sign-ups count for the last 30 days
export async function GET(req: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error || !leads) {
      console.error('Error fetching daily analytics data:', error);
      return NextResponse.json({ error: 'Failed to retrieve daily stats.' }, { status: 500 });
    }

    // Map counts by YYYY-MM-DD
    const dailyCounts: Record<string, number> = {};
    leads.forEach((lead: any) => {
      const dateStr = new Date(lead.created_at).toISOString().split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    // Generate output structure filling in dates with 0 count
    const result = [];
    const tempDate = new Date(thirtyDaysAgo);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    while (tempDate <= today) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const parts = tempDate.toDateString().split(' ');
      const label = `${parts[2]} ${parts[1]}`;

      result.push({
        date: dateStr,
        label,
        count: dailyCounts[dateStr] || 0
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in GET /api/analytics/daily:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
