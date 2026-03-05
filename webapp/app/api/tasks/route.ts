import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const TASK_SELECT = `
  *,
  assignee:users!tasks_assignee_id_fkey(id, name, username),
  creator:users!tasks_creator_id_fkey(id, name)
`;

export async function GET(req: NextRequest) {
  const db = createServerSupabase();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const assigneeId = searchParams.get('assignee_id');

  let query = db
    .from('tasks')
    .select(TASK_SELECT)
    .order('deadline', { ascending: true });

  if (status) query = query.eq('status', status);
  if (assigneeId) query = query.eq('assignee_id', assigneeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerSupabase();
  const body = await req.json();
  const { data, error } = await db
    .from('tasks')
    .insert(body)
    .select(TASK_SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
