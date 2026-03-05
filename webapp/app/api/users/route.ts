import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const db = createServerSupabase();
  const { data, error } = await db
    .from('users')
    .select('id, name, username, role, is_active, telegram_id')
    .eq('is_active', true)
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
