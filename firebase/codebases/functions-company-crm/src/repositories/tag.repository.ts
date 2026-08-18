import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import { TagDocument } from "../types/tag.document";
import { TagDTO, SaveTagDTO } from "../types/tag.dto";

function toDTO(id: string, data: TagDocument): TagDTO {
  return { tagId: id, name: data.name };
}

/**
 * Firestore: `companies/{companyId}/crm_tags`.
 */
export class TagRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("crm_tags");
  }

  private static leadsCol(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("leads");
  }

  static async listAll(companyId: string): Promise<TagDTO[]> {
    const snap = await this.col(companyId).get();
    return snap.docs
      .map((doc) => toDTO(doc.id, doc.data() as TagDocument))
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

  /** Blocks deletion (`failed-precondition`) if the tag is referenced by any lead. */
  static async delete(companyId: string, tagId: string): Promise<void> {
    const ref = this.col(companyId).doc(tagId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Tag não encontrada.");
    }

    const inUse = await this.leadsCol(companyId)
      .where("tagIds", "array-contains", tagId)
      .limit(1)
      .get();
    if (!inUse.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma tag em uso por leads.",
      );
    }

    await ref.delete();
  }
}
