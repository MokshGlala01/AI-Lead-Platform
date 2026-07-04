import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateMessage } from '@/lib/ai';

// POST /api/messages/generate - Trigger OpenRouter LLM copy generator and log draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, channel } = body;

    if (!lead_id || !channel) {
      return NextResponse.json({ error: 'lead_id and channel are required.' }, { status: 400 });
    }

    const validChannels = ['whatsapp', 'email', 'sms'];
    if (!validChannels.includes(channel.toLowerCase())) {
      return NextResponse.json({ error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` }, { status: 400 });
    }

    // 1. Fetch lead details
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();

    if (fetchError || !lead) {
      console.error(`Lead ${lead_id} not found for AI copywriting:`, fetchError);
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    // 2. Query AI copywriting generator helper
    const content = await generateMessage(
      {
        name: lead.name,
        city: lead.city,
        courseInterest: lead.course_interest,
        qualification: lead.qualification
      },
      channel.toLowerCase()
    );

    // 3. Create message draft record in public.messages
    const { data: message, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        lead_id: lead.id,
        channel: channel.toLowerCase(),
        content,
        status: 'Generated'
      })
      .select()
      .single();

    if (insertError || !message) {
      console.error('Failed to save generated message draft:', insertError);
      return NextResponse.json({ error: 'Failed to log message draft in database.' }, { status: 500 });
    }

    // 4. Log AI drafting activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: lead_id,
        activity_type: 'msg_sent',
        description: `AI message copy generated for ${channel.toUpperCase()}`
      });

    return NextResponse.json({
      message_id: message.id,
      content: message.content,
      channel: message.channel
    }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/messages/generate:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
