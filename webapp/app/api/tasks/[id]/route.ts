import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const TASK_SELECT = `
  *,
  assignee:users!tasks_assignee_id_fkey(id, name, username),
  creator:users!tasks_creator_id_fkey(id, name)
`;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const db = createServerSupabase();
  const { data, error } = await db
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', params.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const db = createServerSupabase();
  const body = await req.json();
  const { data, error } = await db
    .from('tasks')
    .update(body)
    .eq('id', params.id)
    .select(TASK_SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const db = createServerSupabase();
  const { error } = await db.from('tasks').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
