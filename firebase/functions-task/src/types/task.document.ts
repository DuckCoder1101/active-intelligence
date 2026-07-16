import { Timestamp } from "firebase-admin/firestore";

export const TASK_TYPES = [
  "feed",
  "stories",
  "reels",
  "carrossel",
  "campanha",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

export interface TaskDocument {
  companyId: string;
  title: string;
  description: string;
  type: TaskType;
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
