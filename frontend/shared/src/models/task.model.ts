export const TASK_TYPES = [
  'feed',
  'stories',
  'reels',
  'carrossel',
  'campanha',
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export type TaskStatus = 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'rejected';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending_approval: 'Pendente aprovação',
  approved: 'Aprovada',
  in_progress: 'Em progresso',
  completed: 'Concluída',
  rejected: 'Rejeitada',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending_approval: 'bg-orange-500',
  approved: 'bg-amber-400',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

export interface Task {
  taskId: string;
  companyId: string;
  title: string;
  description: string;
  type: TaskType;
  status: string;
  approvalStatus?: TaskStatus;
  dueDate: number;
  createdBy: string;
  createdByName?: string;
  assignedTo: string[];
  referenceLinks: string[];
  referenceImages: string[];
  hasMedia: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SaveTaskDTO {
  taskId?: string;
  companyId: string;
  title: string;
  description?: string;
  type: TaskType;
  status?: string;
  dueDate: number;
  assignedTo?: string[];
  referenceLinks?: string[];
  referenceImages?: string[];
}

export interface CreateClientTaskDTO {
  title: string;
  description?: string;
  type: TaskType;
  dueDate: number;
  referenceLinks?: string[];
  referenceImages?: string[];
  createdByName?: string;
}

export interface TaskUsage {
  used: number;
  limit: number | null;
  yearMonth: string;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  feed: 'Feed',
  stories: 'Stories',
  reels: 'Reels',
  carrossel: 'Carrossel',
  campanha: 'Campanha',
};

