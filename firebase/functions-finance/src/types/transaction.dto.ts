import type { FinanceCategoryType } from "./category.type";
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
  category: FinanceCategoryType;
  subcategoryId?: string;
  subcategoryName?: string;
  companyId?: string;
  companyName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  accountName: string;
  dueDate: number;
  accrualDate: number;
  paidDate?: number;
  description?: string;
  groupId?: string;
  installmentIndex?: number;
  installmentTotal?: number;
  isRecurring?: boolean;
  externalId?: string;
  origin: TransactionOrigin;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface SaveTransactionDTO {
  transactionId?: string;
  type: TransactionType;
  category: FinanceCategoryType;
  subcategoryId?: string;
  companyId?: string;
  /** Rótulo livre de cliente/projeto, usado só quando `companyId` não é informado. */
  companyName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  accountId: string;
  dueDate: number;
  accrualDate: number;
  description?: string;
  /** Só editável numa transação existente que já faz parte de um grupo parcelado. */
  installmentIndex?: number;
  /** Only used on create; splits the transaction into N monthly installments sharing a `groupId`. Mutually exclusive with `isRecurring`. */
  installments?: number;
  /** Only used on create; generates monthly occurrences of the same `amount` until `recurrenceEndDate` (or a 12-month default horizon). Mutually exclusive with `installments`. */
  isRecurring?: boolean;
  recurrenceEndDate?: number;
  /** Client-settable subset — `"asaas"` is exclusive to the payment webhook. */
  origin?: Extract<TransactionOrigin, "manual" | "contas">;
}

export interface MarkTransactionPaidDTO {
  transactionId: string;
  paidDate: number;
}
