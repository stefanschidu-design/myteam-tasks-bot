'use client';
import { useEffect, useState, useCallback } from 'react';
import { Task, TaskStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const COLUMNS: { status: TaskStatus; emoji: string }[] = [
  { status: 'overdue',     emoji: '❌' },
  { status: 'pending',     emoji: '⏳' },
  { status: 'in_progress', emoji: '🔄' },
  { status: 'completed',   emoji: '✅' },
];

export default function MiniAppPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCol, setActiveCol] = useState<TaskStatus>('pending');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filtered = tasks.filter((t) => t.status === activeCol);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold">Sarcini</h1>
        <Link
          href="/miniapp/new"
          className="text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--tg-theme-button-color, #2481cc)', color: 'var(--tg-theme-button-text-color, #fff)' }}
        >
          + Nou
        </Link>
      </div>

      {/* Column tabs */}
      <div className="flex border-b overflow-x-auto px-4">
        {COLUMNS.map(({ status, emoji }) => (
          <button
            key={status}
            onClick={() => setActiveCol(status)}
            className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeCol === status
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            {emoji} {STATUS_LABELS[status]} ({tasks.filter((t) => t.status === status).length})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <p className="text-sm text-gray-400 text-center pt-8">Se incarca...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center pt-8">Nu exista sarcini.</p>
        )}
        {filtered.map((task) => (
          <Link
            key={task.id}
            href={`/miniapp/task/${task.id}`}
            className="block rounded-lg border p-3 space-y-1"
            style={{ borderColor: 'var(--tg-theme-hint-color, #ccc)', backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm leading-snug">{task.title}</p>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
            {task.description && (
              <p className="text-xs opacity-60 line-clamp-2">{task.description}</p>
            )}
            <p className="text-xs opacity-50">
              {(task as any).assignee?.name} · Termen: {formatDate(task.deadline)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
