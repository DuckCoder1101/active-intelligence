import { HttpsError } from "firebase-functions/https";
import { FieldValue } from "firebase-admin/firestore";

import { database } from "functions-shared";
import {
  CrmFunnelDocument,
  DEFAULT_CRM_FUNNEL_NAME,
} from "../types/crm-funnel.document";
import { CrmFunnelDTO, SaveCrmFunnelDTO } from "../types/crm-funnel.dto";
import { CrmColumnRepository } from "./crm-column.repository";

export class CrmFunnelRepository {
  private static col(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("crm_funnels");
  }

  private static columnsCol(companyId: string, funnelId: string) {
    return this.col(companyId).doc(funnelId).collection("crm_columns");
  }

  private static leadsCol(companyId: string) {
    return database.collection("companies").doc(companyId)
      .collection("leads");
  }

  static async listAll(companyId: string): Promise<CrmFunnelDTO[]> {
    const col = this.col(companyId);
    const snap = await col.get();

    if (snap.empty) {
      const ref = col.doc();
      await ref.set({
        companyId,
        name: DEFAULT_CRM_FUNNEL_NAME,
        order: 0,
        isDefault: true,
        createdAt: FieldValue.serverTimestamp(),
      });
      return [
        {
          funnelId: ref.id,
          name: DEFAULT_CRM_FUNNEL_NAME,
          order: 0,
          isDefault: true,
        },
      ];
    }

    return snap.docs
      .map((doc) => {
        const data = doc.data() as CrmFunnelDocument;
        return {
          funnelId: doc.id,
          name: data.name,
          order: data.order,
          isDefault: data.isDefault ?? false,
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  static async save(
    companyId: string,
    data: SaveCrmFunnelDTO,
  ): Promise<CrmFunnelDTO> {
    const col = this.col(companyId);
    const snap = await col.get();
    const maxOrder = snap.docs.reduce(
      (max, doc) => Math.max(max, (doc.data() as CrmFunnelDocument).order),
      -1,
    );

    const ref = data.funnelId ? col.doc(data.funnelId) : col.doc();
    const isNew = !data.funnelId;

    if (!isNew) {
      const existing = await ref.get();
      if (!existing.exists) {
        throw new HttpsError("permission-denied", "Funil não encontrado.");
      }
    }

    await ref.set(
      {
        companyId,
        name: data.name,
        order: data.order ?? maxOrder + 1,
        ...(isNew
          ? { isDefault: false, createdAt: FieldValue.serverTimestamp() }
          : {}),
      },
      { merge: true },
    );

    const saved = await ref.get();
    const newData = saved.data() as CrmFunnelDocument;
    return {
      funnelId: saved.id,
      name: newData.name,
      order: newData.order,
      isDefault: newData.isDefault ?? false,
    };
  }

  static async delete(
    companyId: string,
    funnelId: string,
  ): Promise<{ movedTo: string | null }> {
    const col = this.col(companyId);
    const snap = await col.get();
    const target = snap.docs.find((d) => d.id === funnelId);
    if (!target) {
      throw new HttpsError("not-found", "Funil não encontrado!");
    }

    if ((target.data() as CrmFunnelDocument).isDefault) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir o funil padrão.",
      );
    }

    const remaining = snap.docs.filter((d) => d.id !== funnelId);
    if (remaining.length === 0) {
      throw new HttpsError(
        "failed-precondition",
        "Não é possível excluir o último funil.",
      );
    }

    const fallback = remaining.sort(
      (a, b) =>
        (a.data() as CrmFunnelDocument).order -
        (b.data() as CrmFunnelDocument).order,
    )[0];

    const fallbackColumns = await CrmColumnRepository.listAll(
      companyId,
      fallback.id,
    );
    const fallbackFirstColumnId = fallbackColumns[0]?.columnId ?? "";

    const leadSnap = await this.leadsCol(companyId)
      .where("funnelId", "==", funnelId)
      .get();
    const columnsSnap = await this.columnsCol(companyId, funnelId).get();

    const batch = database.batch();
    for (const doc of leadSnap.docs) {
      batch.update(doc.ref, {
        funnelId: fallback.id,
        status: fallbackFirstColumnId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    for (const doc of columnsSnap.docs) {
      batch.delete(doc.ref);
    }
    batch.delete(col.doc(funnelId));
    await batch.commit();

    return { movedTo: leadSnap.size > 0 ? fallback.id : null };
  }
}
