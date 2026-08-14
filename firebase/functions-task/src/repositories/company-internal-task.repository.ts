import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import {
  DEFAULT_COMPANY_INTERNAL_TASK_COLOR,
  CompanyInternalTaskDocument,
} from "../types/company-internal-task.document";
import {
  CompanyInternalTaskDTO,
  SaveCompanyInternalTaskDTO,
} from "../types/company-internal-task.dto";

function toDTO(
  id: string,
  data: CompanyInternalTaskDocument,
): CompanyInternalTaskDTO {
  return {
    companyInternalTaskId: id,
    companyId: data.companyId,
    createdBy: data.createdBy,
    title: data.title,
    description: data.description,
    color: data.color ?? DEFAULT_COMPANY_INTERNAL_TASK_COLOR,
    dueDate: data.dueDate.toMillis(),
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

/**
 * Firestore: `companies/{companyId}/company_internal_tasks`.
 */
export class CompanyInternalTaskRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("company_internal_tasks");
  }

  static async listByUser(
    companyId: string,
    uid: string,
  ): Promise<CompanyInternalTaskDTO[]> {
    const snap = await this.col(companyId)
      .where("createdBy", "==", uid)
      .get();
    return snap.docs.map((doc) =>
      toDTO(doc.id, doc.data() as CompanyInternalTaskDocument),
    );
  }

  /**
   * Upsert, ownership-checked: an existing doc not owned by `uid` (or missing)
   * throws `permission-denied` "Tarefa interna não encontrada." — a known
   * inconsistency with the `not-found` code used elsewhere in this codebase.
   */
  static async save(
    companyId: string,
    uid: string,
    data: SaveCompanyInternalTaskDTO,
  ): Promise<CompanyInternalTaskDTO> {
    const { companyInternalTaskId, companyId: _companyId, ...rest } = data;
    const col = this.col(companyId);
    const ref = companyInternalTaskId
      ? col.doc(companyInternalTaskId)
      : col.doc();
    const isNew = !companyInternalTaskId;

    if (!isNew) {
      const existing = await ref.get();
      if (
        !existing.exists ||
        (existing.data() as CompanyInternalTaskDocument).createdBy !== uid
      ) {
        throw new HttpsError(
          "permission-denied",
          "Tarefa interna não encontrada.",
        );
      }
    }

    await ref.set(
      {
        companyId,
        createdBy: uid,
        title: rest.title,
        description: rest.description,
        color: rest.color ?? DEFAULT_COMPANY_INTERNAL_TASK_COLOR,
        dueDate: Timestamp.fromMillis(rest.dueDate),
        updatedAt: FieldValue.serverTimestamp(),
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    return toDTO(saved.id, saved.data() as CompanyInternalTaskDocument);
  }

  /**
   * Ownership-checked: a missing or not-owned doc throws `permission-denied`
   * "Tarefa interna não encontrada." — a known inconsistency with the
   * `not-found` code used elsewhere in this codebase.
   */
  static async delete(
    companyId: string,
    uid: string,
    companyInternalTaskId: string,
  ): Promise<void> {
    const ref = this.col(companyId).doc(companyInternalTaskId);
    const snap = await ref.get();
    if (
      !snap.exists ||
      (snap.data() as CompanyInternalTaskDocument).createdBy !== uid
    ) {
      throw new HttpsError(
        "permission-denied",
        "Tarefa interna não encontrada.",
      );
    }
    await ref.delete();
  }
}
