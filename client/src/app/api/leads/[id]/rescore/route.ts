import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';

// POST /api/leads/[id]/rescore - Force lead score recalculation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch lead details first
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !lead) {
      console.error(`Error fetching lead ${id} for rescoring:`, fetchError);
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    // Recalculate score & category
    const { score, category } = calculateScore({
      courseInterest: lead.course_interest,
      qualification: lead.qualification,
      age: lead.age,
      downloadedBrochure: lead.downloaded_brochure,
      websiteVisits: lead.website_visits
    });

    // Update lead record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('leads')
      .update({ score, category })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error(`Error updating score for lead ${id}:`, updateError);
      return NextResponse.json({ error: 'Failed to update score in database.' }, { status: 500 });
    }

    // Log notes recalculation activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: id,
        activity_type: 'status_change',
        description: `Lead score recalculated: score updated to ${score} (${category}).`
      });

    return NextResponse.json({ score: updated.score, category: updated.category });
  } catch (err: any) {
    console.error('Error in POST /api/leads/[id]/rescore:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
