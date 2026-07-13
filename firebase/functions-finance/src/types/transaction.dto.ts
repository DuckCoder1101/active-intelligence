import type {
  PaymentMethod,
  TransactionOrigin,
  TransactionStatus,
  TransactionType,
} from "./transaction.document";

export interface TransactionDTO {
  transactionId: string;
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
  dueDate: number;
  paidDate?: number;
  description?: string;
  externalId?: string;
  origin: TransactionOrigin;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveTransactionDTO {
  transactionId?: string;
  type: TransactionType;
  categoryId: string;
  subcategory?: string;
  companyId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  dueDate: number;
  description?: string;
}

export interface MarkTransactionPaidDTO {
  transactionId: string;
  paidDate: number;
}
