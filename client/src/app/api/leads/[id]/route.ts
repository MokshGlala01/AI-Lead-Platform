import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mapLeadKeys } from '@/app/api/leads/route';

// GET /api/leads/[id] - Fetch single student profile detail panel
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch lead details and messages list in parallel
    const [leadQuery, messagesQuery] = await Promise.all([
      supabaseAdmin
        .from('leads')
        .select('*, counselors(*)')
        .eq('id', id)
        .single(),
      supabaseAdmin
        .from('messages')
        .select('*')
        .eq('lead_id', id)
        .order('sent_at', { ascending: false })
    ]);

    if (leadQuery.error || !leadQuery.data) {
      console.error(`Error querying lead ${id}:`, leadQuery.error);
      return NextResponse.json({ error: 'Lead profile not found.' }, { status: 404 });
    }

    const mappedLead = mapLeadKeys(leadQuery.data);
    const messages = (messagesQuery.data || []).map((msg: any) => ({
      ...msg,
      leadId: msg.lead_id,
      counselorId: msg.counselor_id,
      sentAt: msg.sent_at
    }));

    return NextResponse.json({
      ...mappedLead,
      messages
    });
  } catch (err: any) {
    console.error('Error in GET /api/leads/[id]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/leads/[id] - Remove student lead (Optional for Admin users only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting lead ${id}:`, error);
      return NextResponse.json({ error: 'Failed to delete student lead.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student lead deleted successfully.' });
  } catch (err: any) {
    console.error('Error in DELETE /api/leads/[id]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

