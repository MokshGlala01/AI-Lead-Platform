import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export function mapCounselorKeys(c: any) {
  if (!c) return null;
  return {
    ...c,
    isAvailable: c.is_available,
    totalAssigned: c.total_assigned,
    profileId: c.profile_id,
    createdAt: c.created_at
  };
}

// GET /api/counselors - List all counselors
export async function GET(req: NextRequest) {
  try {
    const { data: counselors, error } = await supabaseAdmin
      .from('counselors')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase query error in GET /api/counselors:', error);
      return NextResponse.json({ error: 'Failed to retrieve counselors.' }, { status: 500 });
    }

    const mapped = (counselors || []).map(mapCounselorKeys);
    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error('Error in GET /api/counselors:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
