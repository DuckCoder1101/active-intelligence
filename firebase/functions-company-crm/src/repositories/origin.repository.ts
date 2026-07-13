import {HttpsError} from "firebase-functions/https";
import {FieldValue} from "firebase-admin/firestore";

import {database} from "functions-shared";
import {OriginDocument, DEFAULT_ORIGIN_NAMES} from "../types/origin.document";
import {OriginDTO, SaveOriginDTO} from "../types/origin.dto";

export class OriginRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("crm_origins");
  }

  static async listAll(companyId: string): Promise<OriginDTO[]> {
    const col = this.col(companyId);
    const snap = await col.get();

    if (snap.empty) {
      const batch = database.batch();
      const seededRefs = DEFAULT_ORIGIN_NAMES.map((name) => {
        const ref = col.doc();
        batch.set(ref, {
          companyId,
          name,
          createdAt: FieldValue.serverTimestamp(),
        });
        return {ref, name};
      });
      await batch.commit();

      return seededRefs.map(({ref, name}) => ({originId: ref.id, name}));
    }

    return snap.docs
      .map((doc) => {
        const data = doc.data() as OriginDocument;
        return {originId: doc.id, name: data.name};
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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
    return {originId: ref.id, name: data.name};
  }

  static async delete(companyId: string, originId: string): Promise<void> {
    const ref = this.col(companyId).doc(originId);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new HttpsError("not-found", "Origem não encontrada.");
    }
    await ref.delete();
  }
}
