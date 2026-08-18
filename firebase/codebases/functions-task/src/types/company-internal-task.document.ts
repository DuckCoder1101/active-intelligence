import { Timestamp } from "firebase-admin/firestore";

export const DEFAULT_COMPANY_INTERNAL_TASK_COLOR = "#ff6a00";

export interface CompanyInternalTaskDocument {
  companyId: string;
  createdBy: string;
  title: string;
  description?: string;
  color: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
