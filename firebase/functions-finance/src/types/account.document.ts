import { Timestamp } from "firebase-admin/firestore";

export interface FinanceAccountDocument {
  name: string;
  nameIndex: string;
  createdAt: Timestamp;
}

export interface FinanceAccountDTO {
  accountId: string;
  name: string;
}
