import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/counselors/[id]/assign/[leadId] - Manually assign a lead to a counselor
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; leadId: string }> }) {
  try {
    const { id: counselorId, leadId } = await params;

    // 1. Verify counselor existence
    const { data: counselor, error: counselorError } = await supabaseAdmin
      .from('counselors')
      .select('*')
      .eq('id', counselorId)
      .single();

    if (counselorError || !counselor) {
      console.error(`Counselor ${counselorId} not found:`, counselorError);
      return NextResponse.json({ error: 'Counselor not found.' }, { status: 404 });
    }

    // 2. Verify lead existence
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error(`Lead ${leadId} not found:`, leadError);
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const prevCounselorId = lead.counselor_id;

    // 3. Perform workload counter adjustments sequentially
    if (prevCounselorId && prevCounselorId !== counselorId) {
      // Decrement workload of former counselor
      const { data: formerCounselor } = await supabaseAdmin
        .from('counselors')
        .select('total_assigned')
        .eq('id', prevCounselorId)
        .single();

      if (formerCounselor) {
        await supabaseAdmin
          .from('counselors')
          .update({ total_assigned: Math.max(0, formerCounselor.total_assigned - 1) })
          .eq('id', prevCounselorId);
      }
    }

    // 4. Update the lead's counselor link and status to Qualified
    const { error: updateLeadError } = await supabaseAdmin
      .from('leads')
      .update({
        counselor_id: counselorId,
        status: 'Qualified'
      })
      .eq('id', leadId);

    if (updateLeadError) {
      console.error('Failed to link lead to new counselor:', updateLeadError);
      return NextResponse.json({ error: 'Failed to update lead coordinator link.' }, { status: 500 });
    }

    // 5. Increment workload of new counselor
    if (prevCounselorId !== counselorId) {
      await supabaseAdmin
        .from('counselors')
        .update({ total_assigned: counselor.total_assigned + 1 })
        .eq('id', counselorId);
    }

    // 6. Log assignment activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: leadId,
        activity_type: 'counselor_assigned',
        description: `Lead manually assigned to counselor: ${counselor.name}`
      });

    return NextResponse.json({ message: 'Counselor assigned successfully.', counselor_id: counselorId });
  } catch (err: any) {
    console.error('Error in POST /api/counselors/[id]/assign/[leadId]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
