export interface PersonalTaskDTO {
  personalTaskId: string;
  companyId: string;
  createdBy: string;
  title: string;
  description?: string;
  dueDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface SavePersonalTaskDTO {
  personalTaskId?: string;
  companyId?: string;
  title: string;
  description?: string;
  dueDate: number;
}
