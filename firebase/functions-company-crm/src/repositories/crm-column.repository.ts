import {HttpsError} from "firebase-functions/https";
import {FieldValue} from "firebase-admin/firestore";

import {database} from "functions-shared";
import {
  CrmColumnDocument,
  DEFAULT_CRM_COLUMNS,
} from "../types/crm-column.document";
import {CrmColumnDTO, SaveCrmColumnDTO} from "../types/crm-column.dto";

export class CrmColumnRepository {
  private static col = database.collection("crm_columns");
  private static leadsCol = database.collection("leads");

  static async listAll(companyId: string): Promise<CrmColumnDTO[]> {
    const snap = await this.col.where("companyId", "==", companyId).get();

    if (snap.empty) {
      const batch = database.batch();
      const seededRefs = DEFAULT_CRM_COLUMNS.map((column) => {
        const ref = this.col.doc();
        batch.set(ref, {
          companyId,
          name: column.name,
          color: column.color,
          order: column.order,
          createdAt: FieldValue.serverTimestamp(),
        });
        return {ref, column};
      });
      await batch.commit();

      return seededRefs
        .map(({ref, column}) => ({
          columnId: ref.id,
          name: column.name,
          color: column.color,
          order: column.order,
        }))
        .sort((a, b) => a.order - b.order);
    }

    return snap.docs
      .map((doc) => {
        const data = doc.data() as CrmColumnDocument;
        return {
          columnId: doc.id,
          name: data.name,
          color: data.color,
          order: data.order,
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  static async save(
    companyId: string,
    data: SaveCrmColumnDTO,
  ): Promise<CrmColumnDTO> {
    const snap = await this.col.where("companyId", "==", companyId).get();
    const maxOrder = snap.docs.reduce(
      (max, doc) => Math.max(max, (doc.data() as CrmColumnDocument).order),
      -1,
    );

    const ref = data.columnId ? this.col.doc(data.columnId) : this.col.doc();
    const isNew = !data.columnId;

    if (!isNew) {
      const existing = await ref.get();
      if (
        !existing.exists ||
        (existing.data() as CrmColumnDocument).companyId !== companyId
      ) {
        throw new HttpsError("permission-denied", "Quadro não encontrado.");
      }
    }

    await ref.set(
      {
        companyId,
        name: data.name,
        color: data.color,
        order: data.order ?? maxOrder + 1,
        ...(isNew ? {createdAt: FieldValue.serverTimestamp()} : {}),
      },
      {merge: true},
    );

    const saved = await ref.get();
    const newData = saved.data() as CrmColumnDocument;
    return {
      columnId: saved.id,
      name: newData.name,
      color: newData.color,
      order: newData.order,
    };
  }

  static async delete(
    companyId: string,
    columnId: string,
  ): Promise<{ movedTo: string | null }> {
    const snap = await this.col.where("companyId", "==", companyId).get();
    const target = snap.docs.find((d) => d.id === columnId);
    if (!target) {
      throw new HttpsError("not-found", "Quadro não encontrado!");
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

    const leadSnap = await this.leadsCol
      .where("companyId", "==", companyId)
      .where("status", "==", columnId)
      .get();

    const batch = database.batch();
    for (const doc of leadSnap.docs) {
      batch.update(doc.ref, {
        status: fallback.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    batch.delete(this.col.doc(columnId));
    await batch.commit();

    return {movedTo: leadSnap.size > 0 ? fallback.id : null};
  }
}
