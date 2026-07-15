import { Timestamp } from "firebase-admin/firestore";

export interface FinanceCategoryDocument {
  name: string;
  nameIndex: string;
  createdAt: Timestamp;
}

export interface FinanceCategoryDTO {
  categoryId: string;
  name: string;
}
