import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { database } from "functions-shared";

import {
  FinanceAccountDocument,
  FinanceAccountDTO,
} from "../types/account.document";

function toDTO(id: string, data: FinanceAccountDocument): FinanceAccountDTO {
  return {
    accountId: id,
    name: data.name,
    bankCode: data.bankCode,
    bankName: data.bankName,
    agency: data.agency,
    agencyDigit: data.agencyDigit,
    accountNumber: data.accountNumber,
    accountDigit: data.accountDigit,
    accountType: data.accountType,
    holderName: data.holderName,
    holderDocumentType: data.holderDocumentType,
    holderDocument: data.holderDocument,
    pixKey: data.pixKey,
    asaasWalletId: data.asaasWalletId,
  };
}

export interface SaveAccountInput {
  accountId?: string;
  name: string;
  bankCode?: string;
  bankName?: string;
  agency?: string;
  agencyDigit?: string;
  accountNumber?: string;
  accountDigit?: string;
  accountType?: FinanceAccountDocument["accountType"];
  holderName?: string;
  holderDocumentType?: FinanceAccountDocument["holderDocumentType"];
  holderDocument?: string;
  pixKey?: string;
  asaasWalletId?: string;
}

/** Firestore: `finance_accounts` (top-level). Also reads `finance_transactions` to check usage before deletion. */
export class AccountRepository {
  private static col = database.collection("finance_accounts");
  private static transactionsCol = database.collection("finance_transactions");

  static async listAll(): Promise<FinanceAccountDTO[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((doc) => toDTO(doc.id, doc.data() as FinanceAccountDocument))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getById(accountId: string): Promise<FinanceAccountDTO> {
    const snap = await this.col.doc(accountId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Conta não encontrada.");
    }
    return toDTO(snap.id, snap.data() as FinanceAccountDocument);
  }

  /** Upserts when `accountId` is given; on create, dedupes by `nameIndex` — returns the existing account instead of creating a duplicate. */
  static async save(data: SaveAccountInput): Promise<FinanceAccountDTO> {
    const { accountId, name: rawName, ...bankFields } = data;
    const name = rawName.trim();

    if (accountId) {
      const ref = this.col.doc(accountId);
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Conta não encontrada.");
      }
      await ref.set(
        { name, nameIndex: name.toLowerCase(), ...bankFields },
        { merge: true },
      );
      const saved = await ref.get();
      return toDTO(saved.id, saved.data() as FinanceAccountDocument);
    }

    const duplicate = await this.col
      .where("nameIndex", "==", name.toLowerCase())
      .limit(1)
      .get();

    if (!duplicate.empty) {
      const doc = duplicate.docs[0];
      return toDTO(doc.id, doc.data() as FinanceAccountDocument);
    }

    const ref = this.col.doc();
    await ref.set({
      name,
      nameIndex: name.toLowerCase(),
      ...bankFields,
      createdAt: FieldValue.serverTimestamp(),
    });
    const saved = await ref.get();
    return toDTO(saved.id, saved.data() as FinanceAccountDocument);
  }

  /** Blocks deletion (`failed-precondition`) if the account is referenced by any transaction. */
  static async delete(accountId: string): Promise<void> {
    const ref = this.col.doc(accountId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Conta não encontrada.");
    }

    const inUse = await this.transactionsCol
      .where("accountId", "==", accountId)
      .limit(1)
      .get();
    if (!inUse.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma conta em uso por lançamentos.",
      );
    }

    await ref.delete();
  }
}
