import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/https";

import {database} from "functions-shared";
import {TaskDocument} from "../types/task.document";
import {TaskDTO, SaveTaskDTO} from "../types/task.dto";

function toDTO(id: string, data: TaskDocument): TaskDTO {
  return {
    taskId: id,
    companyId: data.companyId,
    title: data.title,
    description: data.description,
    type: data.type,
    status: data.status,
    dueDate: data.dueDate.toMillis(),
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    assignedTo: data.assignedTo ?? [],
    referenceLinks: data.referenceLinks ?? [],
    referenceImages: data.referenceImages ?? [],
    hasMedia: data.hasMedia ?? false,
    createdAt: data.createdAt?.toMillis() ?? 0,
    updatedAt: data.updatedAt?.toMillis() ?? 0,
  };
}

export class TaskRepository {
  private static col = database.collection("tasks");

  static async save(
    data: SaveTaskDTO & { createdBy: string },
  ): Promise<TaskDTO> {
    const {taskId, createdBy, dueDate, ...rest} = data;
    const ref = taskId ? this.col.doc(taskId) : this.col.doc();
    const isNew = !taskId;

    const images = rest.referenceImages ?? [];
    const payload: Record<string, unknown> = {
      ...rest,
      createdBy,
      dueDate: Timestamp.fromMillis(dueDate),
      assignedTo: rest.assignedTo ?? [],
      referenceLinks: rest.referenceLinks ?? [],
      referenceImages: images,
      hasMedia: images.length > 0,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (isNew) {
      payload.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(payload, {merge: true});

    const snap = await ref.get();
    return toDTO(snap.id, snap.data() as TaskDocument);
  }

  static async getById(taskId: string): Promise<TaskDTO> {
    const snap = await this.col.doc(taskId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Tarefa não encontrada!");
    }
    return toDTO(snap.id, snap.data() as TaskDocument);
  }

  static async listAll(): Promise<TaskDTO[]> {
    const snap = await this.col.orderBy("dueDate", "asc").get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as TaskDocument));
  }

  static async listWithMedia(): Promise<TaskDTO[]> {
    const snap = await this.col
      .where("hasMedia", "==", true)
      .orderBy("createdAt", "asc")
      .get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as TaskDocument));
  }

  static async updateStatus(taskId: string, status: string): Promise<void> {
    const ref = this.col.doc(taskId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Tarefa não encontrada!");
    }
    await ref.update({status, updatedAt: FieldValue.serverTimestamp()});
  }

  static async delete(taskId: string): Promise<TaskDTO> {
    const ref = this.col.doc(taskId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Tarefa não encontrada!");
    }

    const task = toDTO(taskId, snap.data() as TaskDocument);
    await ref.delete();
    return task;
  }

  static async clearMedia(taskId: string): Promise<void> {
    await this.col.doc(taskId).update({
      hasMedia: false,
      referenceImages: [],
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  static async listByCompany(companyId: string): Promise<TaskDTO[]> {
    const snap = await this.col
      .where("companyId", "==", companyId)
      .orderBy("dueDate", "asc")
      .get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as TaskDocument));
  }

  static async listByCompanyAndMonth(
    companyId: string,
    year: number,
    month: number,
  ): Promise<TaskDTO[]> {
    const start = Timestamp.fromDate(new Date(year, month, 1));
    const end = Timestamp.fromDate(new Date(year, month + 1, 1));
    const snap = await this.col
      .where("companyId", "==", companyId)
      .where("dueDate", ">=", start)
      .where("dueDate", "<", end)
      .orderBy("dueDate", "asc")
      .get();
    return snap.docs.map((doc) => toDTO(doc.id, doc.data() as TaskDocument));
  }

  static async updateImages(
    taskId: string,
    companyId: string,
    images: string[],
  ): Promise<void> {
    const ref = this.col.doc(taskId);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Tarefa não encontrada.");
    }

    const data = snap.data() as TaskDocument;
    if (data.companyId !== companyId) {
      throw new HttpsError(
        "permission-denied",
        "Sem permissão para editar esta tarefa.",
      );
    }

    await ref.update({
      referenceImages: images,
      hasMedia: images.length > 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}
