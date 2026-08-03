import { Timestamp } from "firebase-admin/firestore";

export interface ReviewDocument {
  companyId: string;
  submittedByUid: string;
  anonymous: boolean;
  stars: number;
  comment?: string;
  createdAt: Timestamp;
}
