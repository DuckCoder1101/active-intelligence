export interface CompanyInternalTaskDTO {
  companyInternalTaskId: string;
  companyId: string;
  createdBy: string;
  title: string;
  description?: string;
  color: string;
  dueDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface SaveCompanyInternalTaskDTO {
  companyInternalTaskId?: string;
  companyId?: string;
  title: string;
  description?: string;
  color?: string;
  dueDate: number;
}
