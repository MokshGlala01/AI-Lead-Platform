import { supabaseAdmin } from './supabase';

export async function assignCounselor(leadId: string): Promise<any | null> {
  try {
    // 1. Query counselors for is_available = true, ordered by total_assigned ASC
    const { data: counselors, error: fetchError } = await supabaseAdmin
      .from('counselors')
      .select('*')
      .eq('is_available', true)
      .order('total_assigned', { ascending: true })
      .limit(1);

    if (fetchError || !counselors || counselors.length === 0) {
      console.warn(`No available counselors to assign to lead ${leadId}.`, fetchError);
      return null;
    }

    const counselor = counselors[0];

    // 2. Link counselor to the lead and set status = 'Qualified'
    const { error: updateLeadError } = await supabaseAdmin
      .from('leads')
      .update({
        counselor_id: counselor.id,
        status: 'Qualified'
      })
      .eq('id', leadId);

    if (updateLeadError) {
      console.error(`Failed to assign counselor to lead ${leadId}:`, updateLeadError);
      return null;
    }

    // 3. Increment counselor's total_assigned tally by 1
    const { data: updatedCounselor, error: updateCounselorError } = await supabaseAdmin
      .from('counselors')
      .update({
        total_assigned: counselor.total_assigned + 1
      })
      .eq('id', counselor.id)
      .select()
      .single();

    if (updateCounselorError) {
      console.error(`Failed to update counselor workload stats:`, updateCounselorError);
    }

    // 4. Log counselor assignment activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: leadId,
        activity_type: 'counselor_assigned',
        description: `Automated round-robin counselor assignment: lead assigned to ${counselor.name}`
      });

    return updatedCounselor || counselor;
  } catch (error) {
    console.error('Error in assignCounselor service:', error);
    return null;
  }
}
