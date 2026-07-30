import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { database } from "functions-shared";

import {
  FinanceAccountDocument,
  FinanceAccountDTO,
} from "../types/account.type";

export class AccountRepository {
  private static col = database.collection("finance_accounts");
  private static transactionsCol = database.collection("finance_transactions");

  static async listAll(): Promise<FinanceAccountDTO[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((doc) => {
        const data = doc.data() as FinanceAccountDocument;
        return { accountId: doc.id, name: data.name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getById(accountId: string): Promise<FinanceAccountDTO> {
    const snap = await this.col.doc(accountId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Conta não encontrada.");
    }
    const data = snap.data() as FinanceAccountDocument;
    return { accountId: snap.id, name: data.name };
  }

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
      const existingData = doc.data() as FinanceAccountDocument;
      return { accountId: doc.id, name: existingData.name };
    }

    const ref = this.col.doc();
    await ref.set({
      name,
      nameIndex: name.toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return { accountId: ref.id, name };
  }

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
