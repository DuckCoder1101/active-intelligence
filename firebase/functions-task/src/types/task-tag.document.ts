import { Timestamp } from "firebase-admin/firestore";

export interface TaskTagDocument {
  name: string;
  color: string;
  createdAt: Timestamp;
}
