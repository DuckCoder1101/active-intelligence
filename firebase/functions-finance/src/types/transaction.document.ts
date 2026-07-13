import {Timestamp} from "firebase-admin/firestore";

export const TRANSACTION_TYPES = ["entrada", "saida"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ["previsto", "realizado"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const PAYMENT_METHODS = [
  "pix",
  "boleto",
  "transferencia",
  "cartao",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_ORIGINS = ["manual", "asaas"] as const;
export type TransactionOrigin = (typeof TRANSACTION_ORIGINS)[number];

export interface TransactionDocument {
  type: TransactionType;
  status: TransactionStatus;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  companyId?: string;
  companyName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  accountName: string;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  description?: string;
  externalId?: string;
  origin: TransactionOrigin;

  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
