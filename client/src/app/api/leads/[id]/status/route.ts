import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mapLeadKeys } from '@/app/api/leads/route';
import { generateMessage } from '@/lib/ai';
import { sendEmail } from '@/lib/email';

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

    // Send email notifications for Qualified or Enrolled status changes
    if (updated.email && (status === 'Qualified' || status === 'Enrolled')) {
      try {
        const emailDraft = await generateMessage({
          name: updated.name,
          city: updated.city,
          courseInterest: updated.course_interest,
          qualification: updated.qualification
        }, 'email');

        let subject = status === 'Qualified' 
          ? 'Congratulations! You have been Qualified at CampusFlow' 
          : 'Welcome to CampusFlow! Your enrollment is confirmed';
        
        let bodyText = emailDraft;

        if (emailDraft.startsWith('Subject:')) {
          const lines = emailDraft.split('\n');
          subject = lines[0].replace('Subject:', '').trim();
          bodyText = lines.slice(1).join('\n').trim();
        } else {
          if (status === 'Qualified') {
            bodyText = `Dear ${updated.name},\n\nWe are thrilled to let you know that your application for ${updated.course_interest || 'our programs'} has been successfully qualified by CampusFlow AI!\n\nYour assigned coordinator ${updated.counselors?.name || 'our admissions team'} will contact you shortly to schedule an interview.\n\nWarm regards,\nCampusFlow Admissions Team`;
          } else {
            bodyText = `Dear ${updated.name},\n\nCongratulations! Your enrollment in ${updated.course_interest || 'our programs'} at CampusFlow is officially confirmed.\n\nWe are excited to have you join our next cohort. Your coordinator will send you orientation schedules and credentials shortly.\n\nWarm regards,\nCampusFlow Admissions Team`;
          }
        }

        await sendEmail({
          to: updated.email,
          subject,
          text: bodyText,
          html: bodyText.replace(/\n/g, '<br>')
        });
      } catch (emailErr: any) {
        console.error('Failed to send status update email notification:', emailErr.message || emailErr);
      }
    }

    return NextResponse.json(mapLeadKeys(updated));
  } catch (err: any) {
    console.error('Error in PATCH /api/leads/[id]/status:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
