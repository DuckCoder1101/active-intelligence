export const DEFAULT_PERSONAL_TASK_COLOR = '#ff6a00';

export const PERSONAL_TASK_COLOR_PRESETS = [
  { label: 'Laranja', value: '#ff6a00' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Violeta', value: '#8b5cf6' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Vermelho', value: '#ef4444' },
  { label: 'Verde', value: '#10b981' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Cinza', value: '#94a3b8' },
] as const;

export interface PersonalTask {
  personalTaskId: string;
  companyId: string;
  createdBy: string;
  title: string;
  description?: string;
  color: string;
  dueDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavePersonalTaskDTO {
  personalTaskId?: string;
  title: string;
  description?: string;
  color?: string;
  dueDate: number;
}
