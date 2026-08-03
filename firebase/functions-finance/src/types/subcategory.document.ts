import { Timestamp } from "firebase-admin/firestore";

import { FinanceCategoryType } from "./category.type";

export interface FinanceSubcategoryDocument {
  categoryType: FinanceCategoryType;
  name: string;
  nameIndex: string;
  order: number;
  createdAt: Timestamp;
}

export interface FinanceSubcategoryDTO {
  subcategoryId: string;
  categoryType: FinanceCategoryType;
  name: string;
  order: number;
}
