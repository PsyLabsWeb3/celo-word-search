import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic'; // Always fetch fresh data from DB

export async function GET(req: Request) {
  try {
    // Standard query to get all crosswords, ordered by newest first
    const { data: crosswords, error } = await supabase
      .from('crosswords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ crosswords });

  } catch (error: any) {
    console.error('List error:', error);
    // Log environment check (don't log full keys)
    console.log('Supabase URL defined:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase URL start:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 8));
    return NextResponse.json({ error: `List failed: ${error.message} ${error.cause ? '(' + error.cause + ')' : ''}` }, { status: 500 });
  }
}
