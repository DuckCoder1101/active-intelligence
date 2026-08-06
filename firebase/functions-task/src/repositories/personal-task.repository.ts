import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";

import { database } from "functions-shared";
import {
  DEFAULT_PERSONAL_TASK_COLOR,
  PersonalTaskDocument,
} from "../types/personal-task.document";
import { PersonalTaskDTO, SavePersonalTaskDTO } from "../types/personal-task.dto";

function toDTO(id: string, data: PersonalTaskDocument): PersonalTaskDTO {
  return {
    personalTaskId: id,
    companyId: data.companyId,
    createdBy: data.createdBy,
    title: data.title,
    description: data.description,
    color: data.color ?? DEFAULT_PERSONAL_TASK_COLOR,
    dueDate: data.dueDate.toMillis(),
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

/**
 * Firestore: `companies/{companyId}/personal_tasks`.
 */
export class PersonalTaskRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("personal_tasks");
  }

  static async listByUser(
    companyId: string,
    uid: string,
  ): Promise<PersonalTaskDTO[]> {
    const snap = await this.col(companyId)
      .where("createdBy", "==", uid)
      .get();
    return snap.docs.map((doc) =>
      toDTO(doc.id, doc.data() as PersonalTaskDocument),
    );
  }

  /**
   * Upsert, ownership-checked: an existing doc not owned by `uid` (or missing)
   * throws `permission-denied` "Tarefa pessoal não encontrada." — a known
   * inconsistency with the `not-found` code used elsewhere in this codebase.
   */
  static async save(
    companyId: string,
    uid: string,
    data: SavePersonalTaskDTO,
  ): Promise<PersonalTaskDTO> {
    const { personalTaskId, companyId: _companyId, ...rest } = data;
    const col = this.col(companyId);
    const ref = personalTaskId ? col.doc(personalTaskId) : col.doc();
    const isNew = !personalTaskId;

    if (!isNew) {
      const existing = await ref.get();
      if (
        !existing.exists ||
        (existing.data() as PersonalTaskDocument).createdBy !== uid
      ) {
        throw new HttpsError(
          "permission-denied",
          "Tarefa pessoal não encontrada.",
        );
      }
    }

    await ref.set(
      {
        companyId,
        createdBy: uid,
        title: rest.title,
        description: rest.description,
        color: rest.color ?? DEFAULT_PERSONAL_TASK_COLOR,
        dueDate: Timestamp.fromMillis(rest.dueDate),
        updatedAt: FieldValue.serverTimestamp(),
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    return toDTO(saved.id, saved.data() as PersonalTaskDocument);
  }

  /**
   * Ownership-checked: a missing or not-owned doc throws `permission-denied`
   * "Tarefa pessoal não encontrada." — a known inconsistency with the
   * `not-found` code used elsewhere in this codebase.
   */
  static async delete(
    companyId: string,
    uid: string,
    personalTaskId: string,
  ): Promise<void> {
    const ref = this.col(companyId).doc(personalTaskId);
    const snap = await ref.get();
    if (
      !snap.exists ||
      (snap.data() as PersonalTaskDocument).createdBy !== uid
    ) {
      throw new HttpsError(
        "permission-denied",
        "Tarefa pessoal não encontrada.",
      );
    }
    await ref.delete();
  }
}
