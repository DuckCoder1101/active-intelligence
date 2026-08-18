import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import { OriginDocument, DEFAULT_ORIGIN_NAMES } from "../types/origin.document";
import { OriginDTO, SaveOriginDTO } from "../types/origin.dto";

function toDTO(id: string, data: OriginDocument): OriginDTO {
  return { originId: id, name: data.name };
}

/**
 * Firestore: `companies/{companyId}/crm_origins`.
 */
export class OriginRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("crm_origins");
  }

  private static leadsCol(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("leads");
  }

  /** Transactionally seeds `DEFAULT_ORIGIN_NAMES` on first read if the collection is empty. */
  static async listAll(companyId: string): Promise<OriginDTO[]> {
    const col = this.col(companyId);

    return database.runTransaction(async (transaction) => {
      const snap = await transaction.get(col);

      if (snap.empty) {
        const seededRefs = DEFAULT_ORIGIN_NAMES.map((name) => {
          const ref = col.doc();
          transaction.set(ref, {
            companyId,
            name,
            createdAt: FieldValue.serverTimestamp(),
          });
          return { ref, name };
        });

        return seededRefs.map(({ ref, name }) => ({ originId: ref.id, name }));
      }

      return snap.docs
        .map((doc) => toDTO(doc.id, doc.data() as OriginDocument))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  static async save(
    companyId: string,
    data: SaveOriginDTO,
  ): Promise<OriginDTO> {
    const ref = this.col(companyId).doc();
    await ref.set({
      companyId,
      name: data.name,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { originId: ref.id, name: data.name };
  }

  /** Blocks deletion (`failed-precondition`) if the origin is referenced by any lead. */
  static async delete(companyId: string, originId: string): Promise<void> {
    const ref = this.col(companyId).doc(originId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Origem não encontrada.");
    }

    const inUse = await this.leadsCol(companyId)
      .where("originId", "==", originId)
      .limit(1)
      .get();
    if (!inUse.empty) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir uma origem em uso por leads.",
      );
    }

    await ref.delete();
  }
}
