import { createServerSupabase } from '@/lib/supabase/server';
import { User, TaskSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const db = createServerSupabase();
  const [usersRes, summaryRes] = await Promise.all([
    db.from('users').select('*').eq('is_active', true).order('name'),
    db.from('task_summary').select('*'),
  ]);

  const users: User[] = usersRes.data ?? [];
  const summary: TaskSummary[] = summaryRes.data ?? [];
  const summaryMap = Object.fromEntries(summary.map((s) => [s.user_id, s]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Echipa</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const stats = summaryMap[user.id];
          return (
            <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  {user.username && (
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.role === 'manager'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.role === 'manager' ? 'Manager' : 'Angajat'}
                </span>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="font-bold text-gray-900">{stats.total_tasks}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="font-bold text-green-700">{stats.completed_tasks}</p>
                    <p className="text-xs text-gray-500">Finalizate</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="font-bold text-blue-700">{stats.in_progress_tasks}</p>
                    <p className="text-xs text-gray-500">In lucru</p>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <p className="font-bold text-red-700">{stats.overdue_tasks}</p>
                    <p className="text-xs text-gray-500">Intarziate</p>
                  </div>
                </div>
              )}

              {stats && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Rata finalizare</span>
                    <span>{stats.completion_rate ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.completion_rate ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
