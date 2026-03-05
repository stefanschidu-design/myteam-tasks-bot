'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const STATUS_ACTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'in_progress', label: '🔄 Marcheaza In lucru' },
  { value: 'completed',   label: '✅ Marcheaza Finalizata' },
  { value: 'pending',     label: '⏳ Marcheaza In asteptare' },
];

export default function TaskDetailMiniApp({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${params.id}`)
      .then((r) => r.json())
      .then(setTask)
      .finally(() => setLoading(false));
  }, [params.id]);

  const updateStatus = async (status: TaskStatus) => {
    if (!task) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTask(updated);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-sm opacity-50">Se incarca...</div>;
  }

  if (!task) {
    return <div className="flex items-center justify-center h-screen text-sm opacity-50">Sarcina nu a fost gasita.</div>;
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm opacity-60">← Inapoi</button>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-bold leading-snug">{task.title}</h1>
          <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        {task.description && (
          <p className="text-sm opacity-70 whitespace-pre-wrap">{task.description}</p>
        )}

        <div
          className="rounded-lg p-3 space-y-2 text-sm"
          style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)' }}
        >
          <div className="flex justify-between">
            <span className="opacity-50">Responsabil</span>
            <span className="font-medium">{(task as any).assignee?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-50">Termen</span>
            <span className="font-medium">{formatDate(task.deadline)}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-50">Prioritate</span>
            <span className="font-medium">{PRIORITY_LABELS[task.priority]}</span>
          </div>
        </div>
      </div>

      {/* Status actions */}
      {task.status !== 'completed' && (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium opacity-60">Actualizeaza statusul</p>
          {STATUS_ACTIONS.filter((a) => a.value !== task.status).map((action) => (
            <button
              key={action.value}
              onClick={() => updateStatus(action.value)}
              disabled={updating}
              className="w-full py-3 rounded-lg text-sm font-medium border disabled:opacity-50 transition-colors"
              style={{
                borderColor: 'var(--tg-theme-hint-color, #ccc)',
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
