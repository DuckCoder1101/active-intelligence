import { Timestamp } from "firebase-admin/firestore";

export const ACCOUNT_TYPES = ["corrente", "poupanca"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const HOLDER_DOCUMENT_TYPES = ["cpf", "cnpj"] as const;
export type HolderDocumentType = (typeof HOLDER_DOCUMENT_TYPES)[number];

export interface FinanceAccountDocument {
  name: string;
  nameIndex: string;
  bankCode?: string;
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: AccountType;
  holderName?: string;
  holderDocumentType?: HolderDocumentType;
  holderDocument?: string;
  pixKey?: string;
  asaasWalletId?: string;
  createdAt: Timestamp;
}

export interface FinanceAccountDTO {
  accountId: string;
  name: string;
  bankCode?: string;
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: AccountType;
  holderName?: string;
  holderDocumentType?: HolderDocumentType;
  holderDocument?: string;
  pixKey?: string;
  asaasWalletId?: string;
}
