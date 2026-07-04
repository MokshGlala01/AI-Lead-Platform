import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateScore } from '@/lib/scoring';
import { assignCounselor } from '@/lib/assignment';

export function mapLeadKeys(lead: any) {
  if (!lead) return null;
  const mapped = {
    ...lead,
    courseInterest: lead.course_interest,
    downloadedBrochure: lead.downloaded_brochure,
    websiteVisits: lead.website_visits,
    counselorId: lead.counselor_id,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  };
  if (lead.counselors) {
    mapped.counselor = {
      ...lead.counselors,
      isAvailable: lead.counselors.is_available,
      totalAssigned: lead.counselors.total_assigned,
      createdAt: lead.counselors.created_at
    };
  }
  return mapped;
}

// GET /api/leads - Query leads list with search and filters
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      return NextResponse.json({ error: 'Database configuration missing. Please update client/.env with your actual Supabase credentials.' }, { status: 500 });
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const courseInterest = searchParams.get('course_interest') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '20') || 20;

    const skip = (page - 1) * limit;

    // Map frontend camelCase sorts to database snake_case
    let dbSortField = 'created_at';
    if (sort === 'createdAt') dbSortField = 'created_at';
    else if (sort === 'score') dbSortField = 'score';
    else if (sort === 'name') dbSortField = 'name';

    // Start building query
    let query = supabaseAdmin
      .from('leads')
      .select('*, counselors(*)', { count: 'exact' });

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }
    // Apply source filter
    if (source) {
      query = query.eq('source', source);
    }
    // Apply course interest filter
    if (courseInterest) {
      query = query.eq('course_interest', courseInterest);
    }
    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply search filter (name, email, or phone)
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    // Apply sort, pagination
    const { data: dbLeads, count, error } = await query
      .order(dbSortField, { ascending: order === 'asc' })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Supabase query error in GET /api/leads:', error);
      return NextResponse.json({ error: 'Failed to retrieve leads from database.' }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const mappedLeads = (dbLeads || []).map(mapLeadKeys);

    return NextResponse.json({
      leads: mappedLeads,
      total,
      page,
      totalPages
    });
  } catch (err: any) {
    console.error('Error in GET /api/leads:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/leads - Create/register a new student lead
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      return NextResponse.json({ error: 'Database configuration missing. Please update client/.env with your actual Supabase credentials.' }, { status: 500 });
    }
    const body = await req.json();
    const {
      name,
      email,
      phone,
      city,
      qualification,
      source = 'Website',
      course_interest,
      age,
      downloaded_brochure,
      website_visits,
      notes
    } = body;

    // Validate request inputs (10-digit clean phone and name checkers)
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Student name is required.' }, { status: 400 });
    }
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit phone number.' }, { status: 400 });
    }

    // Calculate score & category
    const { score, category } = calculateScore({
      courseInterest: course_interest,
      qualification,
      age,
      downloadedBrochure: downloaded_brochure,
      websiteVisits: website_visits
    });

    // Create lead record in Supabase
    const { data: leadRecord, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone: cleanPhone,
        city: city || null,
        qualification: qualification || null,
        source,
        course_interest: course_interest || null,
        age: age ? parseInt(age) : null,
        downloaded_brochure: downloaded_brochure === true || downloaded_brochure === 'true',
        website_visits: website_visits ? parseInt(website_visits) : 1,
        score,
        category,
        status: 'New',
        notes: notes || null
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation code for PostgreSQL
        return NextResponse.json({ error: 'This phone number is already registered.' }, { status: 409 });
      }
      console.error('Supabase error inserting lead:', insertError);
      return NextResponse.json({ error: 'Failed to create student lead.' }, { status: 500 });
    }

    let finalLead = leadRecord;

    // Log registration activity
    await supabaseAdmin
      .from('lead_activity')
      .insert({
        lead_id: leadRecord.id,
        activity_type: 'status_change',
        description: `Student registered via ${source}. Initial score computed as ${score} (${category}).`
      });

    // Run round-robin assignment if lead is Hot (score >= 80)
    if (score >= 80) {
      const assigned = await assignCounselor(leadRecord.id);
      if (assigned) {
        const { data: updatedRecord } = await supabaseAdmin
          .from('leads')
          .select('*, counselors(*)')
          .eq('id', leadRecord.id)
          .single();
        if (updatedRecord) finalLead = updatedRecord;
      }
    }

    // Trigger n8n Webhook
    const n8nWebhook = process.env.NEXT_PUBLIC_N8N_WEBHOOK || process.env.N8N_WEBHOOK_URL;
    if (n8nWebhook && n8nWebhook.startsWith('http')) {
      try {
        await fetch(
          n8nWebhook,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name,
              email,
              phone: cleanPhone,
              city,
              qualification,
              course_interest
            })
          }
        );
        console.log('Successfully triggered n8n webhook for lead registration:', finalLead.id);
      } catch (err: any) {
        console.error('Failed to trigger n8n webhook:', err.message);
      }
    }

    return NextResponse.json(mapLeadKeys(finalLead), { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/leads:', err);
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join('c:', 'Users', 'Dell', 'Desktop', 'EFOS', 'client', 'error.log');
      const logMessage = `[${new Date().toISOString()}] ${err.stack || err.message || err}\n`;
      fs.appendFileSync(logPath, logMessage, 'utf8');
    } catch (logErr) {
      console.error('Failed to write to error.log:', logErr);
    }
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

