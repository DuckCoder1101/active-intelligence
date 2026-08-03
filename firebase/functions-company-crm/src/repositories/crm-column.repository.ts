import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import {
  CrmColumnDocument,
  DEFAULT_CRM_COLUMNS,
} from "../types/crm-column.document";
import { CrmColumnDTO, SaveCrmColumnDTO } from "../types/crm-column.dto";

function toDTO(id: string, data: CrmColumnDocument): CrmColumnDTO {
  return {
    columnId: id,
    name: data.name,
    color: data.color,
    order: data.order,
  };
}

/**
 * Firestore: `companies/{companyId}/crm_funnels/{funnelId}/crm_columns`
 * (also touches `companies/{companyId}/leads` via `leadsCol`).
 */
export class CrmColumnRepository {
  private static col(companyId: string, funnelId: string) {
    return database.collection("companies").doc(companyId)
      .collection("crm_funnels").doc(funnelId)
      .collection("crm_columns");
  }

  private static leadsCol(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("leads");
  }

  /** Transactionally seeds `DEFAULT_CRM_COLUMNS` on first read if the collection is empty. */
  static async listAll(
    companyId: string,
    funnelId: string,
  ): Promise<CrmColumnDTO[]> {
    const col = this.col(companyId, funnelId);

    return database.runTransaction(async (transaction) => {
      const snap = await transaction.get(col);

      if (snap.empty) {
        const seededRefs = DEFAULT_CRM_COLUMNS.map((column) => {
          const ref = col.doc();
          transaction.set(ref, {
            companyId,
            funnelId,
            name: column.name,
            color: column.color,
            order: column.order,
            createdAt: FieldValue.serverTimestamp(),
          });
          return { ref, column };
        });

        return seededRefs
          .map(({ ref, column }) => ({
            columnId: ref.id,
            name: column.name,
            color: column.color,
            order: column.order,
          }))
          .sort((a, b) => a.order - b.order);
      }

      return snap.docs
        .map((doc) => toDTO(doc.id, doc.data() as CrmColumnDocument))
        .sort((a, b) => a.order - b.order);
    });
  }

  static async save(
    companyId: string,
    funnelId: string,
    data: SaveCrmColumnDTO,
  ): Promise<CrmColumnDTO> {
    const col = this.col(companyId, funnelId);
    const snap = await col.get();
    const maxOrder = snap.docs.reduce(
      (max, doc) => Math.max(max, (doc.data() as CrmColumnDocument).order),
      -1,
    );

    const ref = data.columnId ? col.doc(data.columnId) : col.doc();
    const isNew = !data.columnId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("not-found", "Quadro não encontrado.");
      }
    }

    await ref.set(
      {
        companyId,
        funnelId,
        name: data.name,
        color: data.color,
        order: data.order ?? maxOrder + 1,
        ...(isNew ? { createdAt: FieldValue.serverTimestamp() } : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    return toDTO(saved.id, saved.data() as CrmColumnDocument);
  }

  /** Reassigns leads in the deleted column to a fallback column; blocks deleting the last column. */
  static async delete(
    companyId: string,
    funnelId: string,
    columnId: string,
  ): Promise<{ movedTo: string | null }> {
    const col = this.col(companyId, funnelId);
    const snap = await col.get();
    const target = snap.docs.find((d) => d.id === columnId);
    if (!target) {
      throw new HttpsError("not-found", "Quadro não encontrado.");
    }

    const remaining = snap.docs.filter((d) => d.id !== columnId);
    if (remaining.length === 0) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir o último quadro.",
      );
    }

    const fallback = remaining.sort(
      (a, b) =>
        (a.data() as CrmColumnDocument).order -
        (b.data() as CrmColumnDocument).order,
    )[0];

    const leadSnap = await this.leadsCol(companyId)
      .where("funnelId", "==", funnelId)
      .where("status", "==", columnId)
      .get();

    const batch = database.batch();
    for (const doc of leadSnap.docs) {
      batch.update(doc.ref, {
        status: fallback.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    batch.delete(col.doc(columnId));
    await batch.commit();

    return { movedTo: leadSnap.size > 0 ? fallback.id : null };
  }
}
