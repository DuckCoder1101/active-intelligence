import {FieldValue} from "firebase-admin/firestore";
import {database} from "functions-shared";

import {
  FinanceAccountDocument,
  FinanceAccountDTO,
} from "../types/account.type";

export class AccountRepository {
  private static col = database.collection("finance_accounts");

  static async listAll(): Promise<FinanceAccountDTO[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((doc) => {
        const data = doc.data() as FinanceAccountDocument;
        return {accountId: doc.id, name: data.name};
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getById(accountId: string): Promise<FinanceAccountDTO> {
    const snap = await this.col.doc(accountId).get();
    const data = snap.data() as FinanceAccountDocument;
    return {accountId: snap.id, name: data.name};
  }

  static async save(name: string): Promise<FinanceAccountDTO> {
    const existing = await this.col
      .where("nameIndex", "==", name.trim().toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const data = doc.data() as FinanceAccountDocument;
      return {accountId: doc.id, name: data.name};
    }

    const ref = this.col.doc();
    await ref.set({
      name: name.trim(),
      nameIndex: name.trim().toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return {accountId: ref.id, name: name.trim()};
  }
}
