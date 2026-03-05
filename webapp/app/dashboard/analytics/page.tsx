import { createServerSupabase } from '@/lib/supabase/server';
import { TaskSummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const db = createServerSupabase();
  const { data } = await db.from('task_summary').select('*');
  const summaries: TaskSummary[] = data ?? [];

  const totals = summaries.reduce(
    (acc, r) => ({
      total: acc.total + (r.total_tasks ?? 0),
      completed: acc.completed + (r.completed_tasks ?? 0),
      overdue: acc.overdue + (r.overdue_tasks ?? 0),
      in_progress: acc.in_progress + (r.in_progress_tasks ?? 0),
    }),
    { total: 0, completed: 0, overdue: 0, in_progress: 0 },
  );

  const globalRate = totals.total > 0
    ? Math.round((totals.completed / totals.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Analitice echipa</h1>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total sarcini', value: totals.total },
          { label: 'Finalizate', value: totals.completed },
          { label: 'Intarziate', value: totals.overdue },
          { label: 'Rata globala', value: `${globalRate}%` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-3xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Per-person table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Angajat</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Finalizate</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">In lucru</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Intarziate</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Rata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summaries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Nu exista date.
                </td>
              </tr>
            )}
            {summaries.map((row) => (
              <tr key={row.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.user_name}</td>
                <td className="px-4 py-3 text-right text-gray-700">{row.total_tasks}</td>
                <td className="px-4 py-3 text-right text-green-600 font-medium">{row.completed_tasks}</td>
                <td className="px-4 py-3 text-right text-blue-600">{row.in_progress_tasks}</td>
                <td className="px-4 py-3 text-right text-red-600">{row.overdue_tasks}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {row.completion_rate ?? 0}%
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div
                      className="bg-green-500 h-1 rounded-full"
                      style={{ width: `${row.completion_rate ?? 0}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
