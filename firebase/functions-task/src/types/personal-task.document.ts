import { Timestamp } from "firebase-admin/firestore";

export interface PersonalTaskDocument {
  companyId: string;
  createdBy: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
