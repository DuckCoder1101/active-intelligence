import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import { TagDocument } from "../types/tag.document";
import { TagDTO, SaveTagDTO } from "../types/tag.dto";

export class TagRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("crm_tags");
  }

  static async listAll(companyId: string): Promise<TagDTO[]> {
    const snap = await this.col(companyId).get();
    return snap.docs
      .map((doc) => {
        const data = doc.data() as TagDocument;
        return { tagId: doc.id, name: data.name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async save(companyId: string, data: SaveTagDTO): Promise<TagDTO> {
    const ref = this.col(companyId).doc();
    await ref.set({
      companyId,
      name: data.name,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { tagId: ref.id, name: data.name };
  }

  static async delete(companyId: string, tagId: string): Promise<void> {
    const ref = this.col(companyId).doc(tagId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Tag não encontrada.");
    }
    await ref.delete();
  }
}
