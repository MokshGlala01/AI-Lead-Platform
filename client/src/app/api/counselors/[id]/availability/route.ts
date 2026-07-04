import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mapCounselorKeys } from '@/app/api/counselors/route';

// PATCH /api/counselors/[id]/availability - Toggle counselor availability
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { is_available } = body;

    let targetState = is_available;

    if (targetState === undefined) {
      // Fetch current state
      const { data: counselor, error: fetchError } = await supabaseAdmin
        .from('counselors')
        .select('is_available')
        .eq('id', id)
        .single();

      if (fetchError || !counselor) {
        console.error(`Error fetching counselor ${id} for toggling:`, fetchError);
        return NextResponse.json({ error: 'Counselor not found.' }, { status: 404 });
      }

      targetState = !counselor.is_available;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('counselors')
      .update({ is_available: targetState })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error(`Error toggling availability for counselor ${id}:`, updateError);
      return NextResponse.json({ error: 'Failed to toggle counselor availability.' }, { status: 500 });
    }

    return NextResponse.json(mapCounselorKeys(updated));
  } catch (err: any) {
    console.error('Error in PATCH /api/counselors/[id]/availability:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
