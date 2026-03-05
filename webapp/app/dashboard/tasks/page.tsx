import { createServerSupabase } from '@/lib/supabase/server';
import { Task, User, TaskStatus, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { status?: string; assignee_id?: string };
}) {
  const db = createServerSupabase();

  let query = db
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assignee_id_fkey(id, name),
      creator:users!tasks_creator_id_fkey(id, name)
    `)
    .order('deadline', { ascending: true });

  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.assignee_id) query = query.eq('assignee_id', searchParams.assignee_id);

  const [tasksRes, usersRes] = await Promise.all([
    query,
    db.from('users').select('id, name').eq('is_active', true).order('name'),
  ]);

  const tasks: Task[] = tasksRes.data ?? [];
  const users: Pick<User, 'id' | 'name'>[] = usersRes.data ?? [];

  const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Toate sarcinile</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Link
          href="/dashboard/tasks"
          className="px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-gray-100"
        >
          Toate
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/dashboard/tasks?status=${s}`}
            className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[s]}`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Titlu</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Responsabil</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Termen</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prioritate</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Nu exista sarcini.
                </td>
              </tr>
            )}
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{(task as any).assignee?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(task.deadline)}</td>
                <td className="px-4 py-3 text-gray-700">{PRIORITY_LABELS[task.priority]}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
