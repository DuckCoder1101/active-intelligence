import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import { TransactionDocument } from "../types/transaction.document";
import { TransactionDTO } from "../types/transaction.dto";

function toDTO(id: string, data: TransactionDocument): TransactionDTO {
  return {
    transactionId: id,
    type: data.type,
    status: data.status,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    subcategory: data.subcategory,
    companyId: data.companyId,
    companyName: data.companyName,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    accountId: data.accountId,
    accountName: data.accountName,
    dueDate: data.dueDate.toMillis(),
    paidDate: data.paidDate?.toMillis(),
    description: data.description,
    externalId: data.externalId,
    origin: data.origin,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

export interface SaveTransactionInput {
  transactionId?: string;
  type: TransactionDocument["type"];
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  companyId?: string;
  companyName?: string;
  amount: number;
  paymentMethod: TransactionDocument["paymentMethod"];
  accountId: string;
  accountName: string;
  dueDate: number;
  description?: string;
  createdBy: string;
}

export class TransactionRepository {
  private static col = database.collection("finance_transactions");

  static async save(data: SaveTransactionInput): Promise<TransactionDTO> {
    const { transactionId, dueDate, createdBy, ...rest } = data;
    const ref = transactionId ? this.col.doc(transactionId) : this.col.doc();
    const isNew = !transactionId;

    const payload: Record<string, unknown> = {
      ...rest,
      dueDate: Timestamp.fromMillis(dueDate),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.status = "previsto";
      payload.origin = "manual";
      payload.createdBy = createdBy;
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(payload, { merge: true });

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as TransactionDocument);
  }

  static async getById(transactionId: string): Promise<TransactionDTO> {
    const snap = await this.col.doc(transactionId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Lançamento não encontrado.");
    }
    return toDTO(snap.id, snap.data() as TransactionDocument);
  }

  static async listAll(): Promise<TransactionDTO[]> {
    const snap = await this.col.orderBy("dueDate", "desc").get();
    return snap.docs.map((doc) =>
      toDTO(doc.id, doc.data() as TransactionDocument),
    );
  }

  static async markPaid(
    transactionId: string,
    paidDate: number,
  ): Promise<TransactionDTO> {
    const ref = this.col.doc(transactionId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Lançamento não encontrado.");
    }

    await ref.update({
      status: "realizado",
      paidDate: Timestamp.fromMillis(paidDate),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const updated = await ref.get();
    return toDTO(updated.id, updated.data() as TransactionDocument);
  }

  static async delete(transactionId: string): Promise<TransactionDTO> {
    const ref = this.col.doc(transactionId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Lançamento não encontrado.");
    }

    const transaction = toDTO(
      transactionId,
      snap.data() as TransactionDocument,
    );
    await ref.delete();
    return transaction;
  }
}
