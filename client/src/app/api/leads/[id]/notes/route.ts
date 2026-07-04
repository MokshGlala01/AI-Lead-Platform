import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mapLeadKeys } from '@/app/api/leads/route';

// PATCH /api/leads/[id]/notes - Update student profile notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { notes } = body;

    const { data: updated, error } = await supabaseAdmin
      .from('leads')
      .update({ notes })
      .eq('id', id)
      .select('*, counselors(*)')
      .single();

    if (error || !updated) {
      console.error(`Error updating notes for lead ${id}:`, error);
      return NextResponse.json({ error: 'Failed to update notes.' }, { status: 500 });
    }

    // Log notes addition activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: id,
        activity_type: 'note_added',
        description: `Notes updated.`
      });

    return NextResponse.json(mapLeadKeys(updated));
  } catch (err: any) {
    console.error('Error in PATCH /api/leads/[id]/notes:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
