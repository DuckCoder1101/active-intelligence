import type { TaskStatus, TaskType } from './task.document';

export interface TaskDTO {
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
  approvalStatus?: TaskStatus;
  dueDate: number;
  assignedTo?: string[];
  referenceLinks?: string[];
  referenceImages?: string[];
  createdByName?: string;
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

export interface UpdateTaskStatusDTO {
  taskId: string;
  status: string;
}

export interface ApproveRejectTaskDTO {
  taskId: string;
}
