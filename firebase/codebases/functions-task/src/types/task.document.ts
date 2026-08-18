import { Timestamp } from "firebase-admin/firestore";

export interface TaskDocument {
  companyId: string;
  title: string;
  description: string;
  /** @deprecated substituído por categoryId — mantido só em docs antigos */
  type?: string;
  categoryId: string;
  subcategoryId?: string | null;
  tags: string[];
  status: string;
  dueDate: Timestamp;
  createdBy: string;
  createdByName?: string;
  assignedTo: string[];
  referenceLinks: string[];
  referenceImages: string[];
  hasMedia: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
