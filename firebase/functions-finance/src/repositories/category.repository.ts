import { FieldValue } from "firebase-admin/firestore";
import { database } from "functions-shared";

import {
  FinanceCategoryDocument,
  FinanceCategoryDTO,
} from "../types/category.type";

export class CategoryRepository {
  private static col = database.collection("finance_categories");

  static async listAll(): Promise<FinanceCategoryDTO[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((doc) => {
        const data = doc.data() as FinanceCategoryDocument;
        return { categoryId: doc.id, name: data.name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getById(categoryId: string): Promise<FinanceCategoryDTO> {
    const snap = await this.col.doc(categoryId).get();
    const data = snap.data() as FinanceCategoryDocument;
    return { categoryId: snap.id, name: data.name };
  }

  static async save(name: string): Promise<FinanceCategoryDTO> {
    const existing = await this.col
      .where("nameIndex", "==", name.trim().toLowerCase())
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const data = doc.data() as FinanceCategoryDocument;
      return { categoryId: doc.id, name: data.name };
    }

    const ref = this.col.doc();
    await ref.set({
      name: name.trim(),
      nameIndex: name.trim().toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return { categoryId: ref.id, name: name.trim() };
  }
}
