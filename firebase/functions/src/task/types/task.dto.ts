import type { TaskType } from './task.document';

export interface TaskDTO {
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

export interface UpdateTaskStatusDTO {
  taskId: string;
  status: string;
}
