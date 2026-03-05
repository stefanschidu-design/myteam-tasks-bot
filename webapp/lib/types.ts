export type UserRole = 'manager' | 'employee';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  telegram_id: number;
  name: string;
  username: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  assignee_id: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
  assignee?: Pick<User, 'id' | 'name' | 'username'>;
  creator?: Pick<User, 'id' | 'name'>;
}

export interface TaskSummary {
  user_id: string;
  user_name: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  completion_rate: number | null;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'In asteptare',
  in_progress: 'In lucru',
  completed:   'Finalizata',
  overdue:     'Intarziata',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed:   'bg-green-100 text-green-800',
  overdue:     'bg-red-100 text-red-800',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Scazuta',
  medium: 'Medie',
  high:   'Inalta',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high:   'bg-red-100 text-red-800',
};
