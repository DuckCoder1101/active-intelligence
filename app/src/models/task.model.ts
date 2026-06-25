export const TASK_TYPES = [
  'feed',
  'stories',
  'reels',
  'carrossel',
  'campanha',
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export interface Task {
  taskId: string;
  companyId: string;
  title: string;
  description: string;
  type: TaskType;
  status: string;
  dueDate: number;
  createdBy: string;
  assignedTo: string[];
  referenceLinks: string[];
  referenceImages: string[];
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

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  feed: 'Feed',
  stories: 'Stories',
  reels: 'Reels',
  carrossel: 'Carrossel',
  campanha: 'Campanha',
};

