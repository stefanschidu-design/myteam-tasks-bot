import { TaskStatus } from './types';

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function isOverdue(deadline: string, status: TaskStatus): boolean {
  return new Date(deadline) < new Date() && status !== 'completed';
}

export function clsx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
