import { Timestamp } from "firebase-admin/firestore";

export interface TaskCategoryDocument {
  name: string;
  color: string;
  order: number;
  createdAt: Timestamp;
}

export interface TaskSubcategoryDocument {
  name: string;
  order: number;
  createdAt: Timestamp;
}

export const DEFAULT_TASK_CATEGORIES: Array<{
  id: string;
  name: string;
  color: string;
  order: number;
}> = [
  { id: "feed", name: "Feed", color: "#3b82f6", order: 0 },
  { id: "stories", name: "Stories", color: "#38bdf8", order: 1 },
  { id: "reels", name: "Reels", color: "#94a3b8", order: 2 },
  { id: "carrossel", name: "Carrossel", color: "#f59e0b", order: 3 },
  { id: "campanha", name: "Campanha", color: "#10b981", order: 4 },
];
