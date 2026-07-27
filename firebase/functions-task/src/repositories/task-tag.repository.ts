import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import { TaskTagDocument } from "../types/task-tag.document";
import { SaveTaskTagDTO, TaskTagDTO } from "../types/task-tag.dto";

export class TaskTagRepository {
  private static col = database.collection("task_tags");

  static async listAll(): Promise<TaskTagDTO[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((doc) => {
        const data = doc.data() as TaskTagDocument;
        return { tagId: doc.id, name: data.name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async save(data: SaveTaskTagDTO): Promise<TaskTagDTO> {
    const ref = this.col.doc();
    await ref.set({
      name: data.name,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { tagId: ref.id, name: data.name };
  }

  static async delete(tagId: string): Promise<void> {
    const ref = this.col.doc(tagId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Tag não encontrada.");
    }
    await ref.delete();
  }
}
