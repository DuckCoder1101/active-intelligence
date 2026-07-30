export interface TaskSubcategory {
  subcategoryId: string;
  name: string;
  order: number;
}

export interface TaskCategory {
  categoryId: string;
  name: string;
  color: string;
  order: number;
  subcategories: TaskSubcategory[];
}

export interface SaveTaskCategoryDTO {
  categoryId?: string;
  name: string;
  color: string;
  order?: number;
}

export interface SaveTaskSubcategoryDTO {
  categoryId: string;
  subcategoryId?: string;
  name: string;
  order?: number;
}

export interface TaskTag {
  tagId: string;
  name: string;
  color: string;
}

export interface Task {
  taskId: string;
  companyId: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];
  status: string;
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
  categoryId: string;
  subcategoryId?: string | null;
  tags?: string[];
  status?: string;
  dueDate: number;
  assignedTo?: string[];
  referenceLinks?: string[];
  referenceImages?: string[];
}

export interface CreateClientTaskDTO {
  title: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string | null;
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
