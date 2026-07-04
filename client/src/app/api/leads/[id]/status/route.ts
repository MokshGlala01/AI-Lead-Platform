import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mapLeadKeys } from '@/app/api/leads/route';

// PATCH /api/leads/[id]/status - Update student funnel status stage
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['New', 'Contacted', 'Interested', 'Follow-Up', 'Qualified', 'Enrolled', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select('*, counselors(*)')
      .single();

    if (error || !updated) {
      console.error(`Error updating status for lead ${id}:`, error);
      return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 });
    }

    // Log status transition activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: id,
        activity_type: 'status_change',
        description: `Funnel status changed to ${status}.`
      });

    return NextResponse.json(mapLeadKeys(updated));
  } catch (err: any) {
    console.error('Error in PATCH /api/leads/[id]/status:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
