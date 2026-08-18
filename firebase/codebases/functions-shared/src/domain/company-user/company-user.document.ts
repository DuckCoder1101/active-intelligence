import { Timestamp } from "firebase-admin/firestore";

export interface CompanyUserDocument {
  companyId: string;

  name: string;
  email: string;
  phone?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  fcmTokens?: string[];
}
