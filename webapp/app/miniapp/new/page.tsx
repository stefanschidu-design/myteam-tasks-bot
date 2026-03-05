'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';

export default function NewTaskPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    deadline: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data.filter((u: User) => u.role === 'employee') : []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.assignee_id || !form.deadline) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          deadline: new Date(form.deadline).toISOString(),
        }),
      });
      if (res.ok) {
        router.push('/miniapp');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
    color: 'var(--tg-theme-text-color, #000)',
    borderColor: 'var(--tg-theme-hint-color, #ccc)',
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-sm opacity-60">← Inapoi</button>
        <h1 className="text-lg font-bold">Sarcina noua</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Titlu *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="Titlul sarcinii"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descriere</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Descriere optionala..."
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Responsabil *</label>
          <select
            value={form.assignee_id}
            onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">Selecteaza...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Termen limita *</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            required
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Prioritate</label>
          <div className="flex gap-2">
            {[
              { value: 'low', label: '🟢 Scazuta' },
              { value: 'medium', label: '🟡 Medie' },
              { value: 'high', label: '🔴 Inalta' },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, priority: p.value })}
                className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-colors ${
                  form.priority === p.value ? 'bg-blue-500 text-white border-blue-500' : ''
                }`}
                style={form.priority !== p.value ? inputStyle : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-medium text-sm disabled:opacity-50"
          style={{ backgroundColor: 'var(--tg-theme-button-color, #2481cc)', color: 'var(--tg-theme-button-text-color, #fff)' }}
        >
          {loading ? 'Se salveaza...' : 'Creeaza sarcina'}
        </button>
      </form>
    </div>
  );
}
