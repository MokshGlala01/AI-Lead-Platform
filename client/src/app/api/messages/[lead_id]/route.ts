import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/messages/[lead_id] - Retrieve logs of messages sent to a student
export async function GET(req: NextRequest, { params }: { params: Promise<{ lead_id: string }> }) {
  try {
    const { lead_id } = await params;

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('lead_id', lead_id)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error(`Error querying messages for lead ${lead_id}:`, error);
      return NextResponse.json({ error: 'Failed to retrieve messages history.' }, { status: 500 });
    }

    const mapped = (messages || []).map((msg: any) => ({
      ...msg,
      leadId: msg.lead_id,
      counselorId: msg.counselor_id,
      sentAt: msg.sent_at
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error('Error in GET /api/messages/[lead_id]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
