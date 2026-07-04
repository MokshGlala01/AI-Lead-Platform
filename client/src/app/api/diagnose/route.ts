import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const diagnostics: any = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: {
        present: !!supabaseUrl,
        length: supabaseUrl.length,
        valueStart: supabaseUrl.substring(0, 15)
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        present: !!supabaseAnonKey,
        length: supabaseAnonKey.length,
        valueStart: supabaseAnonKey.substring(0, 10)
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        present: !!supabaseServiceKey,
        length: supabaseServiceKey.length,
        valueStart: supabaseServiceKey.substring(0, 10)
      }
    },
    supabaseTest: {}
  };

  try {
    if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
      const client = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
      const { data, error } = await client.from('leads').select('id').limit(1);
      diagnostics.supabaseTest = {
        success: !error,
        error: error ? error : null,
        rowCount: data ? data.length : 0
      };
    } else {
      diagnostics.supabaseTest = {
        success: false,
        error: 'Missing URL or Keys'
      };
    }
  } catch (err: any) {
    diagnostics.supabaseTest = {
      success: false,
      error: err.message || err
    };
  }

  return NextResponse.json(diagnostics);
}
