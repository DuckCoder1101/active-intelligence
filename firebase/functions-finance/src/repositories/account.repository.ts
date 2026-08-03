import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { database } from "functions-shared";

import {
  FinanceAccountDocument,
  FinanceAccountDTO,
} from "../types/account.document";

function toDTO(id: string, data: FinanceAccountDocument): FinanceAccountDTO {
  return { accountId: id, name: data.name };
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
  static async save(data: { accountId?: string; name: string }): Promise<FinanceAccountDTO> {
    const name = data.name.trim();

    if (data.accountId) {
      const ref = this.col.doc(data.accountId);
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Conta não encontrada.");
      }
      await ref.set(
        { name, nameIndex: name.toLowerCase() },
        { merge: true },
      );
      return { accountId: ref.id, name };
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
      createdAt: FieldValue.serverTimestamp(),
    });
    return { accountId: ref.id, name };
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
