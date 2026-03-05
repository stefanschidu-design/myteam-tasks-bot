import { createServerSupabase } from '@/lib/supabase/server';
import { Task, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const db = createServerSupabase();
  const { data, error } = await db
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assignee_id_fkey(id, name, username),
      creator:users!tasks_creator_id_fkey(id, name)
    `)
    .eq('id', params.id)
    .single();

  if (error || !data) notFound();
  const task = data as Task;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/tasks" className="text-sm text-blue-600 hover:underline">
          ← Inapoi la sarcini
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
          <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        {task.description && (
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{task.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Responsabil</p>
            <p className="font-medium text-gray-900">{(task as any).assignee?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Creat de</p>
            <p className="font-medium text-gray-900">{(task as any).creator?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500">Termen limita</p>
            <p className="font-medium text-gray-900">{formatDate(task.deadline)}</p>
          </div>
          <div>
            <p className="text-gray-500">Prioritate</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
          <div>
            <p className="text-gray-500">Creat la</p>
            <p className="font-medium text-gray-900">{formatDate(task.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-500">Ultima modificare</p>
            <p className="font-medium text-gray-900">{formatDate(task.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
