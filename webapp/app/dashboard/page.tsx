import { createServerSupabase } from '@/lib/supabase/server';
import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_ORDER: TaskStatus[] = ['overdue', 'in_progress', 'pending', 'completed'];

export default async function DashboardPage() {
  const db = createServerSupabase();

  const [tasksRes, summaryRes] = await Promise.all([
    db
      .from('tasks')
      .select('*, assignee:users!tasks_assignee_id_fkey(id, name)')
      .order('deadline', { ascending: true })
      .limit(10),
    db.from('task_summary').select('*'),
  ]);

  const tasks: Task[] = tasksRes.data ?? [];
  const summary = summaryRes.data ?? [];

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const totalTasks = summary.reduce((s, r) => s + (r.total_tasks ?? 0), 0);
  const totalCompleted = summary.reduce((s, r) => s + (r.completed_tasks ?? 0), 0);
  const totalOverdue = summary.reduce((s, r) => s + (r.overdue_tasks ?? 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Prezentare generala</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total sarcini', value: totalTasks, color: 'bg-blue-50 text-blue-700' },
          { label: 'Finalizate', value: totalCompleted, color: 'bg-green-50 text-green-700' },
          { label: 'Intarziate', value: totalOverdue, color: 'bg-red-50 text-red-700' },
          { label: 'In lucru', value: tasks.filter((t) => t.status === 'in_progress').length, color: 'bg-yellow-50 text-yellow-700' },
        ].map((card) => (
          <div key={card.label} className={`rounded-lg p-4 ${card.color}`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Sarcini recente</h2>
          <Link href="/dashboard/tasks" className="text-sm text-blue-600 hover:underline">
            Vezi toate
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {tasks.length === 0 && (
            <p className="p-4 text-gray-500 text-sm">Nu exista sarcini.</p>
          )}
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/tasks/${task.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                <p className="text-xs text-gray-500">
                  {(task as any).assignee?.name} · {formatDate(task.deadline)}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
