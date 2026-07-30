import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";

import { FinanceCategoryType } from "../types/category.type";
import {
  FinanceSubcategoryDocument,
  FinanceSubcategoryDTO,
} from "../types/subcategory.type";

function toDTO(id: string, data: FinanceSubcategoryDocument): FinanceSubcategoryDTO {
  return {
    subcategoryId: id,
    categoryType: data.categoryType,
    name: data.name,
    order: data.order,
  };
}

export class SubcategoryRepository {
  private static col = database.collection("finance_subcategories");
  private static transactionsCol = database.collection("finance_transactions");

  static async listAll(): Promise<FinanceSubcategoryDTO[]> {
    const snap = await this.col.orderBy("order", "asc").get();
    return snap.docs.map((doc) =>
      toDTO(doc.id, doc.data() as FinanceSubcategoryDocument),
    );
  }

  static async getById(subcategoryId: string): Promise<FinanceSubcategoryDTO> {
    const snap = await this.col.doc(subcategoryId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Subcategoria não encontrada.");
    }
    return toDTO(snap.id, snap.data() as FinanceSubcategoryDocument);
  }

  static async save(data: {
    subcategoryId?: string;
    categoryType: FinanceCategoryType;
    name: string;
    order?: number;
  }): Promise<FinanceSubcategoryDTO> {
    const ref = data.subcategoryId
      ? this.col.doc(data.subcategoryId)
      : this.col.doc();
    const isNew = !data.subcategoryId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Subcategoria não encontrada.");
      }
    }

    let order = data.order;
    if (order === undefined) {
      const snap = await this.col
        .where("categoryType", "==", data.categoryType)
        .orderBy("order", "desc")
        .limit(1)
        .get();
      order = snap.empty
        ? 0
        : (snap.docs[0].data() as FinanceSubcategoryDocument).order + 1;
    }

    await ref.set(
      {
        categoryType: data.categoryType,
        name: data.name.trim(),
        nameIndex: data.name.trim().toLowerCase(),
        order,
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    return toDTO(saved.id, saved.data() as FinanceSubcategoryDocument);
  }

  static async delete(subcategoryId: string): Promise<void> {
    const ref = this.col.doc(subcategoryId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Subcategoria não encontrada.");
    }

    const inUse = await this.transactionsCol
      .where("subcategoryId", "==", subcategoryId)
      .limit(1)
      .get();
    if (!inUse.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma subcategoria em uso por lançamentos.",
      );
    }

    await ref.delete();
  }
}
