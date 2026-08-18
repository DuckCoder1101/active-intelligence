import { Timestamp } from "firebase-admin/firestore";

export interface AdminDocument {
  name: string;

  email: string;
  phone?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  fcmTokens?: string[];
}
